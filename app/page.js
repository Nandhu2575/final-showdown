'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Sword, ChevronRight, ChevronLeft, Flame, Loader2, Check, Share2 } from 'lucide-react'
import { toast } from 'sonner'

const GREEN = { id: 'green', name: 'HOUSE GREEN', sigil: '🐉', side: "Bride's Side", leader: 'MAIDHILY', accent: 'from-emerald-500 to-green-800', text: 'text-emerald-400', border: 'border-emerald-500', glow: 'text-glow-green', shimmer: 'gold-shimmer' }
const BLACK = { id: 'black', name: 'HOUSE BLACK', sigil: '⚔️', side: "Groom's Side", leader: 'HRITHWIK', accent: 'from-red-700 to-black', text: 'text-red-500', border: 'border-red-600', glow: 'text-glow-red', shimmer: 'silver-shimmer' }
const TSHIRT_SIZES = ['XS','S','M','L','XL','XXL']

function Particles({ color = 'emerald' }) {
  const items = useMemo(() => Array.from({ length: 25 }).map(() => ({
    left: Math.random() * 100, duration: 8 + Math.random() * 12, delay: Math.random() * 10, size: 2 + Math.random() * 4,
  })), [])
  const colorMap = { emerald: 'bg-emerald-400', red: 'bg-red-500', gold: 'bg-yellow-400' }
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((p, i) => (
        <span key={i} className={`particle ${colorMap[color] || colorMap.emerald}`} style={{
          left: `${p.left}%`, width: p.size, height: p.size,
          animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
          boxShadow: `0 0 ${p.size * 3}px currentColor`,
        }} />
      ))}
    </div>
  )
}

