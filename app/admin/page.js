'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Trash2, ArrowUp, ArrowDown, Check, Download, Lock, LogOut, Save } from 'lucide-react'
import { toast } from 'sonner'

function api(path, opts = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tfs_admin_token') : null
  return fetch(`/api/${path}`, { ...opts, headers: { 'Content-Type': 'application/json', 'x-admin-token': token || '', ...(opts.headers || {}) } })
}

function Login({ onLogin }) {
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) })
    const d = await r.json()
    setLoading(false)
    if (!r.ok) { toast.error(d.error || 'Login failed'); return }
    localStorage.setItem('tfs_admin_token', d.token)
    onLogin()
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="w-full max-w-md glass rounded-2xl p-8 border border-yellow-500/30">
        <Lock className="h-10 w-10 text-yellow-500 mx-auto" />
        <h1 className="font-cinzel text-3xl font-black text-center mt-4 gold-shimmer">THE COUNCIL</h1>
        <p className="text-white/60 text-center text-sm mt-2">Speak the password to enter.</p>
        <div className="mt-6 space-y-3">
          <Input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} className="bg-black/40 border-white/20" placeholder="Password" />
          <Button onClick={submit} disabled={loading} className="btn-cta w-full py-6 rounded-full">{loading ? 'Verifying...' : 'Enter'}</Button>
        </div>
      </div>
    </div>
  )
}

function StatsCards({ stats, pollTally }) {
  if (!stats) return null
  const cards = [
    { label: 'Green Confirmed', val: stats.green.confirmed, color: 'text-emerald-400' },
    { label: 'Green Waiting', val: stats.green.waiting, color: 'text-emerald-300' },
    { label: 'Black Confirmed', val: stats.black.confirmed, color: 'text-red-500' },
    { label: 'Black Waiting', val: stats.black.waiting, color: 'text-red-400' },
    { label: 'Football Votes', val: pollTally?.football || 0, color: 'text-yellow-400' },
    { label: 'Cricket Votes', val: pollTally?.cricket || 0, color: 'text-yellow-400' },
    { label: 'Mixed Votes', val: pollTally?.mixed || 0, color: 'text-yellow-400' },
    { label: 'Total Registered', val: stats.green.confirmed + stats.green.waiting + stats.black.confirmed + stats.black.waiting, color: 'gold-shimmer' },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.label} className="glass rounded-xl p-4 border border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-white/50">{c.label}</p>
          <p className={`font-cinzel text-3xl font-black mt-2 ${c.color}`}>{c.val}</p>
        </div>
      ))}
    </div>
  )
}

