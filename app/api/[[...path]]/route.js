import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb, ensureIndexes } from '@/lib/mongo'

let indexesEnsured = false
async function db() {
  const d = await getDb()
  if (!indexesEnsured) {
    try { await ensureIndexes() } catch (e) { console.error('index err', e) }
    indexesEnsured = true
  }
  return d
}

const TEAM_CAP = 11
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'showdown2025'

function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Access-Control-Allow-Origin': '*' } })
}

function checkAdmin(req) {
  const token = req.headers.get('x-admin-token')
  return token === ADMIN_PASSWORD
}

async function getStats() {
  const d = await db()
  const all = await d.collection('participants').find({}).toArray()
  const green = all.filter(p => p.team === 'green')
  const black = all.filter(p => p.team === 'black')
  return {
    green: {
      confirmed: green.filter(p => p.status === 'CONFIRMED').length,
      waiting: green.filter(p => p.status === 'WAITING_LIST').length,
    },
    black: {
      confirmed: black.filter(p => p.status === 'CONFIRMED').length,
      waiting: black.filter(p => p.status === 'WAITING_LIST').length,
    },
    capacity: TEAM_CAP,
  }
}

export async function GET(req, { params }) {
  const path = (params?.path || []).join('/')
  try {
    const d = await db()

    if (path === 'stats') return json(await getStats())

    if (path === 'jerseys') {
      const url = new URL(req.url)
      const team = url.searchParams.get('team')
      const taken = await d.collection('participants').find({ team }).project({ jerseyNumber: 1 }).toArray()
      return json({ taken: taken.map(t => t.jerseyNumber) })
    }

    if (path === 'poll/results') {
      const votes = await d.collection('poll_votes').find({}).toArray()
      const tally = { football: 0, cricket: 0, mixed: 0 }
      votes.forEach(v => { if (tally[v.option] !== undefined) tally[v.option]++ })
      return json({ tally, total: votes.length })
    }

    if (path === 'suggestions/approved') {
      const items = await d.collection('suggestions').find({ approved: true }).sort({ createdAt: -1 }).limit(30).toArray()
      return json({ items: items.map(i => ({ id: i.id, text: i.text, name: i.name, team: i.team })) })
    }

    if (path === 'settings') {
      const s = await d.collection('event_settings').findOne({ key: 'main' })
      return json(s || { eventDate: 'TBD', eventTime: 'TBD', venue: 'TBD', registrationOpen: true })
    }

    // Admin endpoints
    if (path === 'admin/verify') {
      return json({ ok: checkAdmin(req) })
    }
    if (path === 'admin/registrations') {
      if (!checkAdmin(req)) return json({ error: 'Unauthorized' }, 401)
      const all = await d.collection('participants').find({}).sort({ createdAt: 1 }).toArray()
      return json({ items: all.map(p => ({ ...p, _id: undefined })) })
    }
    if (path === 'admin/suggestions') {
      if (!checkAdmin(req)) return json({ error: 'Unauthorized' }, 401)
      const all = await d.collection('suggestions').find({}).sort({ createdAt: -1 }).toArray()
      return json({ items: all.map(s => ({ ...s, _id: undefined })) })
    }
    if (path === 'admin/export') {
      if (!checkAdmin(req)) return json({ error: 'Unauthorized' }, 401)
      const all = await d.collection('participants').find({}).sort({ team: 1, status: 1, jerseyNumber: 1 }).toArray()
      const headers = ['id','team','status','position','fullName','jerseyName','jerseyNumber','email','phone','tshirtSize','sportsPreference','suggestion','createdAt']
      const rows = all.map(p => headers.map(h => `"${String(p[h] ?? '').replace(/"/g,'""')}"`).join(','))
      const csv = [headers.join(','), ...rows].join('\n')
      return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=registrations.csv' } })
    }

    return json({ error: 'Not found' }, 404)
  } catch (e) {
    console.error('GET error', path, e)
    return json({ error: e.message }, 500)
  }
}