function HouseCounter({ house, data, capacity }) {
  const confirmed = data?.confirmed ?? 0
  const waiting = data?.waiting ?? 0
  const pct = Math.min(100, (confirmed / capacity) * 100)
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
      className={`glass ${house.id === 'green' ? 'glass-green' : 'glass-black'} rounded-2xl p-8 relative overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${house.accent} opacity-10`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className={`text-xs uppercase tracking-[0.3em] ${house.text} opacity-70`}>{house.side}</p>
            <h3 className={`font-cinzel text-3xl md:text-4xl font-black ${house.glow} ${house.text} mt-1`}>{house.name}</h3>
            <p className={`font-cinzel text-lg ${house.shimmer} mt-1`}>{house.leader}</p>
          </div>
          <div className="text-5xl">{house.sigil}</div>
        </div>
        <div className="mt-6 space-y-4">
          <div>
            <div className="flex justify-between text-xs uppercase tracking-wider mb-2">
              <span className="text-white/70">Confirmed Warriors</span>
              <span className={house.text}>{confirmed} / {capacity}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                className={`h-full bg-gradient-to-r ${house.accent}`} />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">On the Waiting List</span>
            <span className={`font-bold ${house.text}`}>{waiting}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function PollSection() {
  const [results, setResults] = useState({ tally: { football: 0, cricket: 0, mixed: 0 }, total: 0 })
  const [voted, setVoted] = useState(false)
  const [loading, setLoading] = useState(false)
  const options = [
    { id: 'football', label: 'Football', icon: '⚽' },
    { id: 'cricket', label: 'Cricket', icon: '🏏' },
    { id: 'mixed', label: 'Mixed Sports Day', icon: '🏆' },
  ]
  useEffect(() => {
    fetch('/api/poll/results').then(r => r.json()).then(setResults).catch(()=>{})
    if (typeof window !== 'undefined' && localStorage.getItem('tfs_voted')) setVoted(true)
  }, [])
  const vote = async (option) => {
    setLoading(true)
    let voterKey = localStorage.getItem('tfs_voterKey')
    if (!voterKey) { voterKey = crypto.randomUUID(); localStorage.setItem('tfs_voterKey', voterKey) }
    const res = await fetch('/api/poll/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ option, voterKey }) })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error || 'Vote failed'); if (res.status === 409) { setVoted(true); localStorage.setItem('tfs_voted','1') } ; return }
    setResults({ tally: data.tally, total: data.total })
    setVoted(true); localStorage.setItem('tfs_voted', '1')
    toast.success('Your decree has been recorded.')
  }
  return (
    <div className="glass rounded-2xl p-8 md:p-10">
      <p className="text-xs uppercase tracking-[0.3em] text-yellow-500 mb-2">The Council Decides</p>
      <h3 className="font-cinzel text-3xl md:text-4xl font-bold gold-shimmer mb-8">What game shall we play?</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {options.map(opt => {
          const count = results.tally[opt.id] || 0
          const pct = results.total ? (count / results.total) * 100 : 0
          return (
            <button key={opt.id} disabled={voted || loading} onClick={() => vote(opt.id)}
              className={`relative overflow-hidden rounded-xl border ${voted ? 'border-white/10 cursor-default' : 'border-white/20 hover:border-yellow-500 hover:scale-105'} bg-black/40 p-6 text-left transition-all`}>
              {voted && <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 to-yellow-400/5" style={{ width: `${pct}%` }} />}
              <div className="relative">
                <div className="text-4xl mb-3">{opt.icon}</div>
                <p className="font-cinzel text-xl font-bold">{opt.label}</p>
                {voted && <p className="mt-3 text-sm text-yellow-400">{count} votes · {pct.toFixed(0)}%</p>}
              </div>
            </button>
          )
        })}
      </div>
      {voted && <p className="text-xs text-white/40 mt-4">Total decrees cast: {results.total}</p>}
    </div>
  )
}

function SuggestionsCarousel() {
  const [items, setItems] = useState([])
  const [idx, setIdx] = useState(0)
  useEffect(() => { fetch('/api/suggestions/approved').then(r => r.json()).then(d => setItems(d.items || [])).catch(()=>{}) }, [])
  useEffect(() => {
    if (items.length < 2) return
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 4500)
    return () => clearInterval(t)
  }, [items])
  if (items.length === 0) return null
  const s = items[idx]
  return (
    <div className="glass rounded-2xl p-8 md:p-10 text-center max-w-3xl mx-auto">
      <p className="text-xs uppercase tracking-[0.3em] text-yellow-500 mb-4">Whispers from the Realm</p>
      <AnimatePresence mode="wait">
        <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
          <p className="font-cinzel text-xl md:text-2xl italic text-white/90 leading-relaxed">&ldquo;{s.text}&rdquo;</p>
          <p className={`mt-4 text-sm font-bold ${s.team === 'green' ? 'text-emerald-400' : 'text-red-500'}`}>— {s.name} of House {s.team === 'green' ? 'Green' : 'Black'}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function TeamCard({ house, onPick, stats, capacity }) {
  const isGreen = house.id === 'green'
  const c = stats?.[house.id] || { confirmed: 0, waiting: 0 }
  const full = c.confirmed >= capacity
  return (
    <motion.button onClick={() => onPick(house)} whileHover={{ scale: 1.03, y: -6 }} whileTap={{ scale: 0.98 }}
      className={`relative group overflow-hidden rounded-3xl border-2 ${house.border} aspect-[3/4] md:aspect-[4/5] w-full max-w-md`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${house.accent}`} />
      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all" />
      <div className={`absolute inset-0 ${isGreen ? 'smoke-green' : 'smoke-red'} opacity-70`} />
      <Particles color={isGreen ? 'emerald' : 'red'} />
      <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="text-7xl mb-4">{house.sigil}</div>
        <p className={`text-xs uppercase tracking-[0.3em] ${house.text}`}>{house.side}</p>
        <h3 className={`font-cinzel text-4xl md:text-5xl font-black mt-2 ${house.glow} ${house.text}`}>{house.name}</h3>
        <p className={`font-cinzel text-2xl mt-3 ${house.shimmer}`}>{house.leader}</p>
        <div className="mt-8 flex items-center gap-6 text-sm">
          <div><div className={`text-2xl font-bold ${house.text}`}>{c.confirmed}/{capacity}</div><div className="text-xs text-white/60 uppercase tracking-wider">Confirmed</div></div>
          <div className="h-8 w-px bg-white/20" />
          <div><div className={`text-2xl font-bold ${house.text}`}>{c.waiting}</div><div className="text-xs text-white/60 uppercase tracking-wider">Waiting</div></div>
        </div>
        <div className={`mt-8 px-6 py-3 rounded-full ${full ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/50' : `bg-white/5 ${house.text} border ${house.border}`}`}>
          {full ? 'Join Waiting List' : 'Pledge Allegiance'} <ChevronRight className="inline ml-1 h-4 w-4" />
        </div>
      </div>
    </motion.button>
  )
}

function JerseyGrid({ team, value, onChange, taken }) {
  const isGreen = team === 'green'
  const cells = Array.from({ length: 99 }, (_, i) => i + 1)
  return (
    <div className="grid grid-cols-10 gap-1.5 md:gap-2">
      {cells.map(n => {
        const isTaken = taken.includes(n)
        const isSelected = value === n
        const cls = isTaken ? 'jersey-cell-taken' : isSelected ? (isGreen ? 'jersey-cell-green-selected' : 'jersey-cell-black-selected') : (isGreen ? 'jersey-cell-green-available' : 'jersey-cell-black-available')
        return (
          <button key={n} type="button" disabled={isTaken} onClick={() => onChange(n)}
            className={`jersey-cell h-9 md:h-11 rounded-md border text-xs md:text-sm font-bold ${cls}`}>{n}</button>
        )
      })}
    </div>
  )
}

function Confetti() {
  const items = useMemo(() => Array.from({ length: 80 }).map(() => ({
    left: Math.random() * 100, delay: Math.random() * 1.5, dur: 3 + Math.random() * 3,
    color: ['#10b981','#dc143c','#d4af37','#c0c0c0','#ffffff'][Math.floor(Math.random()*5)],
    size: 6 + Math.random() * 10,
  })), [])
  return (<>{items.map((c, i) => (
    <span key={i} className="confetti" style={{ left: `${c.left}%`, background: c.color, width: c.size, height: c.size * 0.4, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }} />
  ))}</>)
}

function PlayerCard({ player }) {
  const house = player.team === 'green' ? GREEN : BLACK
  const isGreen = player.team === 'green'
  return (
    <motion.div initial={{ opacity: 0, scale: 0.85, rotateX: -20 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} transition={{ duration: 0.9, type: 'spring' }}
      className={`relative w-full max-w-md mx-auto rounded-3xl overflow-hidden border-2 ${house.border} pulse-glow`}
      style={{ color: isGreen ? '#10b981' : '#dc143c' }}>
      <div className={`absolute inset-0 bg-gradient-to-br ${house.accent}`} />
      <div className="absolute inset-0 bg-black/70" />
      <div className={`absolute inset-0 ${isGreen ? 'smoke-green' : 'smoke-red'}`} />
      <div className="relative p-8 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">The Final Showdown</p>
        <div className="my-3 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <p className={`font-cinzel text-2xl font-black ${house.glow} ${house.text}`}>{house.name}</p>
        <p className={`font-cinzel text-sm mt-1 ${house.shimmer}`}>{house.side} · {house.leader}</p>

        <div className="mt-8 mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Jersey Name</p>
          <h2 className={`font-cinzel text-4xl md:text-5xl font-black mt-2 ${house.glow} ${house.text} break-words`}>{player.jerseyName}</h2>
        </div>

        <div className={`mx-auto w-32 h-32 rounded-full flex items-center justify-center border-4 ${house.border} bg-black/50`}>
          <div className="text-center">
            <p className="text-xs text-white/50 uppercase">Jersey</p>
            <p className={`font-cinzel text-5xl font-black ${house.text}`}>#{player.jerseyNumber}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <p className="text-xs text-white/50 uppercase tracking-wider">Size</p>
            <p className="font-cinzel text-xl font-bold text-white">{player.tshirtSize}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <p className="text-xs text-white/50 uppercase tracking-wider">Sport</p>
            <p className="font-cinzel text-xl font-bold text-white capitalize">{player.sportsPreference || 'Any'}</p>
          </div>
        </div>

        <div className="mt-8">
          {player.status === 'CONFIRMED' ? (
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r ${house.accent} text-white font-bold tracking-widest uppercase text-sm`}>
              <Check className="h-4 w-4" /> Confirmed Warrior
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-yellow-600/30 border border-yellow-500/60 text-yellow-300 font-bold tracking-widest uppercase text-sm">
              <Flame className="h-4 w-4" /> Waiting List #{player.position}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function Hero({ onJoin, stats, capacity }) {
  return (
    <section className="relative min-h-screen hero-bg overflow-hidden cinematic-grain">
      <div className="absolute inset-0 smoke-green" style={{ left: '-10%', width: '60%' }} />
      <div className="absolute inset-0 smoke-red" style={{ right: '-10%', width: '60%', left: 'auto' }} />
      <Particles color="gold" />
      <div className="relative z-10 container mx-auto px-6 pt-20 pb-32 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <p className="text-xs md:text-sm uppercase tracking-[0.5em] text-yellow-500/90">A Pre-Wedding Rivalry</p>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.2 }}
          className="font-cinzel text-5xl md:text-7xl lg:text-8xl font-black mt-6 tracking-tight">
          <span className="block gold-shimmer text-glow-gold">THE FINAL</span>
          <span className="block gold-shimmer text-glow-gold mt-2">SHOWDOWN</span>
        </motion.h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }} className="mt-10 flex items-center justify-center gap-6 md:gap-12 font-cinzel text-2xl md:text-4xl">
          <span className="text-emerald-400 text-glow-green font-bold">HOUSE GREEN</span>
          <span className="text-yellow-500"><Sword className="inline h-8 w-8 md:h-10 md:w-10" /></span>
          <span className="text-red-500 text-glow-red font-bold">HOUSE BLACK</span>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.1 }}
          className="mt-8 max-w-2xl mx-auto text-base md:text-lg text-white/70 leading-relaxed">
          A pre-wedding turf rivalry where only one house reigns supreme. <br className="hidden md:block" />
          Pledge your allegiance. Claim your jersey. Write your legend.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.4 }} className="mt-12 flex flex-col items-center gap-4">
          <Button onClick={onJoin} className="btn-cta text-base md:text-lg px-10 py-7 rounded-full">
            Join Your House <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-xs uppercase tracking-widest text-white/40">11 slots per house · Then waiting list opens</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="mt-24 grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {stats && <HouseCounter house={GREEN} data={stats.green} capacity={capacity} />}
          {stats && <HouseCounter house={BLACK} data={stats.black} capacity={capacity} />}
        </motion.div>
      </div>
    </section>
  )
}

function TeamSelect({ stats, capacity, onPick, onBack }) {
  return (
    <section className="relative min-h-screen py-20 px-6 overflow-hidden">
      <div className="absolute inset-0 smoke-green" style={{ left: '-20%', width: '50%' }} />
      <div className="absolute inset-0 smoke-red" style={{ right: '-20%', width: '50%', left: 'auto' }} />
      <div className="relative container mx-auto">
        <button onClick={onBack} className="text-white/60 hover:text-white text-sm uppercase tracking-widest flex items-center gap-1 mb-8"><ChevronLeft className="h-4 w-4"/> Back</button>
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.4em] text-yellow-500">Step One</p>
          <h2 className="font-cinzel text-4xl md:text-6xl font-black mt-4 gold-shimmer">CHOOSE YOUR HOUSE</h2>
          <p className="text-white/60 mt-4 max-w-xl mx-auto">Your loyalty will be tested. Your jersey will be remembered. Your house will rise — or fall.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto place-items-center">
          <TeamCard house={GREEN} stats={stats} capacity={capacity} onPick={onPick} />
          <TeamCard house={BLACK} stats={stats} capacity={capacity} onPick={onPick} />
        </div>
      </div>
    </section>
  )
}

function RegisterForm({ team, onBack, onDone }) {
  const house = team === 'green' ? GREEN : BLACK
  const isGreen = team === 'green'
  const [form, setForm] = useState({ fullName: '', jerseyName: '', email: '', phone: '', tshirtSize: '', jerseyNumber: null, sportsPreference: '', suggestion: '' })
  const [taken, setTaken] = useState([])
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }))

  useEffect(() => { fetch(`/api/jerseys?team=${team}`).then(r => r.json()).then(d => setTaken(d.taken || [])).catch(()=>{}) }, [team])

  const submit = async () => {
    if (!form.fullName || !form.jerseyName || !form.email || !form.phone || !form.tshirtSize || !form.jerseyNumber) { toast.error('Please fill all required fields'); return }
    setLoading(true)
    const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, team }) })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error || 'Registration failed'); return }
    toast.success('Allegiance pledged!')
    onDone(data.player)
  }

  return (
    <section className="relative min-h-screen py-20 px-6 overflow-hidden">
      <div className={`absolute inset-0 ${isGreen ? 'smoke-green' : 'smoke-red'}`} />
      <Particles color={isGreen ? 'emerald' : 'red'} />
      <div className="relative container mx-auto max-w-3xl">
        <button onClick={onBack} className="text-white/60 hover:text-white text-sm uppercase tracking-widest flex items-center gap-1 mb-6"><ChevronLeft className="h-4 w-4"/> Change House</button>
        <div className="text-center mb-10">
          <p className={`text-xs uppercase tracking-[0.4em] ${house.text}`}>You have chosen</p>
          <h2 className={`font-cinzel text-4xl md:text-5xl font-black mt-2 ${house.glow} ${house.text}`}>{house.name}</h2>
          <p className={`font-cinzel text-lg mt-1 ${house.shimmer}`}>{house.leader} · {house.side}</p>
        </div>

        <div className={`glass ${isGreen ? 'glass-green' : 'glass-black'} rounded-2xl p-6 md:p-10 space-y-6`}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-white/70">Full Name *</Label>
              <Input value={form.fullName} onChange={e => set('fullName', e.target.value)} className="mt-2 bg-black/40 border-white/20" placeholder="Your true name" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-white/70">Name on Jersey * <span className="text-white/40">({form.jerseyName.length}/15)</span></Label>
              <Input maxLength={15} value={form.jerseyName} onChange={e => set('jerseyName', e.target.value.toUpperCase())} className="mt-2 bg-black/40 border-white/20 uppercase font-cinzel tracking-wider" placeholder="MAX 15 CHARS" />
            </div>
          </div>

          <div className={`mx-auto w-full max-w-xs aspect-[3/4] rounded-2xl border-2 ${house.border} bg-gradient-to-br ${house.accent} relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative h-full flex flex-col items-center justify-center p-6">
              <p className={`text-xs uppercase tracking-[0.3em] ${house.text}`}>{house.name}</p>
              <p className={`font-cinzel text-2xl md:text-3xl font-black mt-3 ${house.glow} ${house.text} text-center break-words`}>{form.jerseyName || 'YOUR NAME'}</p>
              <p className={`font-cinzel text-7xl md:text-8xl font-black mt-3 ${house.text} ${house.glow}`}>{form.jerseyNumber || '00'}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-white/70">Email *</Label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="mt-2 bg-black/40 border-white/20" placeholder="you@realm.com" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-white/70">Phone *</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} className="mt-2 bg-black/40 border-white/20" placeholder="+91 ..." />
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-white/70 mb-2 block">T-Shirt Size *</Label>
            <div className="grid grid-cols-6 gap-2">
              {TSHIRT_SIZES.map(s => (
                <button key={s} type="button" onClick={() => set('tshirtSize', s)}
                  className={`py-3 rounded-lg border text-sm font-bold transition-all ${form.tshirtSize === s ? (isGreen ? 'bg-emerald-500/90 text-black border-yellow-400' : 'bg-red-600 text-white border-gray-300') : 'bg-black/40 border-white/15 hover:border-white/40 text-white/80'}`}>{s}</button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-white/70 mb-2 block">Claim Your Jersey Number * <span className="text-white/40 normal-case">(1–99)</span></Label>
            <p className="text-xs text-white/50 mb-3">{taken.length} taken · {99 - taken.length} available in {house.name}</p>
            <JerseyGrid team={team} value={form.jerseyNumber} onChange={n => set('jerseyNumber', n)} taken={taken} />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-white/70 mb-2 block">Sports Preference (optional)</Label>
            <RadioGroup value={form.sportsPreference} onValueChange={v => set('sportsPreference', v)} className="grid grid-cols-3 gap-2">
              {['football','cricket','both'].map(s => (
                <label key={s} className={`flex items-center justify-center gap-2 py-3 rounded-lg border cursor-pointer transition-all capitalize ${form.sportsPreference === s ? (isGreen ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300' : 'border-red-500 bg-red-600/10 text-red-300') : 'border-white/15 bg-black/30 text-white/70 hover:border-white/40'}`}>
                  <RadioGroupItem value={s} className="sr-only" /> {s}
                </label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-white/70">Whispers to the Council</Label>
            <Textarea value={form.suggestion} onChange={e => set('suggestion', e.target.value)} className="mt-2 bg-black/40 border-white/20" rows={3} placeholder="Suggest games, activities, challenges, team names, or anything else." />
          </div>

          <Button onClick={submit} disabled={loading} className="btn-cta w-full py-6 text-base rounded-full">
            {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Pledging...</> : <>Take the Oath <ChevronRight className="ml-2 h-5 w-5" /></>}
          </Button>
        </div>
      </div>
    </section>
  )
}

function Success({ player, onAgain }) {
  const share = async () => {
    const text = `I have pledged allegiance to ${player.team === 'green' ? 'House Green' : 'House Black'} in The Final Showdown! Jersey #${player.jerseyNumber} — ${player.jerseyName}.`
    try {
      if (navigator.share) await navigator.share({ title: 'The Final Showdown', text })
      else { await navigator.clipboard.writeText(text); toast.success('Copied to clipboard!') }
    } catch {}
  }
  return (
    <section className="relative min-h-screen py-20 px-6 overflow-hidden flex items-center justify-center">
      <Confetti />
      <div className={`absolute inset-0 ${player.team === 'green' ? 'smoke-green' : 'smoke-red'}`} />
      <Particles color={player.team === 'green' ? 'emerald' : 'red'} />
      <div className="relative w-full max-w-xl mx-auto text-center">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-xs uppercase tracking-[0.4em] text-yellow-500 mb-2">Your Legend Begins</motion.p>
        <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="font-cinzel text-3xl md:text-5xl font-black gold-shimmer mb-8">
          {player.status === 'CONFIRMED' ? 'WELCOME, WARRIOR' : 'STAND BY, WARRIOR'}
        </motion.h2>
        <PlayerCard player={player} />
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={share} className="btn-cta px-8 py-6 rounded-full"><Share2 className="mr-2 h-4 w-4" /> Share Card</Button>
          <Button onClick={onAgain} variant="ghost" className="px-8 py-6 rounded-full border border-white/20 hover:bg-white/5 text-white">Back to Realm</Button>
        </div>
      </div>
    </section>
  )
}

const App = () => {
  const [view, setView] = useState('landing')
  const [stats, setStats] = useState(null)
  const [capacity, setCapacity] = useState(11)
  const [chosenTeam, setChosenTeam] = useState(null)
  const [player, setPlayer] = useState(null)

  const loadStats = async () => {
    try { const r = await fetch('/api/stats'); const d = await r.json(); setStats(d); setCapacity(d.capacity || 11) } catch {}
  }
  useEffect(() => { loadStats() }, [view])

  return (
    <main className="bg-black text-white">
      {view === 'landing' && (
        <>
          <Hero onJoin={() => setView('team')} stats={stats} capacity={capacity} />
          <section className="relative py-20 px-6">
            <div className="container mx-auto max-w-5xl space-y-12">
              <PollSection />
              <SuggestionsCarousel />
              <div className="text-center pt-8">
                <Button onClick={() => setView('team')} className="btn-cta px-10 py-7 rounded-full text-base">Join Your House <ChevronRight className="ml-2 h-5 w-5" /></Button>
              </div>
            </div>
          </section>
          <footer className="border-t border-white/5 py-10 text-center text-white/40 text-xs uppercase tracking-[0.3em]">
            Maidhily &times; Hrithwik &middot; The Final Showdown &middot; <a href="/admin" className="hover:text-yellow-500">Council</a>
          </footer>
        </>
      )}
      {view === 'team' && <TeamSelect stats={stats} capacity={capacity} onPick={h => { setChosenTeam(h.id); setView('register') }} onBack={() => setView('landing')} />}
      {view === 'register' && <RegisterForm team={chosenTeam} onBack={() => setView('team')} onDone={p => { setPlayer(p); setView('success') }} />}
      {view === 'success' && player && <Success player={player} onAgain={() => { setPlayer(null); setView('landing') }} />}
    </main>
  )
}

export default App
