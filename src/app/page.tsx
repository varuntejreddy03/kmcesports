'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

export default function Home() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

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
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-cricket-500/30">
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16 pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-cricket-600/20 blur-[120px] rounded-full -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-cricket-400 mb-6 transition-all hover:bg-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cricket-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cricket-500"></span>
            </span>
            Season 2024 is Live
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-none bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Dominate the <span className="text-cricket-500">Pitch</span>,<br />Lead Your <span className="text-cricket-500">Legacy</span>.
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            The official inter-departmental sports tournament.
            Register your team, climb the ranks, and become the undisputed champion.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/auth/login"
              className="px-10 py-4 bg-cricket-600 text-white rounded-2xl font-black text-lg hover:bg-cricket-700 transition-all shadow-xl shadow-cricket-600/30 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Start Registration <span>🚀</span>
            </Link>
            <a
              href="#cricket-info"
              className="px-10 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Tournament Info <span>ℹ️</span>
            </a>
          </div>
        </div>
      </div>

      {/* Cricket Tournament Info Section - NEW & DYNAMIC */}
      <div id="cricket-info" className="py-24 bg-white/5 relative border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-cricket-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-cricket-600/40">🏏</div>
                <h2 className="text-4xl font-black tracking-tight">Cricket Championship <span className="text-cricket-500">Details</span></h2>
              </div>

              <p className="text-lg text-slate-400 mb-10 leading-relaxed italic">
                "{settings?.rules || 'Experience the thrill of the ultimate cricket battle. Standard T20 rules apply. Professional umpires, high-quality gear, and an electric atmosphere.'}"
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-cricket-500/50 transition-colors group">
                  <div className="text-cricket-500 mb-2 font-black text-xs uppercase tracking-widest">Registration Fee</div>
                  <div className="text-3xl font-black">₹ {settings?.registration_fee || '2500'}</div>
                  <div className="text-slate-500 text-sm mt-1">Per Team Admission</div>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-cricket-500/50 transition-colors group">
                  <div className="text-cricket-500 mb-2 font-black text-xs uppercase tracking-widest">Squad size</div>
                  <div className="text-3xl font-black">{settings?.min_players || '11'} - {settings?.max_players || '15'}</div>
                  <div className="text-slate-500 text-sm mt-1">Players including subs</div>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-cricket-500/50 transition-colors group">
                  <div className="text-cricket-500 mb-2 font-black text-xs uppercase tracking-widest">Tournament Venue</div>
                  <div className="text-2xl font-black">{settings?.venue || 'Main Stadium Ground'}</div>
                  <div className="text-slate-500 text-sm mt-1">Ready for action</div>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-cricket-500/50 transition-colors group">
                  <div className="text-cricket-500 mb-2 font-black text-xs uppercase tracking-widest">Starts On</div>
                  <div className="text-3xl font-black">
                    {settings?.start_date ? new Date(settings.start_date).toLocaleDateString() : 'TBA'}
                  </div>
                  <div className="text-slate-500 text-sm mt-1">Mark your calendars</div>
                </div>
              </div>
            </div>

            <div className="relative px-4">
              <div className="bg-gradient-to-br from-cricket-600 to-indigo-700 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10 text-center">
                  <h3 className="text-3xl font-black mb-4">Registration is LIVE!</h3>
                  <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-sm border border-white/10 mb-8">
                    <p className="text-slate-200 mb-2 font-medium">Last date to register:</p>
                    <div className="text-4xl font-black tracking-tighter">
                      {settings?.end_date ? new Date(settings.end_date).toLocaleDateString() : 'Soon'}
                    </div>
                  </div>
                  <Link
                    href="/auth/login"
                    className="block w-full py-4 bg-white text-cricket-700 rounded-2xl font-black text-xl hover:bg-slate-100 transition-all shadow-xl active:scale-95"
                  >
                    Register Team Now
                  </Link>
                  <p className="mt-4 text-slate-100 text-sm opacity-80 font-medium">
                    Limited slots available! First come, first served.
                  </p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
              <div className="absolute top-1/2 -right-10 w-48 h-48 bg-cricket-500/10 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Sports Grid */}
      <div id="sports" className="max-w-7xl mx-auto px-4 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-2">Explore <span className="text-cricket-500">Sports</span></h2>
            <p className="text-slate-400 font-medium">Multiple disciplines, one spirit of excellence.</p>
          </div>
          <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {sports.map((sport) => (
            <div
              key={sport.id}
              className={`group relative rounded-[32px] p-8 border transition-all duration-500 overflow-hidden ${sport.status === 'open'
                ? 'bg-white/5 border-white/10 hover:border-cricket-500/50 hover:bg-white/[0.07] ring-1 ring-transparent hover:ring-cricket-500/20'
                : 'bg-white/[0.02] border-white/5 opacity-60 grayscale'
                }`}
            >
              <div className={`w-14 h-14 rounded-2xl ${sport.color} flex items-center justify-center text-3xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                {sport.icon}
              </div>

              <h3 className="text-2xl font-black mb-2 tracking-tight">{sport.name}</h3>
              <p className="text-slate-400 text-sm mb-8 font-medium leading-relaxed">{sport.description}</p>

              {sport.status === 'open' ? (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-cricket-400 font-black text-sm uppercase tracking-widest group-hover:gap-4 transition-all"
                >
                  Join Tournament <span className="text-xl">→</span>
                </Link>
              ) : (
                <div className="inline-flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                  Locked 🔒
                </div>
              )}

              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-cricket-500/10 transition-colors"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-xl">🏏</span>
            <span className="font-black text-lg tracking-tighter uppercase italic">KMCE<span className="text-cricket-500">SportsPortol</span></span>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            © 2024 KMCE Sports Committee. All Rights Reserved. Built for Champions.
          </p>
        </div>
      </footer>
    </div>
  )
}
