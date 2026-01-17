'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface TournamentSettings {
  id: string
  tournament_name: string
  sport: string
  ground_name: string
  registration_fee: number
  max_teams: number
  registration_open: boolean
  rules_text: string
  min_players: number
  max_players: number
  start_date: string
  end_date: string
  venue: string
  upi_id: string
  payment_instructions: string
  last_updated: string
}

export default function TournamentSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [settings, setSettings] = useState<TournamentSettings | null>(null)
  const [formData, setFormData] = useState({
    tournament_name: '',
    ground_name: '',
    registration_fee: 2500,
    max_teams: 16,
    registration_open: true,
    rules_text: '',
    min_players: 11,
    max_players: 15,
    start_date: '',
    end_date: '',
    venue: '',
    upi_id: '',
    payment_instructions: ''
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    checkAdminAndLoadSettings()
  }, [])

  const checkAdminAndLoadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }

      const hallTicket = user.user_metadata?.hall_ticket
      if (hallTicket !== 'ADMIN') { router.push('/dashboard'); return }

      setIsAdmin(true)
      const { data: tournamentData } = await supabase.from('tournament_settings').select('*').eq('sport', 'cricket').maybeSingle()

      if (tournamentData) {
        setSettings(tournamentData)
        setFormData({
          tournament_name: tournamentData.tournament_name || '',
          ground_name: tournamentData.ground_name || '',
          registration_fee: tournamentData.registration_fee || 2500,
          max_teams: tournamentData.max_teams || 16,
          registration_open: tournamentData.registration_open ?? true,
          rules_text: tournamentData.rules_text || '',
          min_players: tournamentData.min_players || 11,
          max_players: tournamentData.max_players || 15,
          start_date: tournamentData.start_date || '',
          end_date: tournamentData.end_date || '',
          venue: tournamentData.venue || tournamentData.ground_name || '',
          upi_id: tournamentData.upi_id || '',
          payment_instructions: tournamentData.payment_instructions || ''
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const dataToSave = { ...formData, sport: 'cricket', last_updated: new Date().toISOString() }
      let error
      if (settings) {
        const { error: updateError } = await supabase.from('tournament_settings').update(dataToSave).eq('id', settings.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase.from('tournament_settings').insert(dataToSave)
        error = insertError
      }
      if (error) throw error
      setMessage({ type: 'success', text: 'Live settings published successfully!' })
      checkAdminAndLoadSettings()
    } catch (error: any) {
      setMessage({ type: 'error', text: `Publication failed: ${error.message}` })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-500"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-cricket-500/30 pb-20">
      <nav className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-[#020617]/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="text-slate-400 font-bold flex items-center gap-2"><span>←</span> Dashboard</Link>
          <div className="font-black text-xl tracking-tighter uppercase italic">Control<span className="text-cricket-500">Panel</span></div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-12">
        <div className="mb-12">
          <div className="text-cricket-500 font-black text-xs uppercase tracking-[0.3em] mb-2">Global Settings</div>
          <h1 className="text-5xl font-black tracking-tight uppercase italic leading-none">Tournament <span className="text-cricket-500">Forge</span></h1>
          <p className="text-slate-500 font-medium mt-4">Shape the rules, logistics, and visual data of the KMCESportsPortol.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Primary Controls */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-8">
              <div className="flex items-center gap-2 text-cricket-400 font-black text-xs uppercase tracking-widest border-b border-white/5 pb-4">
                <span>⚡</span> Identity & Location
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tournament Display Name</label>
                  <input
                    type="text"
                    value={formData.tournament_name}
                    onChange={(e) => setFormData({ ...formData, tournament_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Venue</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value, ground_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-800"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-8">
              <div className="flex items-center gap-2 text-cricket-400 font-black text-xs uppercase tracking-widest border-b border-white/5 pb-4">
                <span>📜</span> Rules & Communication
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Public Guidelines</label>
                <textarea
                  value={formData.rules_text}
                  onChange={(e) => setFormData({ ...formData, rules_text: e.target.value })}
                  rows={6}
                  className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-5 font-medium focus:ring-2 focus:ring-cricket-500 outline-none transition-all leading-relaxed"
                  placeholder="Enter rules displayed to athletes..."
                />
              </div>
            </section>

            <section className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-8">
              <div className="flex items-center gap-2 text-cricket-400 font-black text-xs uppercase tracking-widest border-b border-white/5 pb-4">
                <span>💰</span> Financial Configuration
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment UPI ID</label>
                  <input
                    type="text"
                    value={formData.upi_id}
                    onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-black uppercase tracking-widest text-cricket-400 focus:ring-2 focus:ring-cricket-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reg. Instructions</label>
                  <textarea
                    value={formData.payment_instructions}
                    onChange={(e) => setFormData({ ...formData, payment_instructions: e.target.value })}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 font-medium focus:ring-2 focus:ring-cricket-500 outline-none"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Metrics Sidebar */}
          <div className="space-y-6">
            <aside className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest">Squad Dynamics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="text-[9px] font-black text-slate-600 uppercase mb-1">Min Players</div>
                  <input type="number" value={formData.min_players} onChange={(e) => setFormData({ ...formData, min_players: parseInt(e.target.value) })} className="bg-transparent font-black text-xl outline-none w-full" />
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="text-[9px] font-black text-slate-600 uppercase mb-1">Max Players</div>
                  <input type="number" value={formData.max_players} onChange={(e) => setFormData({ ...formData, max_players: parseInt(e.target.value) })} className="bg-transparent font-black text-xl outline-none w-full" />
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="text-[9px] font-black text-slate-600 uppercase mb-1">Registration Fee</div>
                  <input type="number" value={formData.registration_fee} onChange={(e) => setFormData({ ...formData, registration_fee: parseInt(e.target.value) })} className="bg-transparent font-black text-xl outline-none w-full" />
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="text-[9px] font-black text-slate-600 uppercase mb-1">Total Slots</div>
                  <input type="number" value={formData.max_teams} onChange={(e) => setFormData({ ...formData, max_teams: parseInt(e.target.value) })} className="bg-transparent font-black text-xl outline-none w-full" />
                </div>
              </div>
            </aside>

            <aside className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest">Timeline</h4>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-600 uppercase">Tournament Launch</label>
                  <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-600 uppercase">Registration End</label>
                  <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold" />
                </div>
              </div>
            </aside>

            <div className="px-6 py-4 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase text-slate-500">Public Status</div>
                <div className="font-black text-xs">{formData.registration_open ? 'ACCEPTING ENTRIES' : 'FROZEN'}</div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, registration_open: !formData.registration_open })}
                className={`w-12 h-6 rounded-full p-1 transition-all ${formData.registration_open ? 'bg-cricket-600' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all ${formData.registration_open ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-6 bg-gradient-to-r from-cricket-600 to-indigo-600 text-white font-black text-xl rounded-[24px] hover:scale-[1.02] shadow-2xl shadow-cricket-600/30 transition-all active:scale-95 disabled:opacity-30"
            >
              {saving ? 'UPDATING...' : 'PUBLISH LIVE 🚀'}
            </button>

            {message && (
              <div className={`p-4 rounded-2xl text-[10px] font-black uppercase text-center border animate-fadeIn ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {message.text}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
