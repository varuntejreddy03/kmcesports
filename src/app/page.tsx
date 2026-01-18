'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

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

    if (data) setMatches(data)
  }

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_settings')
        .select('*')
        .eq('sport', 'cricket')
        .maybeSingle()

      if (data) {
        setSettings(data)
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const sports = [
    {
      id: 'cricket',
      name: 'Cricket',
      icon: '🏏',
      status: 'open',
      description: 'The Gentleman\'s Game',
      color: 'bg-cricket-100 text-cricket-700'
    },
    {
      id: 'football',
      name: 'Football',
      icon: '⚽',
      status: 'coming_soon',
      description: 'The Beautiful Game',
      color: 'bg-green-100 text-green-700'
    },
    {
      id: 'volleyball',
      name: 'Volleyball',
      icon: '🏐',
      status: 'coming_soon',
      description: 'Power & Precision',
      color: 'bg-orange-100 text-orange-700'
    },
    {
      id: 'badminton',
      name: 'Badminton',
      icon: '🏸',
      status: 'coming_soon',
      description: 'Speed & Agility',
      color: 'bg-blue-100 text-blue-700'
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-cricket-500/30 transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-32 pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-cricket-600/20 blur-[120px] rounded-full -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-cricket-400 mb-6 transition-all hover:bg-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cricket-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cricket-500"></span>
            </span>
            Season 2026 is Live
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-none bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Dominate the <span className="text-cricket-500">Pitch</span>,<br />Lead Your <span className="text-cricket-500">Legacy</span>.
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            The official inter-departmental sports tournament.
            Register your team, climb the ranks, and become the undisputed champion.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                  router.push('/auth/login')
                  return
                }

                const hallTicket = user.user_metadata?.hall_ticket
                if (!hallTicket) return

                if (hallTicket === 'ADMIN') {
                  alert('Administrators manage settings, only captains can register teams.')
                  return
                }

                const { data: membership } = await supabase
                  .from('team_players')
                  .select('is_captain')
                  .eq('hall_ticket', hallTicket)
                  .maybeSingle()

                if (membership && !membership.is_captain) {
                  alert('As a player, you have view-only access. Only captains can manage teams.')
                  return
                }

                router.push('/team/create')
              }}
              className="px-10 py-4 bg-cricket-600 text-white rounded-2xl font-black text-lg hover:bg-cricket-700 transition-all shadow-xl shadow-cricket-600/30 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Start Registration <span>🚀</span>
            </button>
            <a
              href="#cricket-info"
              className="px-10 py-4 bg-muted/50 border border-border text-foreground rounded-2xl font-bold text-lg hover:bg-muted transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Tournament Info <span>ℹ️</span>
            </a>
          </div>
        </div>
      </div>

      {/* Cricket Tournament Info Section */}
      <div id="cricket-info" className="py-24 bg-muted/20 relative border-y border-border transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-cricket-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-cricket-600/40">🏏</div>
                <h2 className="text-4xl font-black tracking-tight uppercase italic">Tournament <span className="text-cricket-500">Details</span></h2>
              </div>

              <p className="text-lg text-muted-foreground mb-10 leading-relaxed italic border-l-4 border-cricket-500 pl-6 bg-muted/30 py-6 rounded-r-3xl transition-colors">
                "{settings?.rules || 'Experience the thrill of the ultimate cricket battle. Standard T20 rules apply. Professional umpires, high-quality gear, and an electric atmosphere.'}"
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-muted/50 rounded-3xl border border-border hover:border-cricket-500/50 transition-all group">
                  <div className="text-cricket-500 mb-2 font-black text-xs uppercase tracking-widest">Registration Fee</div>
                  <div className="text-3xl font-black text-foreground">₹ {settings?.registration_fee || '2500'}</div>
                  <div className="text-muted-foreground text-sm mt-1 uppercase font-bold tracking-tighter">Per Team Admission</div>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-cricket-500/50 transition-colors group">
                  <div className="text-cricket-500 mb-2 font-black text-xs uppercase tracking-widest">Squad size</div>
                  <div className="text-3xl font-black text-white">{settings?.min_players || '11'} - {settings?.max_players || '15'}</div>
                  <div className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-tighter">Players including subs</div>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-cricket-500/50 transition-colors group">
                  <div className="text-cricket-500 mb-2 font-black text-xs uppercase tracking-widest">Tournament Venue</div>
                  <div className="text-2xl font-black text-white">{settings?.venue || 'Main Stadium Ground'}</div>
                  <div className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-tighter">Ready for action</div>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-cricket-500/50 transition-colors group">
                  <div className="text-cricket-500 mb-2 font-black text-xs uppercase tracking-widest">Starts On</div>
                  <div className="text-3xl font-black text-white">
                    {settings?.start_date ? new Date(settings.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
                  </div>
                  <div className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-tighter">Mark your calendars</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-cricket-600 to-indigo-700 rounded-[48px] p-8 md:p-14 shadow-2xl relative overflow-hidden group border border-white/10">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10 text-center">
                  <div className="inline-block px-4 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">Official Notice</div>
                  <h3 className="text-4xl font-black mb-6 uppercase italic text-white italic">Registration <br /><span className="text-white/60">is LIVE!</span></h3>
                  <div className="bg-muted/40 p-8 rounded-[32px] backdrop-blur-sm border border-border mb-10 shadow-inner transition-colors">
                    <p className="text-muted-foreground mb-2 font-black text-xs uppercase tracking-widest">Deadline Approaching</p>
                    <div className="text-5xl font-black tracking-tighter text-foreground">
                      {settings?.end_date ? new Date(settings.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Soon'}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser()
                      if (!user) { router.push('/auth/login'); return }
                      router.push('/team/create')
                    }}
                    className="block w-full py-6 bg-foreground text-background rounded-3xl font-black text-xl hover:opacity-90 transition-all shadow-2xl active:scale-95 text-center uppercase tracking-tighter"
                  >
                    Register Team Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Sports Grid */}
      <div id="sports" className="max-w-7xl mx-auto px-4 py-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
          <div>
            <div className="text-cricket-500 font-black text-xs uppercase tracking-[0.3em] mb-2">Available Disciplines</div>
            <h2 className="text-5xl font-black tracking-tight uppercase italic leading-none">Explore <span className="text-cricket-500">Sports</span></h2>
          </div>
          <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {sports.map((sport) => (
            <div
              key={sport.id}
              className={`group relative rounded-[40px] p-10 border transition-all duration-500 overflow-hidden ${sport.status === 'open'
                ? 'bg-muted/50 border-border hover:border-cricket-500/50 hover:bg-muted/70'
                : 'bg-muted/20 border-border opacity-50 grayscale'
                }`}
            >
              <div className={`w-16 h-16 rounded-[24px] ${sport.color} flex items-center justify-center text-4xl mb-8 shadow-2xl group-hover:rotate-12 transition-all duration-500`}>
                {sport.icon}
              </div>

              <h3 className="text-3xl font-black mb-3 tracking-tighter uppercase italic">{sport.name}</h3>
              <p className="text-muted-foreground text-sm mb-10 font-bold leading-relaxed">{sport.description}</p>

              {sport.status === 'open' ? (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-3 text-cricket-400 font-black text-xs uppercase tracking-[0.2em] group-hover:gap-5 transition-all"
                >
                  Join Now <span className="text-xl">→</span>
                </Link>
              ) : (
                <div className="inline-flex items-center gap-2 text-muted-foreground font-black text-[10px] uppercase tracking-widest bg-muted/30 px-4 py-2 rounded-full border border-border">
                  Coming Soon 🔒
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Match Schedule Section */}
      <div id="schedule" className="max-w-7xl mx-auto px-4 py-32 border-t border-border transition-colors">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
          <div>
            <div className="text-cricket-500 font-black text-xs uppercase tracking-[0.3em] mb-2">Tournament Draws</div>
            <h2 className="text-5xl font-black tracking-tight uppercase italic leading-none">Match <span className="text-cricket-500">Schedule</span></h2>
          </div>
          <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {matches.map((match) => (
            <div key={match.id} className="bg-muted/50 border border-border p-8 rounded-[40px] relative overflow-hidden group hover:bg-muted/70 transition-all shadow-sm">
              <div className="flex justify-between items-start mb-8">
                <div className="text-[10px] font-black text-cricket-400 uppercase tracking-widest bg-cricket-500/10 px-4 py-2 rounded-full border border-cricket-500/20">{new Date(match.match_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">{match.match_time.slice(0, 5)} IST</div>
              </div>

              <div className="flex items-center justify-between gap-6 mb-10">
                <div className="flex-1 text-center">
                  <div className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-2">Team A</div>
                  <div className="text-xl font-black uppercase italic text-foreground leading-tight">{match.team_a?.name}</div>
                </div>
                <div className="w-12 h-12 flex items-center justify-center bg-muted/40 rounded-full border border-border text-[10px] font-black text-cricket-500 italic">VS</div>
                <div className="flex-1 text-center">
                  <div className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-2">Team B</div>
                  <div className="text-xl font-black uppercase italic text-foreground leading-tight">{match.team_b?.name}</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pt-6 border-t border-border">
                <span className="text-cricket-500 text-sm">📍</span> {match.venue}
              </div>
            </div>
          ))}

          {matches.length === 0 && (
            <div className="col-span-full bg-muted/20 border border-dashed border-border rounded-[56px] py-24 text-center">
              <div className="text-6xl mb-6 grayscale opacity-20">🏏</div>
              <h3 className="text-2xl font-black text-muted-foreground uppercase tracking-[0.3em]">Schedule Pending</h3>
              <p className="text-muted-foreground/60 text-sm font-bold mt-4 max-w-sm mx-auto">The tournament brackets are currently being drawn. Check back soon for the official fixtures.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-20 bg-muted/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-10 group">
            <div className="w-12 h-12 bg-muted/30 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🏏</div>
            <span className="font-black text-2xl tracking-tighter uppercase italic text-foreground">KMCE<span className="text-cricket-500">Sports</span></span>
          </div>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.5em] mb-4">
            Official Athletic Governance Node • Season 2026
          </p>
          <div className="h-px w-20 bg-border mx-auto"></div>
        </div>
      </footer>
    </div>
  )
}
