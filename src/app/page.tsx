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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 md:gap-3 group">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-cricket-500 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-cricket-500/20 group-hover:scale-110 transition-transform">
              <span className="text-lg md:text-xl">🏏</span>
            </div>
            <span className="font-black text-base md:text-xl tracking-tight">
              KMCE<span className="text-cricket-500">Cricket</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-2 md:gap-8">
            <a href="#guide" className="px-3 py-1.5 md:px-4 md:py-2 bg-cricket-500/20 border border-cricket-500/30 text-cricket-400 rounded-lg text-xs md:text-sm font-bold hover:bg-cricket-500 hover:text-white transition-all">Guide</a>
            <a href="#rules" className="px-3 py-1.5 md:px-4 md:py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg text-xs md:text-sm font-bold hover:bg-yellow-500 hover:text-black transition-all">Rules</a>
            <a href="#about" className="hidden md:block text-sm font-bold text-slate-400 hover:text-white transition-colors">About</a>
            <a href="#schedule" className="hidden md:block text-sm font-bold text-slate-400 hover:text-white transition-colors">Schedule</a>
            <Link href="/auth/login" className="px-4 md:px-5 py-2 md:py-2.5 bg-cricket-600 hover:bg-cricket-500 text-white rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all shadow-lg shadow-cricket-600/20 min-h-[44px] flex items-center">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Scrolling Announcement Ticker */}
      <div className="fixed top-14 md:top-16 left-0 right-0 z-40 bg-yellow-500 py-2 md:py-2.5 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          <span className="mx-4 md:mx-8 font-black text-xs md:text-sm uppercase tracking-wide md:tracking-widest" style={{color: '#000'}}>🏏 CSE, CSM, ECE only</span>
          <span className="mx-4 md:mx-8 font-black text-xs md:text-sm uppercase tracking-wide md:tracking-widest" style={{color: '#000'}}>✅ Same dept players allowed</span>
          <span className="mx-4 md:mx-8 font-black text-xs md:text-sm uppercase tracking-wide md:tracking-widest" style={{color: '#000'}}>📋 Read rules first</span>
          <span className="mx-4 md:mx-8 font-black text-xs md:text-sm uppercase tracking-wide md:tracking-widest" style={{color: '#000'}}>💰 Fee: ₹3000</span>
          <span className="mx-4 md:mx-8 font-black text-xs md:text-sm uppercase tracking-wide md:tracking-widest" style={{color: '#000'}}>🏏 CSE, CSM, ECE only</span>
          <span className="mx-4 md:mx-8 font-black text-xs md:text-sm uppercase tracking-wide md:tracking-widest" style={{color: '#000'}}>✅ Same dept players allowed</span>
          <span className="mx-4 md:mx-8 font-black text-xs md:text-sm uppercase tracking-wide md:tracking-widest" style={{color: '#000'}}>📋 Read rules first</span>
          <span className="mx-4 md:mx-8 font-black text-xs md:text-sm uppercase tracking-wide md:tracking-widest" style={{color: '#000'}}>💰 Fee: ₹3000</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 md:pt-28">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-cricket-600/20 blur-[100px] md:blur-[150px] rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-indigo-600/15 blur-[80px] md:blur-[120px] rounded-full"></div>
        </div>
        
        {/* Cricket Ball Decorations */}
        <div className="absolute top-20 right-5 md:right-10 text-4xl md:text-6xl opacity-10 animate-bounce">🏏</div>
        <div className="absolute bottom-20 left-5 md:left-10 text-6xl md:text-8xl opacity-5">🏏</div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-cricket-600/10 border border-cricket-500/20 text-cricket-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-6 md:mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cricket-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cricket-500"></span>
            </span>
            Inter-Dept Championship 2026
          </div>

          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black mb-4 md:mb-6 tracking-tight leading-[0.9]">
            <span className="bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
              Cricket
            </span>
            <br />
            <span className="text-cricket-500">Championship</span>
          </h1>

          <p className="text-base md:text-2xl text-slate-400 max-w-2xl mx-auto mb-8 md:mb-12 font-medium leading-relaxed px-4">
            Build your dream team, compete against the best, and become the champion of KMCE.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 mb-6 md:mb-8 px-4">
            <button
              onClick={handleRegisterClick}
              className="px-6 md:px-10 py-4 md:py-5 bg-gradient-to-r from-cricket-600 to-cricket-500 text-white rounded-xl md:rounded-2xl font-black text-sm md:text-lg hover:scale-105 transition-all shadow-2xl shadow-cricket-600/30 active:scale-95 flex items-center justify-center gap-2 md:gap-3 min-h-[52px]"
            >
              <span>Register Your Team</span>
              <span className="text-xl md:text-2xl">🏏</span>
            </button>
            <Link
              href="/auth/login"
              className="px-6 md:px-10 py-4 md:py-5 bg-white/5 border border-white/10 text-white rounded-xl md:rounded-2xl font-bold text-sm md:text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 min-h-[52px]"
            >
              <span>Player Login</span>
              <span>→</span>
            </Link>
          </div>

          <div className="flex flex-col items-center gap-4">
            <a
              href="#rules"
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all"
            >
              <span>📋</span>
              <span>View Tournament Rules</span>
            </a>

            <Link
              href="/auth/student-register"
              className="text-xs md:text-sm text-slate-500 hover:text-cricket-400 transition-colors font-bold"
            >
              New student? <span className="underline">Register here first</span>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-cricket-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="guide" className="py-12 md:py-20 bg-gradient-to-b from-[#0a0f1a] to-[#0f172a]">
        <div className="max-w-6xl mx-auto px-3 md:px-4">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cricket-500/20 border border-cricket-500/30 rounded-full text-cricket-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-4">
              <span>📖</span>
              <span>Quick Guide</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              How It <span className="text-cricket-500">Works</span>
            </h2>
            <p className="text-sm md:text-base text-slate-400 mt-3 max-w-xl mx-auto">Follow these simple steps to register your team</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { step: 1, icon: '📝', title: 'Register', desc: 'Create your student account with hall ticket number', color: 'from-blue-500 to-cyan-500' },
              { step: 2, icon: '🔐', title: 'Login', desc: 'Sign in with your credentials', color: 'from-purple-500 to-pink-500' },
              { step: 3, icon: '👥', title: 'Create Team', desc: 'Form your squad with players from same department', color: 'from-orange-500 to-yellow-500' },
              { step: 4, icon: '💳', title: 'Pay & Done', desc: 'Complete payment and upload screenshot', color: 'from-green-500 to-emerald-500' },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="group relative bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-6 hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-sm md:text-base font-black shadow-lg`}>
                      {item.step}
                    </span>
                    <span className="text-2xl md:text-3xl group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300">{item.icon}</span>
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-black uppercase tracking-wide mb-2 group-hover:text-cricket-400 transition-colors">{item.title}</h3>
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
                
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link 
              href="/auth/student-register"
              className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-cricket-600 to-cricket-500 text-white rounded-xl md:rounded-2xl font-black text-sm md:text-base hover:scale-105 transition-all shadow-xl shadow-cricket-600/20"
            >
              <span>Start Registration Now</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12 md:py-20 bg-gradient-to-b from-[#0a0f1a] to-[#0f172a]">
        <div className="max-w-6xl mx-auto px-3 md:px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {[
              { value: settings?.registration_fee || '2500', label: 'Registration Fee', prefix: '₹' },
              { value: `${settings?.min_players || '11'}-${settings?.max_players || '15'}`, label: 'Players Per Team', prefix: '' },
              { value: settings?.start_date ? new Date(settings.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBA', label: 'Tournament Starts', prefix: '' },
              { value: '12 Overs', label: 'Format', prefix: '' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 text-center hover:bg-white/[0.08] transition-all">
                <div className="text-2xl md:text-4xl font-black text-white mb-1 md:mb-2">
                  {stat.prefix}{stat.value}
                </div>
                <div className="text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tournament Rules Section */}
      {settings?.rules_text && (
        <div id="rules" className="py-16 md:py-24 bg-gradient-to-b from-[#0f172a] to-[#1a1f35]">
          <div className="max-w-4xl mx-auto px-3 md:px-4">
            <div className="text-center mb-8 md:mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-4">
                <span>⚠️</span>
                <span>Important - Please Read</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                Tournament <span className="text-yellow-400">Rules</span>
              </h2>
            </div>
            
            <div className="bg-yellow-500/5 border-2 border-yellow-500/30 rounded-2xl md:rounded-[40px] p-6 md:p-10 relative overflow-hidden shadow-2xl shadow-yellow-500/10">
              <div className="absolute top-0 right-0 w-32 md:w-40 h-32 md:h-40 bg-yellow-500/10 blur-3xl rounded-full"></div>
              <div className="absolute bottom-0 left-0 w-24 md:w-32 h-24 md:h-32 bg-cricket-500/10 blur-3xl rounded-full"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6 md:mb-8 pb-4 border-b border-yellow-500/20">
                  <span className="text-2xl md:text-3xl">📋</span>
                  <span className="text-lg md:text-xl font-black uppercase tracking-widest text-yellow-400">Official Rules</span>
                </div>
                <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed text-white">
                  {settings.rules_text}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Section */}
      <div id="about" className="py-16 md:py-24 bg-[#0f172a]">
        <div className="max-w-6xl mx-auto px-3 md:px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <div className="text-cricket-500 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] mb-3 md:mb-4">Tournament Info</div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 md:mb-6">
                Register Your <span className="text-cricket-500">Team</span>
              </h2>
              <p className="text-sm md:text-lg text-slate-400 mb-6 md:mb-8 leading-relaxed">
                {settings?.rules || 'Form your squad from your department and compete for glory in the inter-departmental cricket championship. Build your dream team and claim victory!'}
              </p>
              
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="p-4 md:p-5 bg-white/5 rounded-xl md:rounded-2xl border border-white/10">
                  <div className="text-cricket-500 text-[9px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-2">Registration Fee</div>
                  <div className="text-xl md:text-2xl font-black text-white">₹{settings?.registration_fee || '2500'}</div>
                </div>
                <div className="p-4 md:p-5 bg-white/5 rounded-xl md:rounded-2xl border border-white/10">
                  <div className="text-cricket-500 text-[9px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-2">Squad Size</div>
                  <div className="text-xl md:text-2xl font-black text-white">{settings?.min_players || '11'}-{settings?.max_players || '15'}</div>
                </div>
                <div className="p-4 md:p-5 bg-white/5 rounded-xl md:rounded-2xl border border-white/10">
                  <div className="text-cricket-500 text-[9px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-2">Venue</div>
                  <div className="text-base md:text-lg font-black text-white truncate">{settings?.venue || 'Main Ground'}</div>
                </div>
                <div className="p-4 md:p-5 bg-white/5 rounded-xl md:rounded-2xl border border-white/10">
                  <div className="text-cricket-500 text-[9px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-2">Starts</div>
                  <div className="text-base md:text-lg font-black text-white">
                    {settings?.start_date ? new Date(settings.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBA'}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-cricket-600 to-indigo-700 rounded-3xl md:rounded-[40px] p-6 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 md:w-40 h-32 md:h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 md:w-32 h-24 md:h-32 bg-black/20 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 text-center">
                  <div className="text-5xl md:text-6xl mb-4 md:mb-6">🏏</div>
                  <div className="inline-block px-3 md:px-4 py-1 md:py-1.5 bg-white/20 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 md:mb-4">
                    Registration Open
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black mb-4 md:mb-6 uppercase">
                    Join the<br /><span className="text-white/60">Championship</span>
                  </h3>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 mb-6 md:mb-8 border border-white/10">
                    <div className="text-[10px] md:text-xs font-bold text-white/60 uppercase tracking-widest mb-1 md:mb-2">Deadline</div>
                    <div className="text-2xl md:text-3xl font-black">
                      Jan 27
                    </div>
                  </div>
                  
                  <button
                    onClick={handleRegisterClick}
                    className="w-full py-4 md:py-5 bg-white text-[#0f172a] rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:bg-white/90 transition-all shadow-2xl min-h-[52px]"
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
      <div id="schedule" className="py-16 md:py-24 bg-[#0a0f1a]">
        <div className="max-w-6xl mx-auto px-3 md:px-4">
          <div className="text-center mb-10 md:mb-16">
            <div className="text-cricket-500 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] mb-3 md:mb-4">Fixtures</div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Match <span className="text-cricket-500">Schedule</span>
            </h2>
          </div>

          {matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {matches.map((match) => (
                <div key={match.id} className="bg-white/5 border border-white/10 p-5 md:p-6 rounded-2xl md:rounded-3xl hover:bg-white/[0.08] transition-all group">
                  <div className="flex justify-between items-center mb-4 md:mb-6">
                    <div className="text-[10px] md:text-xs font-black text-cricket-400 bg-cricket-500/10 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full">
                      {new Date(match.match_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-[10px] md:text-xs font-bold text-slate-500">{match.match_time?.slice(0, 5)} IST</div>
                  </div>

                  <div className="flex items-center justify-between gap-2 md:gap-4 mb-4 md:mb-6">
                    <div className="flex-1 text-center min-w-0">
                      <div className="text-sm md:text-lg font-black text-white uppercase truncate">{match.team_a?.name || 'TBA'}</div>
                    </div>
                    <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-cricket-600/20 rounded-full text-cricket-500 text-[10px] md:text-xs font-black flex-shrink-0">
                      VS
                    </div>
                    <div className="flex-1 text-center min-w-0">
                      <div className="text-sm md:text-lg font-black text-white uppercase truncate">{match.team_b?.name || 'TBA'}</div>
                    </div>
                  </div>

                  <div className="text-center text-[10px] md:text-xs font-bold text-slate-500 pt-3 md:pt-4 border-t border-white/5 truncate">
                    📍 {match.venue || 'Main Ground'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl md:rounded-[40px] py-12 md:py-20 text-center px-4">
              <div className="text-5xl md:text-6xl mb-4 md:mb-6 opacity-20">🏏</div>
              <h3 className="text-lg md:text-2xl font-black text-slate-400 uppercase tracking-widest mb-2">Schedule Coming Soon</h3>
              <p className="text-slate-600 text-xs md:text-sm max-w-md mx-auto">
                Tournament fixtures will be announced once team registrations close. Stay tuned!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 md:py-24 bg-gradient-to-b from-[#0a0f1a] to-[#0f172a]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-5xl md:text-6xl mb-4 md:mb-6">🏆</div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 md:mb-6">
            Ready to <span className="text-cricket-500">Compete?</span>
          </h2>
          <p className="text-base md:text-xl text-slate-400 mb-8 md:mb-10 max-w-2xl mx-auto">
            Gather your team, register now, and show everyone what you're made of. The championship awaits!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
            <button
              onClick={handleRegisterClick}
              className="px-6 md:px-10 py-4 md:py-5 bg-gradient-to-r from-cricket-600 to-cricket-500 text-white rounded-xl md:rounded-2xl font-black text-sm md:text-lg hover:scale-105 transition-all shadow-2xl shadow-cricket-600/30 min-h-[52px]"
            >
              Register Your Team 🏏
            </button>
            <Link
              href="/auth/student-register"
              className="px-6 md:px-10 py-4 md:py-5 bg-white/5 border border-white/10 text-white rounded-xl md:rounded-2xl font-bold text-sm md:text-lg hover:bg-white/10 transition-all min-h-[52px] flex items-center justify-center"
            >
              New Student? Register First
            </Link>
          </div>
        </div>
      </div>

      {/* Contact Coordinators Section */}
      <div className="py-12 md:py-16 bg-gradient-to-b from-[#0f172a] to-[#0a0f1a]">
        <div className="max-w-4xl mx-auto px-3 md:px-4">
          <div className="text-center mb-8 md:mb-10">
            <div className="text-cricket-500 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] mb-3 md:mb-4">Need Help?</div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight">
              Cricket <span className="text-cricket-500">Coordinators</span>
            </h2>
            <p className="text-slate-400 mt-2 md:mt-3 text-sm md:text-base">Contact our 3rd year coordinators</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <a href="tel:6303860267" className="bg-white/5 border border-white/10 p-5 md:p-6 rounded-2xl md:rounded-3xl hover:bg-white/[0.08] transition-all group flex items-center gap-4 md:gap-5 min-h-[80px]">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-cricket-500 to-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-lg shadow-cricket-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
                📞
              </div>
              <div>
                <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5 md:mb-1">Coordinator</div>
                <div className="text-lg md:text-xl font-black text-white">Suresh</div>
                <div className="text-cricket-400 font-bold text-sm md:text-base">6303860267</div>
              </div>
            </a>
            <a href="tel:9063128733" className="bg-white/5 border border-white/10 p-5 md:p-6 rounded-2xl md:rounded-3xl hover:bg-white/[0.08] transition-all group flex items-center gap-4 md:gap-5 min-h-[80px]">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-cricket-500 to-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-lg shadow-cricket-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
                📞
              </div>
              <div>
                <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5 md:mb-1">Coordinator</div>
                <div className="text-lg md:text-xl font-black text-white">Sreeker</div>
                <div className="text-cricket-400 font-bold text-sm md:text-base">9063128733</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 md:py-12 bg-[#0a0f1a]">
        <div className="max-w-6xl mx-auto px-3 md:px-4 text-center">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-cricket-500 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center">
              <span className="text-base md:text-xl">🏏</span>
            </div>
            <span className="font-black text-base md:text-xl">KMCE<span className="text-cricket-500">Cricket</span></span>
          </div>
          <p className="text-slate-600 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-3 md:mb-4">
            Inter-Department Cricket Championship 2026
          </p>
          <div className="text-slate-700 text-[10px] md:text-xs">
            For enquiries: <span className="text-slate-500">Suresh (6303860267)</span> • <span className="text-slate-500">Sreeker (9063128733)</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
