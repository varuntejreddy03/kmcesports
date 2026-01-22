'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, checkSessionTimeout, clearSessionStartTime } from '@/lib/supabase'
import { StudentData, Team } from '@/types'

type RegistrationStatus = 'not_registered' | 'payment_pending' | 'approval_pending' | 'approved' | 'rejected'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<StudentData | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [teamPlayers, setTeamPlayers] = useState<any[]>([])
  const [status, setStatus] = useState<RegistrationStatus>('not_registered')
  const [matches, setMatches] = useState<any[]>([])

  useEffect(() => {
    checkUser()

    const sessionCheckInterval = setInterval(() => {
      const isExpired = checkSessionTimeout()
      if (isExpired) {
        router.push('/auth/login?expired=true')
      }
    }, 60000)

    const channel = supabase
      .channel('dashboard-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        supabase
          .from('matches')
          .select(`
            *,
            team_a:teams!team_a_id(name),
            team_b:teams!team_b_id(name)
          `)
          .order('match_date', { ascending: true })
          .then(({ data }) => { if (data) setMatches(data) })
      })
      .subscribe()

    return () => {
      clearInterval(sessionCheckInterval)
      supabase.removeChannel(channel)
    }
  }, [])

  const checkUser = async () => {
    try {
      const isExpired = checkSessionTimeout()
      if (isExpired) {
        router.push('/auth/login?expired=true')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        clearSessionStartTime()
        router.push('/auth/login')
        return
      }

      const hallTicket = user.user_metadata?.hall_ticket
      if (!hallTicket) return

      const { data: studentData } = await supabase
        .from('student_data')
        .select('*')
        .eq('hall_ticket', hallTicket)
        .maybeSingle()

      if (!studentData) return
      setStudent(studentData)

      // Get team info
      const { data: playerData } = await supabase
        .from('team_players')
        .select('team_id')
        .eq('hall_ticket', studentData.hall_ticket)
        .maybeSingle()

      if (playerData) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('*')
          .eq('id', playerData.team_id)
          .single()

        if (teamData) {
          setTeam(teamData)

          // Players
          const { data: pData } = await supabase
            .from('team_players')
            .select('*')
            .eq('team_id', teamData.id)

          const hts = pData?.map(p => p.hall_ticket) || []
          const { data: sData } = await supabase
            .from('student_data')
            .select('*')
            .in('hall_ticket', hts)

          setTeamPlayers(pData?.map(p => ({
            ...p,
            student_data: sData?.find(s => s.hall_ticket === p.hall_ticket)
          })) || [])

          // Payment Status
          const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('team_id', teamData.id)
            .order('submitted_at', { ascending: false })

          const payment = payments?.[0]
          if (payment) {
            if (payment.status === 'approved') setStatus('approved')
            else if (payment.status === 'rejected') setStatus('rejected')
            else setStatus('approval_pending')
          } else {
            setStatus('payment_pending')
          }
        }
      }

      // Fetch matches
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          *,
          team_a:teams!team_a_id(name),
          team_b:teams!team_b_id(name)
        `)
        .order('match_date', { ascending: true })

      if (matchesData) setMatches(matchesData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-500"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 pb-20">
      {/* Top Header */}
      <nav className="border-b border-border backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏏</span>
            <span className="font-black text-xl tracking-tighter uppercase italic">KMCE<span className="text-cricket-500">SportsPortol</span></span>
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/auth/login') }}
            className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 mt-8 md:mt-12">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-12">
          <div>
            <div className="text-cricket-500 font-black text-xs uppercase tracking-[0.2em] mb-2">Tournament Hub</div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Hello, <span className="text-cricket-400">{student?.name.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400 font-medium mt-2">
              ID: {student?.hall_ticket} • {student?.year} Year Student
            </p>
          </div>

          <div className="flex gap-3">
            {team?.captain_id === student?.hall_ticket && (
              <Link
                href="/team/create"
                className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <span>📝</span> Edit Squad
              </Link>
            )}
            <StatusBadge status={status} />
          </div>
        </div>

        {status === 'not_registered' ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cricket-600 to-indigo-600 rounded-[40px] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[40px] text-center">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 border border-white/10">🏆</div>
              <h2 className="text-3xl font-black mb-4">You're not in a team yet!</h2>
              <p className="text-slate-400 max-w-lg mx-auto mb-10 text-lg">
                Gather your department's finest players and lead them to glory. The championship awaits its next legend.
              </p>
              <Link
                href="/team/create"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cricket-600 to-indigo-600 text-white rounded-2xl font-black text-xl hover:scale-[1.05] transition-all shadow-xl shadow-cricket-600/30"
              >
                Create Your Squad 🚀
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Team Summary */}
            <div className="lg:col-span-2 space-y-8">
              {/* Registration Alerts */}
              {status === 'payment_pending' && (
                <div className="p-1 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-3xl">
                  <div className="bg-[#0f172a] p-6 rounded-[22px] flex flex-col md:flex-row items-center gap-6 justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center text-2xl text-yellow-500">💰</div>
                      <div>
                        <h4 className="font-black text-yellow-500">Payment Required</h4>
                        <p className="text-slate-400 text-sm font-medium">Finalize your registration by completing payment.</p>
                      </div>
                    </div>
                    <Link href={`/payment?teamId=${team?.id}`} className="px-8 py-3 bg-yellow-500 text-black font-black rounded-xl hover:bg-yellow-400 transition-all text-sm">
                      Pay Now
                    </Link>
                  </div>
                </div>
              )}

              {/* Team ID Card */}
              <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden group">
                <div className="p-8 pb-4">
                  <div className="text-cricket-500 font-black text-xs uppercase tracking-widest mb-1">Active Squad</div>
                  <h3 className="text-4xl font-black tracking-tighter uppercase italic">{team?.name}</h3>
                  <div className="flex items-center gap-2 text-slate-400 mt-2 font-bold text-sm">
                    <span className="w-2 h-2 rounded-full bg-cricket-500 animate-pulse"></span>
                    Competing in {team?.sport}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border-t border-white/10">
                  <StatBox label="Squad Size" value={`${teamPlayers.length} Members`} />
                  <StatBox label="Min. Players" value="11" />
                  <StatBox label="Status" value={team?.approved ? 'Approved' : 'Pending'} />
                  <StatBox label="Sport" value={team?.sport || 'Cricket'} />
                </div>
              </div>

              {/* Squad List */}
              <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                  Team Roster
                  <span className="text-sm bg-white/10 px-3 py-1 rounded-full text-slate-400 font-bold">{teamPlayers.length}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamPlayers.map((p, idx) => (
                    <div key={idx} className="bg-white/[0.03] border border-white/5 hover:border-white/20 p-4 rounded-2xl flex items-center justify-between group transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${p.is_captain ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/10 text-white/40'}`}>
                          {p.is_captain ? '★' : idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-cricket-400 transition-colors uppercase tracking-tight">{p.student_data?.name}</div>
                          <div className="text-xs text-slate-500 font-mono font-medium">{p.hall_ticket}</div>
                        </div>
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 rounded-lg text-slate-400">{p.player_role || 'Member'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Feed / Info */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[32px] p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <h4 className="font-black text-2xl mb-4 leading-tight">Match Schedule</h4>
                <div className="space-y-4">
                  {matches.length > 0 ? (
                    matches.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                        <div className="text-xl">🏏</div>
                        <div className="flex-1">
                          <div className="text-[10px] font-black uppercase tracking-widest text-white/60">
                            {new Date(m.match_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {m.match_time.slice(0, 5)}
                          </div>
                          <div className="font-bold text-sm leading-tight text-white uppercase italic">
                            {m.team_a?.name} vs {m.team_b?.name}
                          </div>
                          <div className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-tighter">📍 {m.venue}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-4 bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                      <div className="text-2xl">⏳</div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-widest text-white/60">Status</div>
                        <div className="font-bold">Waiting for Draws</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
                <h4 className="font-black text-xs uppercase tracking-widest text-cricket-500 mb-6">Quick Links</h4>
                <div className="space-y-3">
                  <Link
                    href="/#cricket-info"
                    className="flex items-center gap-4 w-full p-4 bg-white/5 hover:bg-cricket-500/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/5 hover:border-cricket-500/20 group"
                  >
                    <span className="text-xl group-hover:scale-125 transition-transform">📜</span>
                    Tournament Rules
                  </Link>
                  <Link
                    href="/#schedule"
                    className="flex items-center gap-4 w-full p-4 bg-white/5 hover:bg-cricket-500/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/5 hover:border-cricket-500/20 group"
                  >
                    <span className="text-xl group-hover:scale-125 transition-transform">📅</span>
                    View Full Schedule
                  </Link>
                  <a
                    href="mailto:support@kmce.local"
                    className="flex items-center gap-4 w-full p-4 bg-white/5 hover:bg-cricket-500/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/5 hover:border-cricket-500/20 group"
                  >
                    <span className="text-xl group-hover:scale-125 transition-transform">💬</span>
                    Support & Help
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function StatBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-6 transition-colors hover:bg-white/[0.02]">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      <div className="text-xl font-black text-white">{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: RegistrationStatus }) {
  const configs = {
    not_registered: { text: 'Not Active', color: 'text-slate-400 bg-slate-400/10' },
    payment_pending: { text: 'Action Needed', color: 'text-yellow-500 bg-yellow-500/10 animate-pulse' },
    approval_pending: { text: 'Verifying', color: 'text-blue-400 bg-blue-400/10' },
    approved: { text: 'Confirmed', color: 'text-green-400 bg-green-400/10' },
    rejected: { text: 'Fix Entry', color: 'text-red-400 bg-red-400/10' },
  }
  const config = configs[status]

  return (
    <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 ${config.color}`}>
      {config.text}
    </span>
  )
}