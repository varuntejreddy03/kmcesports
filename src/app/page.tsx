'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<any[]>([])

  useEffect(() => {
    fetchSettings()
    fetchMatches()

    const channel = supabase
      .channel('landing-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        fetchMatches()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        team_a:teams!team_a_id(name),
        team_b:teams!team_b_id(name)
      `)
      .order('match_date', { ascending: true })
      .limit(6)

    if (data) setMatches(data)
  }

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('tournament_settings')
        .select('*')
        .eq('sport', 'cricket')
        .maybeSingle()

      if (data) setSettings(data)
    } catch (err) {
      console.error('Error fetching settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterClick = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const hallTicket = user.user_metadata?.hall_ticket
    if (!hallTicket) return

    if (hallTicket === 'ADMIN') {
      router.push('/admin')
      return
    }

    const { data: membership } = await supabase
      .from('team_players')
      .select('is_captain')
      .eq('hall_ticket', hallTicket)
      .maybeSingle()

    if (membership && !membership.is_captain) {
      router.push('/dashboard')
      return
    }

    router.push('/team/create')
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white selection:bg-cricket-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-cricket-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-cricket-500/20 group-hover:scale-110 transition-transform">
              <span className="text-xl">🏏</span>
            </div>
            <span className="font-black text-xl tracking-tight">
              KMCE<span className="text-cricket-500">Cricket</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">About</a>
            <a href="#schedule" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Schedule</a>
            <Link href="/auth/login" className="px-5 py-2.5 bg-cricket-600 hover:bg-cricket-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-cricket-600/20">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cricket-600/20 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/15 blur-[120px] rounded-full"></div>
        </div>
        
        {/* Cricket Ball Decorations */}
        <div className="absolute top-20 right-10 text-6xl opacity-10 animate-bounce">🏏</div>
        <div className="absolute bottom-20 left-10 text-8xl opacity-5">🏏</div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cricket-600/10 border border-cricket-500/20 text-cricket-400 text-xs font-black uppercase tracking-widest mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cricket-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cricket-500"></span>
            </span>
            Inter-Department Championship 2026
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight leading-[0.9]">
            <span className="bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
              Cricket
            </span>
            <br />
            <span className="text-cricket-500">Championship</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            Build your dream team, compete against the best, and become the undisputed champion of KMCE.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <button
              onClick={handleRegisterClick}
              className="px-10 py-5 bg-gradient-to-r from-cricket-600 to-cricket-500 text-white rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-cricket-600/30 active:scale-95 flex items-center justify-center gap-3"
            >
              <span>Register Your Team</span>
              <span className="text-2xl">🏏</span>
            </button>
            <Link
              href="/auth/login"
              className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <span>Player Login</span>
              <span>→</span>
            </Link>
          </div>

          <Link
            href="/auth/student-register"
            className="text-sm text-slate-500 hover:text-cricket-400 transition-colors font-bold"
          >
            New student? <span className="underline">Register here first</span>
          </Link>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-cricket-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-gradient-to-b from-[#0a0f1a] to-[#0f172a]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: settings?.registration_fee || '2500', label: 'Registration Fee', prefix: '₹' },
              { value: `${settings?.min_players || '11'}-${settings?.max_players || '15'}`, label: 'Players Per Team', prefix: '' },
              { value: settings?.start_date ? new Date(settings.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBA', label: 'Tournament Starts', prefix: '' },
              { value: 'T20', label: 'Format', prefix: '' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center hover:bg-white/[0.08] transition-all">
                <div className="text-3xl md:text-4xl font-black text-white mb-2">
                  {stat.prefix}{stat.value}
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="py-24 bg-[#0f172a]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-cricket-500 font-black text-xs uppercase tracking-[0.3em] mb-4">About The Tournament</div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                The Ultimate <span className="text-cricket-500">Cricket</span> Showdown
              </h2>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                {settings?.rules || 'Experience the thrill of inter-departmental cricket at its finest. Standard T20 rules apply with professional umpiring and top-quality equipment. Form your squad, showcase your skills, and compete for glory!'}
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: '🎯', title: 'T20 Format', desc: 'Fast-paced 20-over matches' },
                  { icon: '🏆', title: 'Department Battle', desc: 'CSE vs CSM showdown' },
                  { icon: '⭐', title: 'Pro Standards', desc: 'Professional umpires & gear' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-12 h-12 bg-cricket-600/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-black text-white mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-cricket-600 to-indigo-700 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 text-center">
                  <div className="text-6xl mb-6">🏏</div>
                  <div className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                    Registration Open
                  </div>
                  <h3 className="text-3xl font-black mb-6 uppercase">
                    Join the<br /><span className="text-white/60">Championship</span>
                  </h3>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 mb-8 border border-white/10">
                    <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Deadline</div>
                    <div className="text-4xl font-black">
                      {settings?.end_date ? new Date(settings.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Coming Soon'}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleRegisterClick}
                    className="w-full py-5 bg-white text-[#0f172a] rounded-2xl font-black text-lg hover:bg-white/90 transition-all shadow-2xl"
                  >
                    Register Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Section */}
      <div id="schedule" className="py-24 bg-[#0a0f1a]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="text-cricket-500 font-black text-xs uppercase tracking-[0.3em] mb-4">Fixtures</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Match <span className="text-cricket-500">Schedule</span>
            </h2>
          </div>

          {matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                <div key={match.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/[0.08] transition-all group">
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-xs font-black text-cricket-400 bg-cricket-500/10 px-3 py-1.5 rounded-full">
                      {new Date(match.match_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs font-bold text-slate-500">{match.match_time?.slice(0, 5)} IST</div>
                  </div>

                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex-1 text-center">
                      <div className="text-lg font-black text-white uppercase">{match.team_a?.name || 'TBA'}</div>
                    </div>
                    <div className="w-10 h-10 flex items-center justify-center bg-cricket-600/20 rounded-full text-cricket-500 text-xs font-black">
                      VS
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-lg font-black text-white uppercase">{match.team_b?.name || 'TBA'}</div>
                    </div>
                  </div>

                  <div className="text-center text-xs font-bold text-slate-500 pt-4 border-t border-white/5">
                    📍 {match.venue || 'Main Ground'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-[40px] py-20 text-center">
              <div className="text-6xl mb-6 opacity-20">🏏</div>
              <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest mb-2">Schedule Coming Soon</h3>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Tournament fixtures will be announced once team registrations close. Stay tuned!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-b from-[#0a0f1a] to-[#0f172a]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-6xl mb-6">🏆</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            Ready to <span className="text-cricket-500">Compete?</span>
          </h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Gather your team, register now, and show everyone what you're made of. The championship awaits!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleRegisterClick}
              className="px-10 py-5 bg-gradient-to-r from-cricket-600 to-cricket-500 text-white rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-cricket-600/30"
            >
              Register Your Team 🏏
            </button>
            <Link
              href="/auth/student-register"
              className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all"
            >
              New Student? Register First
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#0a0f1a]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-cricket-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">🏏</span>
            </div>
            <span className="font-black text-xl">KMCE<span className="text-cricket-500">Cricket</span></span>
          </div>
          <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
            Inter-Department Cricket Championship 2026
          </p>
        </div>
      </footer>
    </div>
  )
}
