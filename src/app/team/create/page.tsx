'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, checkSessionTimeout, clearSessionStartTime, getDepartmentGroup, getDepartmentInfo, isEligibleForGroup, extractDeptCode, DepartmentGroup, DEPARTMENT_CODES } from '@/lib/supabase'
import { StudentData } from '@/types'
import Link from 'next/link'

export default function CreateTeamPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [captain, setCaptain] = useState<StudentData | null>(null)
  const [teamName, setTeamName] = useState('')
  const [selectedPlayers, setSelectedPlayers] = useState<StudentData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [allStudents, setAllStudents] = useState<StudentData[]>([])
  const [takenHallTickets, setTakenHallTickets] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [playerToAdd, setPlayerToAdd] = useState<StudentData | null>(null)
  const [selectedRole, setSelectedRole] = useState('all-rounder')
  const [isEditing, setIsEditing] = useState(false)
  const [existingTeamId, setExistingTeamId] = useState<string | null>(null)
  const [captainDeptGroup, setCaptainDeptGroup] = useState<DepartmentGroup>(null)
  const [captainDeptInfo, setCaptainDeptInfo] = useState<{ code: string; name: string; shortName: string } | null>(null)
  const [showDeptSelectionModal, setShowDeptSelectionModal] = useState(false)
  const [isECECaptain, setIsECECaptain] = useState(false)

  useEffect(() => {
    init()

    const sessionCheckInterval = setInterval(() => {
      const isExpired = checkSessionTimeout()
      if (isExpired) {
        router.push('/auth/login?expired=true')
      }
    }, 60000)

    return () => clearInterval(sessionCheckInterval)
  }, [])

  const init = async () => {
    try {
      const isExpired = checkSessionTimeout()
      if (isExpired) { router.push('/auth/login?expired=true'); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { clearSessionStartTime(); router.push('/auth/login'); return }

      const hallTicket = user.user_metadata?.hall_ticket
      if (!hallTicket) { setError('Session error. Please login again.'); setLoading(false); return }

      const { data: currentStudent } = await supabase.from('student_data').select('*').eq('hall_ticket', hallTicket).maybeSingle()
      if (!currentStudent) { setError('Profile error. Contact Admin.'); setLoading(false); return }
      setCaptain(currentStudent)

      // Determine captain's department group
      const deptGroupResult = getDepartmentGroup(currentStudent.hall_ticket)
      const deptInfo = getDepartmentInfo(currentStudent.hall_ticket)
      setCaptainDeptInfo(deptInfo)

      // Block if captain is not in a valid department group
      if (!deptGroupResult) {
        setError('NOT ELIGIBLE – DEPARTMENT RULE VIOLATION')
        setLoading(false)
        return
      }

      // If ECE captain (eligible for both groups), show selection modal
      if (deptGroupResult === 'BOTH') {
        setIsECECaptain(true)
        setShowDeptSelectionModal(true)
        // Don't set captainDeptGroup yet - wait for selection
      } else {
        setCaptainDeptGroup(deptGroupResult)
      }

      const { data: teamData } = await supabase.from('teams').select('*').eq('captain_id', currentStudent.hall_ticket).maybeSingle()

      if (teamData) {
        setIsEditing(true)
        setExistingTeamId(teamData.id)
        setTeamName(teamData.name)

        const { data: players } = await supabase.from('team_players').select('*').eq('team_id', teamData.id)
        if (players) {
          const captainPlayer = players.find(p => p.is_captain)
          const otherPlayers = players.filter(p => !p.is_captain)

          // Get student details for these players
          const hts = otherPlayers.map(p => p.hall_ticket)
          const { data: sData } = await supabase.from('student_data').select('*').in('hall_ticket', hts)

          const formattedPlayers = otherPlayers.map(p => ({
            ...sData?.find(s => s.hall_ticket === p.hall_ticket),
            player_role: p.player_role
          })) as StudentData[]

          setSelectedPlayers(formattedPlayers)
        }
      }

      // Check if player in another team
      const { data: playerInTeam } = await supabase.from('team_players').select('team_id').eq('hall_ticket', currentStudent.hall_ticket).maybeSingle()
      if (playerInTeam && (!teamData || playerInTeam.team_id !== teamData.id)) {
        router.push('/dashboard')
        return
      }

      // Get all students
      let allStudentsData: StudentData[] = []
      let page = 0
      const pageSize = 1000
      let hasMore = true
      while (hasMore) {
        const { data } = await supabase.from('student_data').select('*').range(page * pageSize, (page + 1) * pageSize - 1)
        if (data && data.length > 0) { allStudentsData = [...allStudentsData, ...data]; page++; hasMore = data.length === pageSize }
        else { hasMore = false }
      }

      const { data: takenData } = await supabase.from('team_players').select('hall_ticket')

      const studentsOnly = allStudentsData.filter(s => s.role?.toLowerCase() !== 'admin' && s.hall_ticket !== 'ADMIN')
      setAllStudents(studentsOnly)
      setTakenHallTickets(new Set(takenData?.map(p => p.hall_ticket) || []))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPlayerClick = (player: StudentData) => {
    setPlayerToAdd(player)
    setSelectedRole('all-rounder')
    setShowRoleModal(true)
  }

  const confirmAddPlayer = () => {
    if (playerToAdd) {
      setSelectedPlayers(prev => [...prev, { ...playerToAdd, player_role: selectedRole }])
      setShowRoleModal(false)
      setPlayerToAdd(null)
    }
  }

  const availableStudents = allStudents.filter(s => {
    // Basic filters
    if (s.hall_ticket === captain?.hall_ticket) return false
    if (takenHallTickets.has(s.hall_ticket)) return false
    if (selectedPlayers.some(p => p.hall_ticket === s.hall_ticket)) return false
    
    // Department eligibility filter - only show students eligible for captain's group
    if (captainDeptGroup && !isEligibleForGroup(s.hall_ticket, captainDeptGroup)) return false
    
    // Search filter
    if (searchTerm && 
        !s.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !s.hall_ticket.toLowerCase().includes(searchTerm.toLowerCase())) return false
    
    return true
  })

  const handleCreateTeam = async () => {
    if (!captain) return
    if (!captainDeptGroup) { 
      setError('NOT ELIGIBLE – DEPARTMENT RULE VIOLATION'); 
      return 
    }
    if (selectedPlayers.length < 10) { setError('At least 11 players required (10 + Captain)'); return }
    if (selectedPlayers.length > 14) { setError('Maximum 15 players allowed'); return }

    // Validate all selected players are eligible for the captain's department group
    const ineligiblePlayers = selectedPlayers.filter(p => !isEligibleForGroup(p.hall_ticket, captainDeptGroup))
    if (ineligiblePlayers.length > 0) {
      setError('NOT ELIGIBLE – DEPARTMENT RULE VIOLATION')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      let teamId = existingTeamId

      if (isEditing && teamId) {
        const { error: updateError } = await supabase.from('teams').update({ name: teamName }).eq('id', teamId)
        if (updateError) throw updateError

        // Delete existing players to replace (simple approach) or diff them
        await supabase.from('team_players').delete().eq('team_id', teamId)
      } else {
        const { data: team, error: teamError } = await supabase.from('teams').insert({
          sport: 'cricket',
          name: teamName,
          captain_id: captain.hall_ticket,
          approved: false
        }).select().single()

        if (teamError) throw teamError
        teamId = team.id
      }

      const playersToAdd = [
        {
          team_id: teamId,
          hall_ticket: captain.hall_ticket,
          student_id: captain.hall_ticket,
          player_role: captain.player_role || 'all-rounder',
          is_captain: true
        },
        ...selectedPlayers.map(p => {
          const ht = p.hall_ticket || (p as any).student_id || (p as any).id;
          return {
            team_id: teamId,
            hall_ticket: ht,
            student_id: ht,
            player_role: p.player_role || 'all-rounder',
            is_captain: false
          };
        })
      ]

      const { error: playersError } = await supabase.from('team_players').insert(playersToAdd)
      if (playersError) throw playersError

      if (!isEditing) {
        router.push(`/payment?teamId=${teamId}`)
      } else {
        setError('Team updated successfully!')
        setTimeout(() => router.push('/dashboard'), 1500)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-500"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-cricket-500/30 pb-20">
      <nav className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-[#0f172a]/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-cricket-400 font-bold flex items-center gap-2"><span>←</span> Dashboard</Link>
          <div className="font-black text-xl tracking-tighter uppercase italic">{isEditing ? 'Edit' : 'Create'}<span className="text-cricket-500">Team</span></div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 mt-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">Recruit Your <span className="text-cricket-500">Legends</span></h1>
          <p className="text-slate-400 font-medium">Build a squad of 11-15 players to compete in the championship.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[40px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cricket-500/10 blur-3xl rounded-full"></div>
              <h3 className="text-2xl font-black mb-6 border-b border-white/5 pb-4 uppercase tracking-widest text-cricket-400">Team Identity</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Team Name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-black focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-700"
                    placeholder="e.g. THUNDERING TITANS"
                  />
                </div>
                <div className="bg-white/5 border border-white/5 p-6 rounded-3xl">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Team Lead</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xl font-black">{captain?.name}</div>
                      {captainDeptInfo && (
                        <div className="text-xs text-slate-400 mt-1">{captainDeptInfo.shortName} • {captain?.hall_ticket}</div>
                      )}
                    </div>
                    <span className="px-3 py-1 bg-cricket-500 text-black text-[10px] font-black rounded-lg">CAPTAIN</span>
                  </div>
                </div>
                {captainDeptGroup && (
                  <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-4 rounded-2xl mt-4">
                    <div className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-1">Team Department</div>
                    <div className="text-lg font-black text-white">{captainDeptGroup} Department</div>
                    <div className="text-[10px] text-slate-400 mt-1">Only {captainDeptGroup === 'CSE' ? 'CSE, CSO, ECE' : 'CSM, CSC, CSD, ECE'} students can join this team</div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[40px] p-8">
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                <h3 className="text-2xl font-black uppercase tracking-widest text-cricket-400">Current Squad</h3>
                <div className="flex flex-col items-end">
                  <span className={`text-xl font-black ${selectedPlayers.length + 1 >= 11 ? 'text-green-400' : 'text-orange-500'}`}>
                    {selectedPlayers.length + 1}/15 Players
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    {15 - (selectedPlayers.length + 1)} slots remaining
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {selectedPlayers.map((p, idx) => {
                  const playerDept = getDepartmentInfo(p.hall_ticket)
                  return (
                    <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-slate-400">{idx + 2}</div>
                        <div>
                          <div className="font-black uppercase italic tracking-tight">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-bold">{p.hall_ticket} • {playerDept?.shortName} • {p.player_role}</div>
                        </div>
                      </div>
                      {!isEditing && (
                        <button onClick={() => setSelectedPlayers(prev => prev.filter(p2 => p2.hall_ticket !== p.hall_ticket))} className="text-red-500 hover:text-red-400 text-sm font-bold px-4 py-2 hover:bg-red-500/10 rounded-xl transition-all">Remove</button>
                      )}
                    </div>
                  )
                })}
                {selectedPlayers.length === 0 && (
                  <div className="text-center py-12 text-slate-600 font-bold border-2 border-dashed border-white/5 rounded-3xl">No recruits added yet. Browse the student list.</div>
                )}
              </div>
            </div>
          </div>

          {/* Recruitment Sidebar */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-[40px] p-6 h-[700px] flex flex-col">
              <h3 className="text-xl font-black mb-6 uppercase tracking-widest">Recruitment Pool</h3>
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search by ID or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {availableStudents.map((p, idx) => {
                  const playerDept = getDepartmentInfo(p.hall_ticket)
                  return (
                    <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/[0.08] transition-all group">
                      <div className="font-bold mb-1 group-hover:text-cricket-400 transition-colors uppercase italic">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-bold mb-1">{p.hall_ticket}</div>
                      {playerDept && (
                        <div className="text-[10px] text-indigo-400 font-bold mb-3">{playerDept.shortName}</div>
                      )}
                      <button
                        disabled={selectedPlayers.length >= 14}
                        onClick={() => handleAddPlayerClick(p)}
                        className="w-full py-2 bg-white/10 hover:bg-cricket-600 hover:text-white text-slate-400 rounded-xl text-xs font-black transition-all"
                      >
                        Recruit +
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            <button
              onClick={handleCreateTeam}
              disabled={submitting || selectedPlayers.length < 10 || !teamName}
              className="w-full py-6 bg-gradient-to-r from-cricket-600 to-indigo-600 text-white rounded-3xl font-black text-xl hover:scale-[1.02] shadow-xl shadow-cricket-600/30 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
            >
              {submitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Squad 🚀' : 'Finalize Squad 🚀')}
            </button>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold text-center">
                {error}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Role Selection Modal */}
      {showRoleModal && playerToAdd && (
        <div className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-[#1e293b] border border-white/10 rounded-[40px] p-8 max-w-sm w-full shadow-2xl scale-in">
            <h3 className="text-2xl font-black mb-2 text-center uppercase tracking-tighter">Assign Role</h3>
            <p className="text-slate-400 text-center text-sm mb-8 font-medium italic">"{playerToAdd.name}"</p>

            <div className="space-y-3 mb-10">
              {['batsman', 'bowler', 'all-rounder', 'wicket-keeper'].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest border transition-all ${selectedRole === role ? 'bg-cricket-600 border-cricket-400 text-white shadow-lg shadow-cricket-600/20' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:bg-white/10'}`}
                >
                  {role.replace('-', ' ')}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowRoleModal(false)} className="flex-1 py-4 text-slate-500 font-black text-xs uppercase tracking-widest">Cancel</button>
              <button onClick={confirmAddPlayer} className="flex-1 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Department Selection Modal for ECE Captains */}
      {showDeptSelectionModal && isECECaptain && (
        <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-[#1e293b] border border-white/10 rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black mb-2 text-center uppercase tracking-tighter">Select Department</h3>
            <p className="text-slate-400 text-center text-sm mb-2 font-medium">As an ECE student, you can create a team in either department.</p>
            <p className="text-indigo-400 text-center text-xs mb-8 font-bold">Choose the department for your team:</p>

            <div className="space-y-4 mb-8">
              <button
                onClick={() => {
                  setCaptainDeptGroup('CSE')
                  setShowDeptSelectionModal(false)
                }}
                className="w-full py-5 px-6 rounded-2xl font-black text-left border border-white/10 bg-white/5 hover:bg-indigo-600/20 hover:border-indigo-500/50 transition-all"
              >
                <div className="text-lg text-white mb-1">CSE Department</div>
                <div className="text-[10px] text-slate-400">Includes: CSE, CSO, ECE students</div>
              </button>
              <button
                onClick={() => {
                  setCaptainDeptGroup('CSM')
                  setShowDeptSelectionModal(false)
                }}
                className="w-full py-5 px-6 rounded-2xl font-black text-left border border-white/10 bg-white/5 hover:bg-purple-600/20 hover:border-purple-500/50 transition-all"
              >
                <div className="text-lg text-white mb-1">CSM Department</div>
                <div className="text-[10px] text-slate-400">Includes: CSM, CSC, CSD, ECE students</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}