function Registrations({ items, reload }) {
  const [q, setQ] = useState('')
  const filtered = items.filter(p => {
    const s = q.toLowerCase()
    return !s || p.fullName?.toLowerCase().includes(s) || p.jerseyName?.toLowerCase().includes(s) || p.email?.toLowerCase().includes(s) || p.phone?.includes(s) || String(p.jerseyNumber).includes(s)
  })
  const promote = async (id) => { await api('admin/promote', { method: 'POST', body: JSON.stringify({ id }) }); toast.success('Promoted'); reload() }
  const demote = async (id) => { await api('admin/demote', { method: 'POST', body: JSON.stringify({ id }) }); toast.success('Demoted'); reload() }
  const del = async (id) => { if (!confirm('Delete registration?')) return; await api(`admin/registrations?id=${id}`, { method: 'DELETE' }); toast.success('Deleted'); reload() }
  const exportCsv = () => {
    const token = localStorage.getItem('tfs_admin_token')
    fetch('/api/admin/export', { headers: { 'x-admin-token': token } })
      .then(r => r.blob())
      .then(b => { const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'registrations.csv'; a.click() })
  }
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, email, phone, jersey..." className="bg-black/40 border-white/20" />
        <Button onClick={exportCsv} variant="outline" className="border-yellow-500/50 text-yellow-400"><Download className="h-4 w-4 mr-2" /> CSV</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-widest text-white/60">
            <tr><th className="p-3">House</th><th className="p-3">Status</th><th className="p-3">#</th><th className="p-3">Jersey Name</th><th className="p-3">Full Name</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">Size</th><th className="p-3">Sport</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="p-3"><span className={`inline-block px-2 py-1 rounded text-xs font-bold ${p.team === 'green' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'}`}>{p.team === 'green' ? 'GREEN' : 'BLACK'}</span></td>
                <td className="p-3">{p.status === 'CONFIRMED' ? <span className="text-emerald-400">CONFIRMED</span> : <span className="text-yellow-400">WAIT #{p.position}</span>}</td>
                <td className="p-3 font-cinzel font-bold">#{p.jerseyNumber}</td>
                <td className="p-3 font-mono">{p.jerseyName}</td>
                <td className="p-3">{p.fullName}</td>
                <td className="p-3 text-white/70">{p.email}</td>
                <td className="p-3 text-white/70">{p.phone}</td>
                <td className="p-3">{p.tshirtSize}</td>
                <td className="p-3 text-white/70 capitalize">{p.sportsPreference || '-'}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {p.status === 'WAITING_LIST' && <Button size="sm" variant="ghost" onClick={() => promote(p.id)} title="Promote"><ArrowUp className="h-4 w-4 text-emerald-400" /></Button>}
                    {p.status === 'CONFIRMED' && <Button size="sm" variant="ghost" onClick={() => demote(p.id)} title="Demote"><ArrowDown className="h-4 w-4 text-yellow-400" /></Button>}
                    <Button size="sm" variant="ghost" onClick={() => del(p.id)} title="Delete"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={10} className="p-6 text-center text-white/40">No registrations yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Suggestions() {
  const [items, setItems] = useState([])
  const load = async () => { const r = await api('admin/suggestions'); const d = await r.json(); setItems(d.items || []) }
  useEffect(() => { load() }, [])
  const approve = async (id) => { await api('admin/suggestions/approve', { method: 'POST', body: JSON.stringify({ id }) }); toast.success('Approved'); load() }
  const del = async (id) => { await api(`admin/suggestions?id=${id}`, { method: 'DELETE' }); toast.success('Deleted'); load() }
  return (
    <div className="space-y-3">
      {items.map(s => (
        <div key={s.id} className="glass rounded-xl p-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-white/90 italic">&ldquo;{s.text}&rdquo;</p>
            <p className={`text-xs mt-2 ${s.team === 'green' ? 'text-emerald-400' : 'text-red-400'}`}>— {s.name} · House {s.team === 'green' ? 'Green' : 'Black'} {s.approved && <span className="ml-2 text-emerald-500">✓ APPROVED</span>}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {!s.approved && <Button size="sm" onClick={() => approve(s.id)} className="bg-emerald-700 hover:bg-emerald-600"><Check className="h-4 w-4 mr-1" /> Approve</Button>}
            <Button size="sm" variant="destructive" onClick={() => del(s.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-center text-white/40 p-8">No suggestions yet</p>}
    </div>
  )
}

function Settings() {
  const [s, setS] = useState({ eventDate: '', eventTime: '', venue: '', registrationOpen: true })
  useEffect(() => { api('settings').then(r => r.json()).then(d => setS({ eventDate: d.eventDate || '', eventTime: d.eventTime || '', venue: d.venue || '', registrationOpen: d.registrationOpen !== false })) }, [])
  const save = async () => { await api('admin/settings', { method: 'PUT', body: JSON.stringify(s) }); toast.success('Settings saved') }
  return (
    <div className="glass rounded-2xl p-8 max-w-xl space-y-4">
      <div><Label className="text-xs uppercase tracking-widest text-white/70">Event Date</Label><Input className="mt-2 bg-black/40 border-white/20" value={s.eventDate} onChange={e => setS({ ...s, eventDate: e.target.value })} placeholder="e.g., 15 March 2026" /></div>
      <div><Label className="text-xs uppercase tracking-widest text-white/70">Event Time</Label><Input className="mt-2 bg-black/40 border-white/20" value={s.eventTime} onChange={e => setS({ ...s, eventTime: e.target.value })} placeholder="e.g., 4:00 PM" /></div>
      <div><Label className="text-xs uppercase tracking-widest text-white/70">Venue</Label><Input className="mt-2 bg-black/40 border-white/20" value={s.venue} onChange={e => setS({ ...s, venue: e.target.value })} placeholder="e.g., The Turf Arena, Bangalore" /></div>
      <div className="flex items-center justify-between p-4 rounded-lg bg-black/40 border border-white/10">
        <div><p className="font-bold">Registration Status</p><p className="text-xs text-white/60">Toggle to open/close registration globally</p></div>
        <button onClick={() => setS({ ...s, registrationOpen: !s.registrationOpen })} className={`px-4 py-2 rounded-full text-xs font-bold ${s.registrationOpen ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'}`}>{s.registrationOpen ? 'OPEN' : 'CLOSED'}</button>
      </div>
      <Button onClick={save} className="btn-cta w-full py-6 rounded-full"><Save className="h-4 w-4 mr-2" /> Save Settings</Button>
    </div>
  )
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [stats, setStats] = useState(null)
  const [pollTally, setPollTally] = useState(null)
  const [regs, setRegs] = useState([])

  const verify = async () => {
    const token = localStorage.getItem('tfs_admin_token')
    if (!token) return
    const r = await fetch('/api/admin/verify', { headers: { 'x-admin-token': token } })
    const d = await r.json()
    if (d.ok) setAuthed(true)
  }
  const loadAll = async () => {
    const [s, p, r] = await Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/poll/results').then(r => r.json()),
      api('admin/registrations').then(r => r.json()),
    ])
    setStats(s); setPollTally(p.tally); setRegs(r.items || [])
  }
  useEffect(() => { verify() }, [])
  useEffect(() => { if (authed) loadAll() }, [authed])

  if (!authed) return <Login onLogin={() => setAuthed(true)} />

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-yellow-500">Command Center</p>
            <h1 className="font-cinzel text-3xl md:text-4xl font-black gold-shimmer">THE COUNCIL</h1>
          </div>
          <Button variant="ghost" onClick={() => { localStorage.removeItem('tfs_admin_token'); location.reload() }} className="border border-white/10"><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
        </div>
        <StatsCards stats={stats} pollTally={pollTally} />
        <Tabs defaultValue="reg" className="mt-8">
          <TabsList className="bg-black/40 border border-white/10">
            <TabsTrigger value="reg">Registrations</TabsTrigger>
            <TabsTrigger value="sug">Suggestions</TabsTrigger>
            <TabsTrigger value="set">Event Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="reg" className="mt-6"><Registrations items={regs} reload={loadAll} /></TabsContent>
          <TabsContent value="sug" className="mt-6"><Suggestions /></TabsContent>
          <TabsContent value="set" className="mt-6"><Settings /></TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
