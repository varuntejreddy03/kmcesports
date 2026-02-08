'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, checkSessionTimeout, clearSessionStartTime } from '@/lib/supabase'
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
    registration_open: true,
    rules_text: '',
    min_players: 11,
    max_players: 15,
    max_teams: 16,
    venue: '',
    upi_id: '',
    payment_instructions: '',
    start_date: ''
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    checkAdminAndLoadSettings()

    const sessionCheckInterval = setInterval(() => {
      const isExpired = checkSessionTimeout()
      if (isExpired) {
        router.push('/auth/login?expired=true')
      }
    }, 60000)

    return () => clearInterval(sessionCheckInterval)
  }, [])

  const checkAdminAndLoadSettings = async () => {
    try {
      const isExpired = checkSessionTimeout()
      if (isExpired) { router.push('/auth/login?expired=true'); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { clearSessionStartTime(); router.push('/admin/login'); return }

      const hallTicket = user.user_metadata?.hall_ticket
      if (hallTicket !== 'ADMIN') { router.push('/dashboard'); return }

      setIsAdmin(true)
      const { data: tournamentData } = await supabase.from('tournament_settings').select('*').eq('sport', 'cricket').maybeSingle()

      if (tournamentData) {
        setSettings(tournamentData)
        setFormData({
          tournament_name: tournamentData.tournament_name || '',
          ground_name: tournamentData.ground_name || '',
          registration_open: tournamentData.registration_open ?? true,
          rules_text: tournamentData.rules_text || '',
          min_players: tournamentData.min_players || 11,
          max_players: tournamentData.max_players || 15,
          max_teams: tournamentData.max_teams || 16,
          venue: tournamentData.venue || tournamentData.ground_name || '',
          upi_id: tournamentData.upi_id || '',
          payment_instructions: tournamentData.payment_instructions || '',
          start_date: tournamentData.start_date || ''
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
      const dataToSave = {
        ...formData,
        sport: 'cricket',
        last_updated: new Date().toISOString(),
        start_date: formData.start_date || null
      }
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
    <div className="min-h-screen bg-[#0a0f1a] text-white selection:bg-cricket-500/30 pb-20 relative overflow-hidden">
      {/* Premium Background Decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cricket-500/10 blur-[150px] rounded-full pointer-events-none animate-pulse-slow"></div>
      <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none animate-float"></div>

      <nav className="border-b border-white/10 backdrop-blur-xl sticky top-0 z-50 bg-[#0a0f1a]/80 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="text-slate-400 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors"><span>←</span> <span className="hidden sm:inline">Back to Dashboard</span><span className="sm:hidden">Dashboard</span></Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <span className="font-black text-xl tracking-tight uppercase italic">Settings<span className="text-cricket-500">Forge</span></span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-6 md:mt-12 relative z-10">
        <div className="mb-12 md:mb-16 animate-fadeIn">
          <div className="text-cricket-500 font-black text-[10px] md:text-xs uppercase tracking-[0.4em] mb-4 bg-cricket-500/10 inline-block px-3 py-1 rounded-full border border-cricket-500/20">System Configuration</div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase italic leading-none bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">Tournament <span className="text-cricket-500">Core</span></h1>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mt-4 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-slate-800"></span> Control Global Logic & Aesthetics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Primary Controls */}
          <div className="lg:col-span-2 space-y-8 md:space-y-12">
            <section className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] md:rounded-[48px] p-6 md:p-10 space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-fadeIn">
              <div className="flex items-center gap-3 text-cricket-400 font-black text-xs uppercase tracking-widest border-b border-white/5 pb-6">
                <span className="w-8 h-8 rounded-full bg-cricket-500/10 flex items-center justify-center text-sm">📍</span>
                Identity & Location
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tournament Display Title</label>
                  <input
                    type="text"
                    value={formData.tournament_name}
                    onChange={(e) => setFormData({ ...formData, tournament_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 md:py-5 font-black uppercase italic tracking-tight text-white focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-800 hover:border-white/20"
                    placeholder="e.g. KMCE PREMIER LEAGUE"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Host Venue</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value, ground_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 md:py-5 font-black uppercase italic tracking-tight text-white focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-800 hover:border-white/20"
                    placeholder="e.g. MAIN STADIUM"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kickoff Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 md:py-5 font-black text-white focus:ring-2 focus:ring-cricket-500 outline-none transition-all"
                    />
                  </div>
                  <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest px-1">Leave empty to show as "TBA"</div>
                </div>
              </div>
            </section>

            <section className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] md:rounded-[48px] p-6 md:p-10 space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-fadeIn">
              <div className="flex items-center gap-3 text-indigo-400 font-black text-xs uppercase tracking-widest border-b border-white/5 pb-6">
                <span className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-sm">📜</span>
                Mandates & Guidelines
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Official Rules (Markdown Supported)</label>
                <textarea
                  value={formData.rules_text}
                  onChange={(e) => setFormData({ ...formData, rules_text: e.target.value })}
                  rows={8}
                  className="w-full bg-white/5 border border-white/10 rounded-[32px] px-8 py-6 font-medium text-slate-300 focus:ring-2 focus:ring-cricket-500 outline-none transition-all leading-relaxed hover:border-white/20"
                  placeholder="Enter detailed tournament rules..."
                />
              </div>
            </section>

            <section className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] md:rounded-[48px] p-6 md:p-10 space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-fadeIn">
              <div className="flex items-center gap-3 text-emerald-400 font-black text-xs uppercase tracking-widest border-b border-white/5 pb-6">
                <span className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-sm">💰</span>
                Financial Gateway
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Merchant UPI ID</label>
                  <input
                    type="text"
                    value={formData.upi_id}
                    onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 md:py-5 font-black uppercase tracking-[0.2em] text-cricket-400 focus:ring-2 focus:ring-cricket-500 outline-none hover:border-white/20"
                    placeholder="VPA@UPI"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Onboarding Notes</label>
                  <textarea
                    value={formData.payment_instructions}
                    onChange={(e) => setFormData({ ...formData, payment_instructions: e.target.value })}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-medium text-slate-400 focus:ring-2 focus:ring-cricket-500 outline-none hover:border-white/20"
                    placeholder="Instructions for team captains..."
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Metrics Sidebar */}
          <div className="space-y-8 sticky top-24 h-fit">
            <aside className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cricket-500 animate-pulse"></span>
                Squad Constraints
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white/5 p-5 rounded-3xl border border-white/5 group hover:border-cricket-500/30 transition-all">
                  <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Lower Bound</div>
                  <div className="flex items-end gap-2 text-white">
                    <input type="number" value={formData.min_players} onChange={(e) => setFormData({ ...formData, min_players: parseInt(e.target.value) })} className="bg-transparent font-black text-3xl outline-none w-20" />
                    <span className="text-[10px] font-black text-slate-700 uppercase mb-2">Athletes</span>
                  </div>
                </div>
                <div className="bg-white/5 p-5 rounded-3xl border border-white/5 group hover:border-cricket-500/30 transition-all">
                  <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Upper Bound</div>
                  <div className="flex items-end gap-2 text-white">
                    <input type="number" value={formData.max_players} onChange={(e) => setFormData({ ...formData, max_players: parseInt(e.target.value) })} className="bg-transparent font-black text-3xl outline-none w-20" />
                    <span className="text-[10px] font-black text-slate-700 uppercase mb-2">Athletes</span>
                  </div>
                </div>
              </div>
            </aside>

            <div className="px-8 py-6 bg-white/5 backdrop-blur-3xl rounded-[32px] border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all" onClick={() => setFormData({ ...formData, registration_open: !formData.registration_open })}>
              <div>
                <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Public Portal</div>
                <div className={`font-black text-xs tracking-widest ${formData.registration_open ? 'text-green-400' : 'text-red-400'}`}>
                  {formData.registration_open ? 'OPEN FOR ENTRIES' : 'FROZEN / MANUAL ONLY'}
                </div>
              </div>
              <button
                className={`w-14 h-7 rounded-full p-1.5 transition-all duration-500 ${formData.registration_open ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-500 ${formData.registration_open ? 'translate-x-7' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-8 bg-gradient-to-br from-cricket-500 via-cricket-600 to-indigo-700 text-white font-black text-xl md:text-2xl rounded-[32px] hover:scale-[1.02] shadow-[0_20px_60px_rgba(22,101,52,0.4)] transition-all active:scale-95 disabled:opacity-30 disabled:grayscale group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <span className="relative">{saving ? 'FORGING...' : 'PUBLISH CHANGES 🚀'}</span>
            </button>

            {message && (
              <div className={`p-6 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] text-center border animate-pop-in ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {message.text}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
