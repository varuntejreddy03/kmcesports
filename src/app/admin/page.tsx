'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { TeamWithDetails } from '@/types'
import Link from 'next/link'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<TeamWithDetails[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending')
  const [isAdmin, setIsAdmin] = useState(false)
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null)
  const [teamPlayers, setTeamPlayers] = useState<any[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/admin/login')
        return
      }

      const hallTicket = user.user_metadata?.hall_ticket
      if (hallTicket !== 'ADMIN') {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      fetchTeams()
    } catch (error) {
      console.error('Admin check error:', error)
      router.push('/admin/login')
    }
  }

  const fetchTeams = async () => {
    setLoading(true)
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false })

      if (teamsError) throw teamsError

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('submitted_at', { ascending: false })

      const latestPayments = new Map()
      paymentsData?.forEach(payment => {
        if (!latestPayments.has(payment.team_id)) {
          latestPayments.set(payment.team_id, payment)
        }
      })

      const captainIds = teamsData.map(t => t.captain_id).filter(Boolean)
      const { data: captainsData } = await supabase
        .from('student_data')
        .select('hall_ticket, name, phone')
        .in('hall_ticket', captainIds)

      const teamIds = teamsData.map(t => t.id)
      const { data: teamPlayersData } = await supabase
        .from('team_players')
        .select('team_id, hall_ticket')
        .in('team_id', teamIds)

      const mergedTeams: TeamWithDetails[] = teamsData.map(team => {
        const payment = latestPayments.get(team.id)
        const captain = captainsData?.find(c => c.hall_ticket === team.captain_id)
        const playerCount = teamPlayersData?.filter(p => p.team_id === team.id).length || 0

        return {
          ...team,
          payment,
          captain,
          playerCount
        }
      })

      setTeams(mergedTeams)
    } catch (err) {
      console.error('Fetch teams error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (teamId: string, action: 'approve_payment' | 'reject_payment' | 'approve_team' | 'reject_team') => {
    try {
      if (action === 'approve_payment') {
        const { error } = await supabase.from('payments').update({ status: 'approved' }).eq('team_id', teamId)
        if (error) throw error
        const { error: teamError } = await supabase.from('teams').update({ approved: true }).eq('id', teamId)
        if (teamError) throw teamError
      } else if (action === 'reject_payment') {
        const { error } = await supabase.from('payments').update({ status: 'rejected' }).eq('team_id', teamId)
        if (error) throw error
      } else if (action === 'approve_team') {
        const { error } = await supabase.from('teams').update({ approved: true }).eq('id', teamId)
        if (error) throw error
      } else if (action === 'reject_team') {
        const { error } = await supabase.from('teams').update({ approved: false }).eq('id', teamId)
        if (error) throw error
      }
      await fetchTeams()
    } catch (error: any) {
      alert(`Action failed: ${error.message}`)
    }
  }

  const toggleTeamDetails = async (teamId: string) => {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null)
      setTeamPlayers([])
    } else {
      setExpandedTeamId(teamId)
      setLoadingPlayers(true)
      try {
        const { data: playersData, error } = await supabase.from('team_players').select('*').eq('team_id', teamId)
        if (error) throw error
        const hallTickets = playersData.map(p => p.hall_ticket)
        const { data: studentsData } = await supabase.from('student_data').select('*').in('hall_ticket', hallTickets)
        const mergedPlayers = playersData.map(player => ({
          ...player,
          student: studentsData?.find(s => s.hall_ticket === player.hall_ticket)
        }))
        setTeamPlayers(mergedPlayers)
      } catch (error) {
        console.error('Error fetching players:', error)
      } finally {
        setLoadingPlayers(false)
      }
    }
  }

  const filteredTeams = teams.filter(t => {
    if (filter === 'all') return true
    if (filter === 'approved') return t.approved
    if (filter === 'pending') return !t.approved
    return true
  })

  if (!isAdmin && loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-500"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-cricket-500/30 pb-20">
      {/* Admin Navbar */}
      <nav className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-[#0f172a]/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <span className="font-black text-xl tracking-tighter uppercase italic">KMCE<span className="text-cricket-500">SportsPortol</span></span>
            <span className="ml-2 px-2 py-0.5 bg-white/10 rounded text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/10">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/tournament-settings" className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10">⚙️ Settings</Link>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              className="text-xs font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <div className="text-cricket-500 font-black text-xs uppercase tracking-[0.3em] mb-2">Governance Console</div>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Management Center</h1>
          </div>

          <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl overflow-hidden backdrop-blur-xl">
            {['pending', 'approved', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-cricket-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Teams Grid/Table */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Team Identity</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Captain Details</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Payment Audit</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Decision Status</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredTeams.map((team) => (
                  <React.Fragment key={team.id}>
                    <tr className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-black text-xl uppercase italic group-hover:text-cricket-400 transition-colors tracking-tight">{team.name || 'UNNAMED SQUAD'}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{team.sport}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                          <span className="text-[10px] font-black text-cricket-500/70 tracking-widest uppercase">{team.playerCount || 0} ATHLETES</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm">
                        <div className="font-black text-white hover:text-cricket-400 transition-colors uppercase tracking-tight">{team.captain?.name}</div>
                        <div className="text-slate-500 font-mono text-xs mt-1">{team.captain?.hall_ticket} • {team.captain?.phone}</div>
                      </td>
                      <td className="px-8 py-6">
                        {team.payment ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border ${team.payment.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                team.payment.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                  'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                                }`}>
                                {team.payment.status}
                              </span>
                            </div>
                            {team.payment.screenshot_url && (
                              <a href={team.payment.screenshot_url} target="_blank" rel="noopener noreferrer" className="block text-[10px] font-black text-indigo-400 hover:text-indigo-300 underline decoration-indigo-400/30">
                                AUDIT PROOF (UTR: {team.payment.utr_number})
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">No Data Logged</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${team.approved ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-slate-500/10 text-slate-500 border-white/5'}`}>
                          {team.approved ? 'REGISTERED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2 items-end">
                          <button
                            onClick={() => toggleTeamDetails(team.id)}
                            className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors"
                          >
                            {expandedTeamId === team.id ? 'Collapse ▴' : 'Inspect Squad ▾'}
                          </button>

                          <div className="flex gap-2">
                            {team.payment && team.payment.status === 'pending' && (
                              <>
                                <button onClick={() => handleAction(team.id, 'approve_payment')} className="w-8 h-8 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 flex items-center justify-center hover:bg-green-500 hover:text-black transition-all">✓</button>
                                <button onClick={() => handleAction(team.id, 'reject_payment')} className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center hover:bg-red-50 hover:text-black transition-all">✗</button>
                              </>
                            )}

                            <button
                              onClick={() => handleAction(team.id, team.approved ? 'reject_team' : 'approve_team')}
                              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${team.approved ? 'bg-white/5 text-slate-500 hover:bg-red-500 hover:text-white' : 'bg-white text-black hover:bg-cricket-500 shadow-lg'}`}
                            >
                              {team.approved ? 'Revoke' : 'Register 🚀'}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {expandedTeamId === team.id && (
                      <tr className="bg-white/[0.01]">
                        <td colSpan={5} className="px-8 py-8">
                          <div className="animate-fadeIn bg-white/5 border border-white/5 rounded-[32px] overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Team Roster Audit</h4>
                              <span className="text-[10px] font-bold text-slate-600">{teamPlayers.length} Members Logged</span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Athlete Name</th>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Year</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-8 py-4 text-right">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02]">
                                  {teamPlayers.map((p, idx) => (
                                    <tr key={idx} className="text-xs hover:bg-white/[0.02]">
                                      <td className="px-6 py-4 font-black uppercase tracking-tight">{p.student?.name}</td>
                                      <td className="px-6 py-4 text-slate-500 font-mono">{p.hall_ticket}</td>
                                      <td className="px-6 py-4 text-slate-400 font-bold">{p.student?.year} Year</td>
                                      <td className="px-6 py-4 text-cricket-500/70 font-black uppercase tracking-widest text-[10px]">{p.player_role}</td>
                                      <td className="px-8 py-4 text-right">
                                        {p.is_captain ? <span className="text-yellow-500 font-black text-[10px] tracking-widest">★ LEADER</span> : <span className="text-slate-700 font-black text-[10px] uppercase tracking-widest">MEMBER</span>}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTeams.length === 0 && !loading && (
            <div className="py-20 text-center">
              <div className="text-4xl mb-4 grayscale opacity-50">🏟️</div>
              <h3 className="text-xl font-black text-slate-600 uppercase tracking-widest italic">No Records Found</h3>
              <p className="text-slate-700 text-xs font-bold mt-2">The current selection returned no results.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
