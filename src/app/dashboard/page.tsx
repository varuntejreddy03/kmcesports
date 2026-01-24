'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, checkSessionTimeout, clearSessionStartTime } from '@/lib/supabase'
import { StudentData, Team } from '@/types'

const DEFAULT_DEADLINE = new Date('2026-01-27T12:30:00')

const formatDeadlineMessage = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
  const dateStr = date.toLocaleDateString('en-US', options)
  const hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${dateStr} at ${hour12}:${minutes} ${ampm}`
}

type RegistrationStatus = 'not_registered' | 'payment_pending' | 'approval_pending' | 'approved' | 'rejected'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [registrationClosed, setRegistrationClosed] = useState(false)
  const [deadlineDate, setDeadlineDate] = useState<Date>(DEFAULT_DEADLINE)
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
      // Fetch deadline from database
      const { data: settingsData } = await supabase
        .from('tournament_settings')
        .select('registration_deadline')
        .eq('sport', 'cricket')
        .maybeSingle()
      
      const deadline = settingsData?.registration_deadline 
        ? new Date(settingsData.registration_deadline)
        : DEFAULT_DEADLINE
      setDeadlineDate(deadline)
      setRegistrationClosed(new Date() > deadline)

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
    <div className="min-h-screen bg-[#0a0f1a] text-white pb-24 md:pb-20">
      {/* Top Header - Mobile Optimized */}
      <nav className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-[#0a0f1a]/90">
        <div className="max-w-7xl mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            <Link href="/" className="text-slate-400 hover:text-white font-bold text-xs md:text-sm flex items-center gap-1.5 transition-colors min-h-[44px] min-w-[44px] justify-center">
              <span>←</span> <span className="hidden sm:inline">Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl">🏏</span>
              <span className="font-black text-lg md:text-xl tracking-tight">KMCE<span className="text-cricket-500">Cricket</span></span>
            </div>
          </div>
          <button
            onClick={async () => { clearSessionStartTime(); await supabase.auth.signOut(); router.push('/auth/login') }}
            className="px-3 md:px-4 py-2.5 text-xs md:text-sm font-bold text-red-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Exit</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-3 md:px-4 mt-6 md:mt-12">
        {/* Header Section - Mobile Stack */}
        <div className="flex flex-col gap-4 md:gap-6 md:flex-row md:items-center md:justify-between mb-8 md:mb-12">
          <div className="space-y-1">
            <div className="text-cricket-500 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] mb-1">Tournament Hub</div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Hello, <span className="text-cricket-400">{student?.name.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400 font-medium text-sm md:text-base mt-1">
              {student?.hall_ticket} • {student?.year} Year
            </p>
          </div>

          {/* Action Buttons - Mobile Row */}
          <div className="flex flex-wrap gap-2 md:gap-3">
            {team?.captain_id === student?.hall_ticket && (
              <Link
                href="/team/create"
                className="px-4 md:px-6 py-3 md:py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 min-h-[44px]"
              >
                <span>📝</span> Edit Squad
              </Link>
            )}
            <StatusBadge status={status} />
          </div>
        </div>

        {status === 'not_registered' ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cricket-600 to-indigo-600 rounded-3xl md:rounded-[40px] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-12 rounded-3xl md:rounded-[40px] text-center">
              {registrationClosed ? (
                <>
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl mx-auto mb-4 md:mb-6 border border-red-500/20">⏰</div>
                  <h2 className="text-2xl md:text-3xl font-black mb-3 md:mb-4">Registration <span className="text-red-500">Closed</span></h2>
                  <p className="text-slate-400 max-w-lg mx-auto mb-6 md:mb-10 text-sm md:text-lg">
                    The registration deadline was {formatDeadlineMessage(deadlineDate)}. You can no longer create or join a team.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-2xl md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl mx-auto mb-4 md:mb-6 border border-white/10">🏆</div>
                  <h2 className="text-2xl md:text-3xl font-black mb-3 md:mb-4">You're not in a team yet!</h2>
                  <p className="text-slate-400 max-w-lg mx-auto mb-6 md:mb-10 text-sm md:text-lg">
                    Gather your department's finest players and lead them to glory. The championship awaits its next legend.
                  </p>
                  <Link
                    href="/team/create"
                    className="inline-flex items-center gap-2 md:gap-3 px-6 md:px-10 py-4 md:py-5 bg-gradient-to-r from-cricket-600 to-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-base md:text-xl hover:scale-[1.02] md:hover:scale-[1.05] transition-all shadow-xl shadow-cricket-600/30 min-h-[52px]"
                  >
                    Create Your Squad 🚀
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column: Team Summary */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              {/* Registration Alerts */}
              {status === 'payment_pending' && (
                <div className="p-0.5 md:p-1 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl md:rounded-3xl">
                  <div className="bg-[#0f172a] p-4 md:p-6 rounded-[14px] md:rounded-[22px] flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl text-yellow-500 flex-shrink-0">💰</div>
                      <div>
                        <h4 className="font-black text-yellow-500 text-sm md:text-base">Payment Required</h4>
                        <p className="text-slate-400 text-xs md:text-sm font-medium">Complete payment to finalize registration.</p>
                      </div>
                    </div>
                    <Link href={`/payment?teamId=${team?.id}`} className="w-full sm:w-auto px-6 md:px-8 py-3 bg-yellow-500 text-black font-black rounded-xl hover:bg-yellow-400 transition-all text-sm text-center min-h-[44px] flex items-center justify-center">
                      Pay Now
                    </Link>
                  </div>
                </div>
              )}

              {/* Team ID Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[32px] overflow-hidden group">
                <div className="p-5 md:p-8 pb-3 md:pb-4">
                  <div className="text-cricket-500 font-black text-[10px] md:text-xs uppercase tracking-widest mb-1">Active Squad</div>
                  <h3 className="text-2xl md:text-4xl font-black tracking-tighter uppercase italic">{team?.name}</h3>
                  <div className="flex items-center gap-2 text-slate-400 mt-2 font-bold text-xs md:text-sm">
                    <span className="w-2 h-2 rounded-full bg-cricket-500 animate-pulse"></span>
                    Cricket Championship
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border-t border-white/10">
                  <StatBox label="Squad Size" value={`${teamPlayers.length}`} />
                  <StatBox label="Min Players" value="11" />
                  <StatBox label="Status" value={team?.approved ? 'Approved' : 'Pending'} />
                  <StatBox label="Sport" value={team?.sport || 'Cricket'} />
                </div>
              </div>

              {/* Squad List */}
              <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[32px] p-4 md:p-8">
                <h3 className="text-lg md:text-2xl font-black mb-4 md:mb-6 flex items-center gap-3">
                  Team Roster
                  <span className="text-xs md:text-sm bg-white/10 px-2 md:px-3 py-1 rounded-full text-slate-400 font-bold">{teamPlayers.length}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                  {teamPlayers.map((p, idx) => (
                    <div key={idx} className="bg-white/[0.03] border border-white/5 hover:border-white/20 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center justify-between group transition-all">
                      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center font-black text-sm md:text-base flex-shrink-0 ${p.is_captain ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/10 text-white/40'}`}>
                          {p.is_captain ? '★' : idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white group-hover:text-cricket-400 transition-colors uppercase tracking-tight text-sm md:text-base truncate">{p.student_data?.name}</div>
                          <div className="text-[10px] md:text-xs text-slate-500 font-mono font-medium truncate">{p.hall_ticket}</div>
                        </div>
                      </div>
                      <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest px-1.5 md:px-2 py-1 bg-white/5 rounded-md md:rounded-lg text-slate-400 flex-shrink-0 ml-2">{p.player_role || 'Member'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Feed / Info */}
            <div className="space-y-6 md:space-y-8">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl md:rounded-[32px] p-5 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 md:w-32 h-24 md:h-32 bg-white/10 rounded-full blur-2xl"></div>
                <h4 className="font-black text-lg md:text-2xl mb-3 md:mb-4 leading-tight relative z-10">Match Schedule</h4>
                <div className="space-y-3 md:space-y-4 relative z-10">
                  {matches.length > 0 ? (
                    matches.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-3 md:gap-4 bg-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 backdrop-blur-sm border border-white/10">
                        <div className="text-lg md:text-xl flex-shrink-0">🏏</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/60">
                            {new Date(m.match_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {m.match_time.slice(0, 5)}
                          </div>
                          <div className="font-bold text-xs md:text-sm leading-tight text-white uppercase italic truncate">
                            {m.team_a?.name} vs {m.team_b?.name}
                          </div>
                          <div className="text-[9px] md:text-[10px] text-white/40 mt-0.5 md:mt-1 uppercase font-bold tracking-tighter truncate">📍 {m.venue}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-3 md:gap-4 bg-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 backdrop-blur-sm border border-white/10">
                      <div className="text-xl md:text-2xl">⏳</div>
                      <div>
                        <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white/60">Status</div>
                        <div className="font-bold text-sm md:text-base">Waiting for Draws</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[32px] p-5 md:p-8">
                <h4 className="font-black text-[10px] md:text-xs uppercase tracking-widest text-cricket-500 mb-4 md:mb-6">Quick Links</h4>
                <div className="space-y-2 md:space-y-3">
                  <Link
                    href="/#cricket-info"
                    className="flex items-center gap-3 md:gap-4 w-full p-3 md:p-4 bg-white/5 hover:bg-cricket-500/10 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all border border-white/5 hover:border-cricket-500/20 group min-h-[44px]"
                  >
                    <span className="text-lg md:text-xl group-hover:scale-110 transition-transform">📜</span>
                    Tournament Rules
                  </Link>
                  <Link
                    href="/#schedule"
                    className="flex items-center gap-3 md:gap-4 w-full p-3 md:p-4 bg-white/5 hover:bg-cricket-500/10 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all border border-white/5 hover:border-cricket-500/20 group min-h-[44px]"
                  >
                    <span className="text-lg md:text-xl group-hover:scale-110 transition-transform">📅</span>
                    Full Schedule
                  </Link>
                  <a
                    href="mailto:support@kmce.local"
                    className="flex items-center gap-3 md:gap-4 w-full p-3 md:p-4 bg-white/5 hover:bg-cricket-500/10 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all border border-white/5 hover:border-cricket-500/20 group min-h-[44px]"
                  >
                    <span className="text-lg md:text-xl group-hover:scale-110 transition-transform">💬</span>
                    Support
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
    <div className="p-3 md:p-6 transition-colors hover:bg-white/[0.02]">
      <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5 md:mb-1">{label}</div>
      <div className="text-base md:text-xl font-black text-white">{value}</div>
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
    <span className={`px-3 md:px-4 py-2 md:py-2 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-white/5 min-h-[44px] flex items-center ${config.color}`}>
      {config.text}
    </span>
  )
}