export async function POST(req, { params }) {
  const path = (params?.path || []).join('/')
  try {
    const d = await db()
    const body = await req.json().catch(() => ({}))

    if (path === 'register') {
      const { fullName, jerseyName, email, phone, tshirtSize, jerseyNumber, sportsPreference, suggestion, team } = body
      if (!fullName || !jerseyName || !email || !phone || !tshirtSize || !jerseyNumber || !team) {
        return json({ error: 'Missing required fields' }, 400)
      }
      if (!['green','black'].includes(team)) return json({ error: 'Invalid team' }, 400)
      if (jerseyName.length > 15) return json({ error: 'Jersey name max 15 chars' }, 400)
      const jn = parseInt(jerseyNumber)
      if (jn < 1 || jn > 99) return json({ error: 'Jersey number must be 1-99' }, 400)

      // dup checks
      const existsEmail = await d.collection('participants').findOne({ email: email.toLowerCase().trim() })
      if (existsEmail) return json({ error: 'This email is already registered. Each warrior can only join one battle.' }, 409)
      const existsPhone = await d.collection('participants').findOne({ phone: phone.trim() })
      if (existsPhone) return json({ error: 'This phone number is already registered.' }, 409)
      const jerseyTaken = await d.collection('participants').findOne({ team, jerseyNumber: jn })
      if (jerseyTaken) return json({ error: `Jersey #${jn} for House ${team === 'green' ? 'Green' : 'Black'} has already been claimed.` }, 409)

      const confirmedCount = await d.collection('participants').countDocuments({ team, status: 'CONFIRMED' })
      let status = 'CONFIRMED'
      let position = null
      if (confirmedCount >= TEAM_CAP) {
        status = 'WAITING_LIST'
        const waitCount = await d.collection('participants').countDocuments({ team, status: 'WAITING_LIST' })
        position = waitCount + 1
      }

      const doc = {
        id: uuidv4(),
        team,
        status,
        position,
        fullName: fullName.trim(),
        jerseyName: jerseyName.trim().toUpperCase(),
        jerseyNumber: jn,
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        tshirtSize,
        sportsPreference: sportsPreference || null,
        suggestion: suggestion || '',
        createdAt: new Date().toISOString(),
      }
      try {
        await d.collection('participants').insertOne(doc)
      } catch (err) {
        if (err.code === 11000) return json({ error: 'Already registered (duplicate detected).' }, 409)
        throw err
      }
      if (suggestion && suggestion.trim()) {
        await d.collection('suggestions').insertOne({
          id: uuidv4(), text: suggestion.trim(), name: doc.jerseyName, team, approved: false, createdAt: new Date().toISOString(),
        })
      }
      return json({ ok: true, player: { ...doc, _id: undefined } })
    }

    if (path === 'poll/vote') {
      const { option, voterKey } = body
      if (!['football','cricket','mixed'].includes(option)) return json({ error: 'Invalid option' }, 400)
      if (!voterKey) return json({ error: 'Missing voter key' }, 400)
      try {
        await d.collection('poll_votes').insertOne({ id: uuidv4(), option, voterKey, createdAt: new Date().toISOString() })
      } catch (err) {
        if (err.code === 11000) return json({ error: 'You have already cast your vote.' }, 409)
        throw err
      }
      const votes = await d.collection('poll_votes').find({}).toArray()
      const tally = { football: 0, cricket: 0, mixed: 0 }
      votes.forEach(v => { if (tally[v.option] !== undefined) tally[v.option]++ })
      return json({ ok: true, tally, total: votes.length })
    }

    if (path === 'admin/login') {
      if (body.password === ADMIN_PASSWORD) return json({ ok: true, token: ADMIN_PASSWORD })
      return json({ error: 'Invalid password' }, 401)
    }

    if (path === 'admin/promote') {
      if (!checkAdmin(req)) return json({ error: 'Unauthorized' }, 401)
      const { id } = body
      const p = await d.collection('participants').findOne({ id })
      if (!p) return json({ error: 'Not found' }, 404)
      await d.collection('participants').updateOne({ id }, { $set: { status: 'CONFIRMED', position: null } })
      // re-number waiting list
      const waiters = await d.collection('participants').find({ team: p.team, status: 'WAITING_LIST' }).sort({ createdAt: 1 }).toArray()
      let pos = 1
      for (const w of waiters) { await d.collection('participants').updateOne({ id: w.id }, { $set: { position: pos++ } }) }
      return json({ ok: true })
    }
    if (path === 'admin/demote') {
      if (!checkAdmin(req)) return json({ error: 'Unauthorized' }, 401)
      const { id } = body
      const p = await d.collection('participants').findOne({ id })
      if (!p) return json({ error: 'Not found' }, 404)
      const waitCount = await d.collection('participants').countDocuments({ team: p.team, status: 'WAITING_LIST' })
      await d.collection('participants').updateOne({ id }, { $set: { status: 'WAITING_LIST', position: waitCount + 1 } })
      return json({ ok: true })
    }
    if (path === 'admin/suggestions/approve') {
      if (!checkAdmin(req)) return json({ error: 'Unauthorized' }, 401)
      await d.collection('suggestions').updateOne({ id: body.id }, { $set: { approved: true } })
      return json({ ok: true })
    }

    return json({ error: 'Not found' }, 404)
  } catch (e) {
    console.error('POST error', path, e)
    return json({ error: e.message }, 500)
  }
}

export async function PUT(req, { params }) {
  const path = (params?.path || []).join('/')
  try {
    const d = await db()
    const body = await req.json().catch(() => ({}))

    if (path === 'admin/settings') {
      if (!checkAdmin(req)) return json({ error: 'Unauthorized' }, 401)
      await d.collection('event_settings').updateOne({ key: 'main' }, { $set: { ...body, key: 'main' } }, { upsert: true })
      return json({ ok: true })
    }
    if (path === 'admin/registrations') {
      if (!checkAdmin(req)) return json({ error: 'Unauthorized' }, 401)
      const { id, ...updates } = body
      delete updates._id
      await d.collection('participants').updateOne({ id }, { $set: updates })
      return json({ ok: true })
    }
    return json({ error: 'Not found' }, 404)
  } catch (e) {
    return json({ error: e.message }, 500)
  }
}

export async function DELETE(req, { params }) {
  const path = (params?.path || []).join('/')
  try {
    const d = await db()
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (path === 'admin/registrations') {
      if (!checkAdmin(req)) return json({ error: 'Unauthorized' }, 401)
      await d.collection('participants').deleteOne({ id })
      return json({ ok: true })
    }
    if (path === 'admin/suggestions') {
      if (!checkAdmin(req)) return json({ error: 'Unauthorized' }, 401)
      await d.collection('suggestions').deleteOne({ id })
      return json({ ok: true })
    }
    return json({ error: 'Not found' }, 404)
  } catch (e) {
    return json({ error: e.message }, 500)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': '*' } })
}
