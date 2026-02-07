'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, checkSessionTimeout, clearSessionStartTime } from '@/lib/supabase'
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
  const [matches, setMatches] = useState<any[]>([])
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [newMatch, setNewMatch] = useState({
    team_a_id: '',
    team_b_id: '',
    match_date: '',
    match_time: '',
    venue: 'Main Stadium Ground'
  })

  // Random Match Generator State
  const [showMatchGenerator, setShowMatchGenerator] = useState(false)
  const [generatedMatches, setGeneratedMatches] = useState<{ team_a: any, team_b: any }[]>([])
  const [byeTeam, setByeTeam] = useState<any | null>(null)
  const [savingMatches, setSavingMatches] = useState(false)
  const [matchesSaved, setMatchesSaved] = useState(false)

  // Player Edit State
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)
  const [editPlayerRole, setEditPlayerRole] = useState('')
  const [savingPlayer, setSavingPlayer] = useState(false)

  // Analytics State
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [allPlayersData, setAllPlayersData] = useState<any[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Team Selection State
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set())

  // Mobile Actions Menu State
  const [showMobileActions, setShowMobileActions] = useState(false)

  // Live Draw State
  const [drawPhase, setDrawPhase] = useState<'idle' | 'spinning' | 'drawing' | 'complete'>('idle')
  const [spinningTeams, setSpinningTeams] = useState<any[]>([])
  const [drawnTeams, setDrawnTeams] = useState<any[]>([])
  const [currentDrawIndex, setCurrentDrawIndex] = useState(0)
  const [bracketRounds, setBracketRounds] = useState<any[]>([])
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const drawIntervalRef = useRef<NodeJS.Timeout | null>(null)


  // Message All Members State
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageTeam, setMessageTeam] = useState<any>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [messageMembers, setMessageMembers] = useState<any[]>([])
  const [messageSending, setMessageSending] = useState(false)

  useEffect(() => {
    checkAdmin()

    const sessionCheckInterval = setInterval(() => {
      const isExpired = checkSessionTimeout()
      if (isExpired) {
        router.push('/auth/login?expired=true')
      }
    }, 60000)

    const channel = supabase
      .channel('admin-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        fetchMatches()
      })
      .subscribe()

    return () => {
      clearInterval(sessionCheckInterval)
      supabase.removeChannel(channel)
    }
  }, [])

  const checkAdmin = async () => {
    try {
      const isExpired = checkSessionTimeout()
      if (isExpired) {
        router.push('/auth/login?expired=true')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        clearSessionStartTime()
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
      fetchMatches()
    } catch (error) {
      console.error('Admin check error:', error)
      router.push('/admin/login')
    }
  }

  const fetchMatches = async () => {
    const { data: matchesData, error } = await supabase
      .from('matches')
      .select(`
        *,
        team_a:teams!team_a_id(name),
        team_b:teams!team_b_id(name)
      `)
      .order('match_date', { ascending: true })

    if (matchesData) setMatches(matchesData)
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

      const captainIds = teamsData?.map(t => t.captain_id).filter(Boolean) || []
      const { data: captainsData, error: captainsError } = await supabase
        .from('student_data')
        .select('*') // Get everything to avoid column name errors
        .in('hall_ticket', captainIds)

      if (captainsError) console.warn('Error fetching captains:', captainsError)

      const teamIds = teamsData?.map(t => t.id) || []
      const { data: teamPlayersData, error: tpError } = await supabase
        .from('team_players')
        .select('team_id, hall_ticket')
        .in('team_id', teamIds)

      if (tpError) console.warn('Error fetching team players:', tpError)

      console.log('Raw Teams from DB:', teamsData)
      console.log('Processed Captains:', captainsData)

      const mergedTeams: TeamWithDetails[] = (teamsData || []).map(team => {
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

  const handleAction = async (teamId: string, action: 'approve_payment' | 'reject_payment' | 'approve_team' | 'reject_team' | 'delete_team' | 'request_repayment') => {
    try {
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, action })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process action')
      }

      await fetchTeams()
    } catch (error: any) {
      console.error('Action error:', error)
      alert(`Action failed: ${error.message}`)
    }
  }

  const handleScheduleMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newMatch.team_a_id === newMatch.team_b_id) {
      alert('A team cannot play against itself.')
      return
    }

    try {
      const { error } = await supabase.from('matches').insert([newMatch])
      if (error) throw error

      setShowScheduleForm(false)
      setNewMatch({ team_a_id: '', team_b_id: '', match_date: '', match_time: '', venue: 'Main Stadium Ground' })
      fetchMatches()
    } catch (error: any) {
      alert(`Scheduling failed: ${error.message}`)
    }
  }

  const deleteMatch = async (id: string) => {
    if (!confirm('Cancel this match?')) return
    const { error } = await supabase.from('matches').delete().eq('id', id)
    if (!error) fetchMatches()
  }

  // Shuffle array (Fisher-Yates algorithm)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Generate random matches from teams
  const generateRandomMatches = (teamsToUse: any[]) => {
    // Sort by registration time (created_at) - first registered first
    const sortedByRegistration = [...teamsToUse].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    const matchList: { team_a: any, team_b: any }[] = []
    let bye: any | null = null
    let teamsToShuffle = [...sortedByRegistration]

    // If odd number of teams, first registered team gets bye
    if (teamsToShuffle.length % 2 !== 0) {
      bye = teamsToShuffle.shift()!
      setByeTeam(bye)
    } else {
      setByeTeam(null)
    }

    // Shuffle remaining teams for random pairing
    const shuffled = shuffleArray(teamsToShuffle)

    // Pair remaining teams
    for (let i = 0; i < shuffled.length; i += 2) {
      matchList.push({
        team_a: shuffled[i],
        team_b: shuffled[i + 1]
      })
    }

    setGeneratedMatches(matchList)
    setMatchesSaved(false)
  }

  // Open match generator
  const openMatchGenerator = () => {
    clearAllTimers()
    setShowMatchGenerator(true)
    setDrawPhase('idle')
    setDrawnTeams([])
    setCurrentDrawIndex(0)
    setBracketRounds([])
    setGeneratedMatches([])
    setByeTeam(null)
    setMatchesSaved(false)
    const approvedTeams = teams.filter(t => t.approved)
    setSpinningTeams(approvedTeams)
  }

  // Start the live draw animation
  const startLiveDraw = () => {
    const approvedTeams = teams.filter(t => t.approved)
    if (approvedTeams.length < 2) return

    setDrawPhase('spinning')
    setDrawnTeams([])
    setCurrentDrawIndex(0)
    setBracketRounds([])
    broadcastDrawEvent('draw_start', {
      teams: approvedTeams.map(t => ({ id: t.id, name: t.name })),
      totalTeams: approvedTeams.length
    })

    let shuffleCount = 0
    const maxShuffles = 30
    spinIntervalRef.current = setInterval(() => {
      setSpinningTeams(prev => shuffleArray([...prev]))
      shuffleCount++
      if (shuffleCount >= maxShuffles) {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current)
        const finalOrder = shuffleArray([...approvedTeams])
        setSpinningTeams(finalOrder)
        setTimeout(() => startDrawingPhase(finalOrder), 500)
      }
    }, 100)
  }

  // Drawing phase - one by one
  const startDrawingPhase = (orderedTeams: any[]) => {
    setDrawPhase('drawing')
    broadcastDrawEvent('draw_shuffle_done', {
      orderedTeams: orderedTeams.map(t => ({ id: t.id, name: t.name }))
    })

    let idx = 0
    drawIntervalRef.current = setInterval(() => {
      if (idx < orderedTeams.length) {
        const team = orderedTeams[idx]
        setDrawnTeams(prev => [...prev, team])
        setSpinningTeams(prev => prev.filter(t => t.id !== team.id))
        setCurrentDrawIndex(idx + 1)
        broadcastDrawEvent('team_drawn', {
          team: { id: team.id, name: team.name },
          index: idx,
          total: orderedTeams.length
        })
        idx++
      } else {
        if (drawIntervalRef.current) clearInterval(drawIntervalRef.current)
        setTimeout(() => {
          const bracket = generateKnockoutBracket(orderedTeams)
          setBracketRounds(bracket)
          setDrawPhase('complete')
          broadcastDrawEvent('bracket_complete', {
            bracket: bracket.map(round => ({
              name: round.name,
              matches: round.matches.map((m: any) => ({
                match_num: m.match_num,
                team_a: m.team_a ? { id: m.team_a.id, name: m.team_a.name } : null,
                team_b: m.team_b ? { id: m.team_b.id, name: m.team_b.name } : null,
                round_name: m.round_name,
                is_bye: m.is_bye
              }))
            })),
            byeTeams: byeTeam ? (Array.isArray(byeTeam) ? byeTeam.map((t: any) => ({ id: t.id, name: t.name })) : []) : [],
            allTeams: orderedTeams.map(t => ({ id: t.id, name: t.name }))
          })
        }, 600)
      }
    }, 800)
  }

  // Generate knockout bracket from shuffled teams
  const generateKnockoutBracket = (shuffledTeams: any[]) => {
    const total = shuffledTeams.length
    if (total < 2) return []

    let nearestPow2 = 1
    while (nearestPow2 < total) nearestPow2 *= 2

    const numPlayInMatches = total - (nearestPow2 / 2)
    const isPowerOf2 = (total & (total - 1)) === 0

    const getRoundName = (teamsInRound: number) => {
      if (teamsInRound <= 2) return 'Final'
      if (teamsInRound <= 4) return 'Semifinals'
      if (teamsInRound <= 8) return 'Quarterfinals'
      return `Round of ${teamsInRound}`
    }

    const rounds: any[] = []
    let matchCounter = 1

    if (isPowerOf2) {
      const firstRoundMatches: any[] = []
      for (let i = 0; i < shuffledTeams.length; i += 2) {
        firstRoundMatches.push({
          match_num: matchCounter++,
          team_a: shuffledTeams[i],
          team_b: shuffledTeams[i + 1],
          round: 1,
          round_name: getRoundName(total)
        })
      }
      rounds.push({ name: getRoundName(total), matches: firstRoundMatches })

      setGeneratedMatches(firstRoundMatches.map((m: any) => ({ team_a: m.team_a, team_b: m.team_b })))
      setByeTeam(null)

      let remaining = total / 2
      let roundIdx = 2
      while (remaining >= 2) {
        const roundName = getRoundName(remaining)
        const numMatches = remaining / 2
        const roundMatches: any[] = []
        for (let i = 0; i < numMatches; i++) {
          roundMatches.push({
            match_num: matchCounter++,
            team_a: null,
            team_b: null,
            round: roundIdx,
            round_name: roundName
          })
        }
        rounds.push({ name: roundName, matches: roundMatches })
        remaining = remaining / 2
        roundIdx++
      }
    } else {
      const halfBracket = nearestPow2 / 2
      const byeCount = halfBracket - numPlayInMatches
      const byeTeamsList = shuffledTeams.slice(0, byeCount)
      const playInTeamsList = shuffledTeams.slice(byeCount)

      const playInMatches: any[] = []
      for (let i = 0; i < playInTeamsList.length; i += 2) {
        playInMatches.push({
          match_num: matchCounter++,
          team_a: playInTeamsList[i],
          team_b: playInTeamsList[i + 1],
          round: 0,
          round_name: 'Play-in Round'
        })
      }
      rounds.push({ name: 'Play-in Round', matches: playInMatches })

      setGeneratedMatches(playInMatches.map((m: any) => ({ team_a: m.team_a, team_b: m.team_b })))
      setByeTeam(byeTeamsList.length > 0 ? byeTeamsList : null)

      const nextRoundMatches: any[] = []
      const nextRoundName = getRoundName(halfBracket)
      let byeIdx = 0
      for (let i = 0; i < halfBracket / 2; i++) {
        let teamA: any = null
        let teamB: any = null

        if (byeIdx < byeTeamsList.length) {
          teamA = byeTeamsList[byeIdx]
          byeIdx++
        }

        nextRoundMatches.push({
          match_num: matchCounter++,
          team_a: teamA,
          team_b: teamB,
          round: 1,
          round_name: nextRoundName,
          is_bye: teamA !== null && teamB === null
        })
      }
      rounds.push({ name: nextRoundName, matches: nextRoundMatches })

      let remaining = halfBracket / 2
      let roundIdx = 2
      while (remaining >= 2) {
        const roundName = getRoundName(remaining)
        const numMatches = remaining / 2
        const roundMatches: any[] = []
        for (let i = 0; i < numMatches; i++) {
          roundMatches.push({
            match_num: matchCounter++,
            team_a: null,
            team_b: null,
            round: roundIdx,
            round_name: roundName
          })
        }
        rounds.push({ name: roundName, matches: roundMatches })
        remaining = remaining / 2
        roundIdx++
      }
    }

    return rounds
  }

  // Regenerate matches (reset draw)
  const regenerateMatches = () => {
    clearAllTimers()
    setDrawPhase('idle')
    setDrawnTeams([])
    setCurrentDrawIndex(0)
    setBracketRounds([])
    setGeneratedMatches([])
    setByeTeam(null)
    setMatchesSaved(false)
    const approvedTeams = teams.filter(t => t.approved)
    setSpinningTeams(approvedTeams)
  }

  // Supabase Realtime broadcast for live draw
  const drawChannelRef = useRef<any>(null)

  useEffect(() => {
    drawChannelRef.current = supabase.channel('live-draw', {
      config: { broadcast: { self: false } }
    })
    drawChannelRef.current.subscribe()
    return () => {
      if (drawChannelRef.current) supabase.removeChannel(drawChannelRef.current)
    }
  }, [])

  const broadcastDrawEvent = (event: string, payload: any) => {
    if (drawChannelRef.current) {
      drawChannelRef.current.send({
        type: 'broadcast',
        event,
        payload
      })
    }
  }

  const clearAllTimers = () => {
    if (spinIntervalRef.current) { clearInterval(spinIntervalRef.current); spinIntervalRef.current = null }
    if (drawIntervalRef.current) { clearInterval(drawIntervalRef.current); drawIntervalRef.current = null }
  }

  // Save generated matches to database
  const saveGeneratedMatches = async () => {
    if (!confirm('Save this bracket to the database? This will replace any existing scheduled matches.')) return
    setSavingMatches(true)
    try {
      await supabase
        .from('matches')
        .delete()
        .eq('status', 'scheduled')

      const matchesToInsert = generatedMatches.map((match, index) => ({
        team_a_id: match.team_a.id,
        team_b_id: match.team_b.id,
        match_date: new Date().toISOString(),
        round: 1,
        match_number: index + 1,
        status: 'scheduled'
      }))

      const { error } = await supabase.from('matches').insert(matchesToInsert)
      if (error) throw error

      setMatchesSaved(true)
      fetchMatches()
    } catch (err) {
      console.error('Error saving matches:', err)
      alert('Failed to save matches. Please try again.')
    } finally {
      setSavingMatches(false)
    }
  }

  const deleteAllBracketMatches = async () => {
    if (!confirm('Delete ALL scheduled matches from the database? This cannot be undone.')) return
    setSavingMatches(true)
    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('status', 'scheduled')
      if (error) throw error
      setMatchesSaved(false)
      fetchMatches()
    } catch (err) {
      console.error('Error deleting matches:', err)
      alert('Failed to delete matches. Please try again.')
    } finally {
      setSavingMatches(false)
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

  // Handle player role edit
  const handleEditPlayer = (playerId: string, currentRole: string) => {
    setEditingPlayer(playerId)
    setEditPlayerRole(currentRole)
  }

  const handleSavePlayerEdit = async (playerId: string, teamId: string) => {
    if (!editPlayerRole.trim()) {
      alert('Please select a role')
      return
    }
    setSavingPlayer(true)
    try {
      const { error } = await supabase
        .from('team_players')
        .update({ player_role: editPlayerRole })
        .eq('id', playerId)

      if (error) throw error

      // Refresh players
      setTeamPlayers(prev => prev.map(p =>
        p.id === playerId ? { ...p, player_role: editPlayerRole } : p
      ))
      setEditingPlayer(null)
      setEditPlayerRole('')
    } catch (error) {
      console.error('Error updating player:', error)
      alert('Failed to update player')
    } finally {
      setSavingPlayer(false)
    }
  }

  const handleRemovePlayer = async (playerId: string, playerName: string, isCaptain: boolean, teamId: string) => {
    if (isCaptain) {
      alert('Cannot remove captain. Transfer captaincy first or delete the entire team.')
      return
    }

    if (!confirm(`Remove ${playerName} from this team?`)) return

    try {
      const { error } = await supabase
        .from('team_players')
        .delete()
        .eq('id', playerId)

      if (error) throw error

      // Refresh players list
      setTeamPlayers(prev => prev.filter(p => p.id !== playerId))

      // Update team player count
      setTeams(prev => prev.map(t =>
        t.id === teamId ? { ...t, playerCount: (t.playerCount || 1) - 1 } : t
      ))
    } catch (error) {
      console.error('Error removing player:', error)
      alert('Failed to remove player')
    }
  }

  // Generate WhatsApp message with team data and rules
  const generateWhatsAppMessage = (team: any, players: any[]) => {
    const playersList = players.map((p, idx) =>
      `${idx + 1}. ${p.student?.name || 'Unknown'} (${p.player_role})${p.is_captain ? ' [Captain]' : ''}`
    ).join('\n')

    const rules = `*TOURNAMENT RULES:*

1. Department-wise participation only
2. Mandatory WHITE uniforms
3. 12 overs per side
4. Umpire decisions are final
5. Strict anti-sledging policy
6. Instant DQ for physical abuse
7. Proper cricket shoes required
8. Report 30 mins early
9. Walkover if late
10. Knockout format
11. No leg-byes / No LBW
12. 4 Overs Powerplay
13. Max 15 members (11+4)
14. Bring your own kit
15. Impact Player rule active
16. Max 2 bowlers can bowl 3 overs
17. Committee decisions final`

    const message = `*KMCE PREMIER LEAGUE 2026*
*OFFICIAL SQUAD CONFIRMATION*

Hello Captain, your team registration for the KMCE Cricket Tournament has been *SUCCESSFULLY APPROVED*! 

*TEAM IDENTITY:*
-----------------
*Team Name:* ${team.name}
*Department:* ${team.department || 'N/A'}

*OFFICIAL SQUAD:*
-----------------
${playersList}

${rules}

*Next Steps:*
1. Share this data with your teammates.
2. Review the rules carefully.
3. Bring college ID cards for verification.

*Game on! See you on the field.*
Coordinators:
Suresh: 9390155430
Sreekar: 9063128733`

    return message
  }

  // Send WhatsApp message
  const sendWhatsApp = async (team: any) => {
    try {
      const { data: playersData, error } = await supabase.from('team_players').select('*').eq('team_id', team.id)
      if (error) throw error
      const hallTickets = playersData.map(p => p.hall_ticket)
      const { data: studentsData } = await supabase.from('student_data').select('*').in('hall_ticket', hallTickets)
      const mergedPlayers = playersData.map(player => ({
        ...player,
        student: studentsData?.find(s => s.hall_ticket === player.hall_ticket)
      }))

      const captain = mergedPlayers.find(p => p.is_captain)
      const captainPhone = captain?.student?.phone || captain?.student?.phone_number

      if (!captainPhone) {
        alert('Captain phone number not found!')
        return
      }

      // Get department from team or captain's hall ticket
      let department = team.department
      if (!department && captain?.hall_ticket) {
        const deptCode = captain.hall_ticket.substring(6, 8)
        const deptMap: { [key: string]: string } = {
          '05': 'CSE', '69': 'CSO', '04': 'ECE',
          '66': 'CSM', '62': 'CSC', '67': 'CSD'
        }
        department = deptMap[deptCode] || 'N/A'
      }

      const teamWithDept = { ...team, department: department || 'N/A' }
      const message = generateWhatsAppMessage(teamWithDept, mergedPlayers)

      const cleanPhone = captainPhone.replace(/\D/g, '')
      const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`

      // Encode message for URL - works on iOS
      const encodedMessage = encodeURIComponent(message)
      window.open(`https://wa.me/${phoneWithCountry}?text=${encodedMessage}`, '_blank')
    } catch (err) {
      console.error('Error sending WhatsApp:', err)
      alert('Failed to prepare WhatsApp message')
    }
  }

  const deptMap: { [key: string]: string } = {
    '05': 'CSE', '69': 'CSO', '04': 'ECE',
    '66': 'CSM', '62': 'CSC', '67': 'CSD'
  }

  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true)
    try {
      const { data: allTeamPlayers, error: tpErr } = await supabase
        .from('team_players')
        .select('hall_ticket, team_id')

      if (tpErr) throw tpErr

      const hallTickets = allTeamPlayers?.map(p => p.hall_ticket) || []
      const { data: studentsData } = await supabase
        .from('student_data')
        .select('*')
        .in('hall_ticket', hallTickets)

      const playersWithStudents = (allTeamPlayers || []).map(p => ({
        ...p,
        student: studentsData?.find(s => s.hall_ticket === p.hall_ticket)
      }))
      setAllPlayersData(playersWithStudents)

      const branchCounts: { [key: string]: number } = {}
      const yearCounts: { [key: string]: number } = { '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0 }
      playersWithStudents.forEach(p => {
        if (p.hall_ticket && p.hall_ticket.length >= 8) {
          const code = p.hall_ticket.substring(6, 8)
          const branch = deptMap[code] || 'OTHER'
          branchCounts[branch] = (branchCounts[branch] || 0) + 1

          const prefix = p.hall_ticket.substring(0, 4)
          if (prefix === '25P8' && p.hall_ticket.substring(0, 5) === '25P81') {
            yearCounts['1st Year']++
          } else if ((prefix === '24P8' && p.hall_ticket.substring(0, 5) === '24P81') || (prefix === '25P8' && p.hall_ticket.substring(0, 5) === '25P85')) {
            yearCounts['2nd Year']++
          } else if ((prefix === '23P8' && p.hall_ticket.substring(0, 5) === '23P81') || (prefix === '24P8' && p.hall_ticket.substring(0, 5) === '24P85')) {
            yearCounts['3rd Year']++
          } else if ((prefix === '22P8' && p.hall_ticket.substring(0, 5) === '22P81') || (prefix === '23P8' && p.hall_ticket.substring(0, 5) === '23P85')) {
            yearCounts['4th Year']++
          }
        }
      })

      const totalPlayers = teams.reduce((sum, t) => sum + (t.playerCount || 0), 0)
      const approvedTeams = teams.filter(t => t.approved).length
      const pendingTeams = teams.filter(t => !t.approved).length
      const paidTeams = teams.filter(t => t.payment?.status === 'approved').length

      setAnalyticsData({
        totalTeams: teams.length,
        approvedTeams,
        pendingTeams,
        totalPlayers,
        paidTeams,
        branchCounts,
        yearCounts
      })
    } catch (err) {
      console.error('Error fetching analytics:', err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeams(prev => {
      const next = new Set(prev)
      if (next.has(teamId)) next.delete(teamId)
      else next.add(teamId)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedTeams.size === filteredTeams.length) {
      setSelectedTeams(new Set())
    } else {
      setSelectedTeams(new Set(filteredTeams.map(t => t.id)))
    }
  }

  const exportSelectedPDF = async () => {
    const teamsToExport = selectedTeams.size > 0
      ? teams.filter(t => selectedTeams.has(t.id))
      : teams
    if (teamsToExport.length === 0) {
      alert('No teams selected')
      return
    }
    try {
      const { data: allTeamPlayers } = await supabase
        .from('team_players')
        .select('*')
      const hallTickets = allTeamPlayers?.map(p => p.hall_ticket) || []
      const { data: studentsData } = await supabase
        .from('student_data')
        .select('*')
        .in('hall_ticket', hallTickets)

      const deptMap: { [key: string]: string } = { '05': 'CSE', '69': 'CSO', '04': 'ECE', '66': 'CSM', '62': 'CSC', '67': 'CSD' }

      let teamsHTML = ''
      teamsToExport.forEach((team, idx) => {
        const tp = allTeamPlayers?.filter(p => p.team_id === team.id) || []
        const playersRows = tp.map((p, i) => {
          const student = studentsData?.find(s => s.hall_ticket === p.hall_ticket)
          const deptCode = p.hall_ticket?.substring(6, 8) || ''
          const dept = deptMap[deptCode] || 'OTHER'
          return `<tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
            <td style="padding:8px 12px;border:1px solid #e5e7eb">${i + 1}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600">${student?.name || '-'}${p.is_captain ? ' ⭐' : ''}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-family:monospace;font-size:12px">${p.hall_ticket}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb">${student?.phone || student?.phone_number || '-'}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb">${dept}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;text-transform:capitalize">${p.player_role || '-'}</td>
          </tr>`
        }).join('')

        teamsHTML += `
          <div style="page-break-inside:avoid;margin-bottom:30px;border:2px solid #1a7a4f;border-radius:12px;overflow:hidden">
            <div style="background:linear-gradient(135deg,#1a7a4f,#15803d);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:1px">${idx + 1}. ${team.name}</div>
                <div style="font-size:12px;opacity:0.85;margin-top:2px">Captain: ${team.captain?.name || '-'} | Players: ${tp.length}</div>
              </div>
              <div style="background:${team.approved ? 'rgba(255,255,255,0.25)' : 'rgba(255,200,0,0.3)'};padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">${team.approved ? 'Approved' : 'Pending'}</div>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead>
                <tr style="background:#f0fdf4">
                  <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;font-size:11px;text-transform:uppercase;color:#166534;letter-spacing:1px;width:40px">#</th>
                  <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;font-size:11px;text-transform:uppercase;color:#166534;letter-spacing:1px">Name</th>
                  <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;font-size:11px;text-transform:uppercase;color:#166534;letter-spacing:1px">Hall Ticket</th>
                  <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;font-size:11px;text-transform:uppercase;color:#166534;letter-spacing:1px">Phone</th>
                  <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;font-size:11px;text-transform:uppercase;color:#166534;letter-spacing:1px">Dept</th>
                  <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;font-size:11px;text-transform:uppercase;color:#166534;letter-spacing:1px">Role</th>
                </tr>
              </thead>
              <tbody>${playersRows}</tbody>
            </table>
          </div>`
      })

      const htmlContent = `<!DOCTYPE html><html><head><title>KMCE Cricket Teams</title><style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:30px;color:#111;background:#fff}
        @media print{body{padding:15px}@page{margin:15mm;size:A4}}
      </style></head><body>
        <div style="text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #1a7a4f">
          <div style="font-size:28px;font-weight:900;color:#1a7a4f;letter-spacing:2px">🏏 KMCE CRICKET CHAMPIONSHIP 2026</div>
          <div style="font-size:13px;color:#666;margin-top:6px">Team-wise Player List | Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} | Teams: ${teamsToExport.length}</div>
        </div>
        ${teamsHTML}
        <div style="text-align:center;margin-top:30px;padding-top:15px;border-top:1px solid #e5e7eb;font-size:11px;color:#999">KMCE Cricket Tournament — Confidential</div>
      </body></html>`

      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        setTimeout(() => printWindow.print(), 500)
      }
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Failed to generate PDF')
    }
  }

  const toggleAnalytics = () => {
    const next = !showAnalytics
    setShowAnalytics(next)
    if (next) fetchAnalyticsData()
  }

  const exportTeamsCSV = async () => {
    try {
      const { data: allTeamPlayers } = await supabase
        .from('team_players')
        .select('*')
      const hallTickets = allTeamPlayers?.map(p => p.hall_ticket) || []
      const { data: studentsData } = await supabase
        .from('student_data')
        .select('*')
        .in('hall_ticket', hallTickets)

      const deptMap: { [key: string]: string } = { '05': 'CSE', '69': 'CSO', '04': 'ECE', '66': 'CSM', '62': 'CSC', '67': 'CSD' }

      let csv = 'Team Name,Status,Captain,Player Name,Hall Ticket,Phone,Department,Role,Is Captain\n'
      teams.forEach(team => {
        const teamPlayers = allTeamPlayers?.filter(p => p.team_id === team.id) || []
        if (teamPlayers.length === 0) {
          csv += `"${team.name}",${team.approved ? 'Approved' : 'Pending'},"${team.captain?.name || ''}","","","","","",""\n`
        } else {
          teamPlayers.forEach(p => {
            const student = studentsData?.find(s => s.hall_ticket === p.hall_ticket)
            const deptCode = p.hall_ticket?.substring(6, 8) || ''
            const dept = deptMap[deptCode] || 'OTHER'
            csv += `"${team.name}",${team.approved ? 'Approved' : 'Pending'},"${team.captain?.name || ''}","${student?.name || ''}","${p.hall_ticket}","${student?.phone || student?.phone_number || ''}","${dept}","${p.player_role || ''}","${p.is_captain ? 'Yes' : 'No'}"\n`
          })
        }
      })

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `KMCE_Cricket_Teams_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      alert('Failed to export data')
    }
  }

  const exportTeamsPDF = async () => {
    try {
      const { data: allTeamPlayers } = await supabase
        .from('team_players')
        .select('*')
      const hallTickets = allTeamPlayers?.map(p => p.hall_ticket) || []
      const { data: studentsData } = await supabase
        .from('student_data')
        .select('*')
        .in('hall_ticket', hallTickets)

      const deptMap: { [key: string]: string } = { '05': 'CSE', '69': 'CSO', '04': 'ECE', '66': 'CSM', '62': 'CSC', '67': 'CSD' }

      let teamsHTML = ''
      teams.forEach((team, idx) => {
        const teamPlayers = allTeamPlayers?.filter(p => p.team_id === team.id) || []
        const playersRows = teamPlayers.map((p, i) => {
          const student = studentsData?.find(s => s.hall_ticket === p.hall_ticket)
          const deptCode = p.hall_ticket?.substring(6, 8) || ''
          const dept = deptMap[deptCode] || 'OTHER'
          return `<tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
            <td style="padding:8px 12px;border:1px solid #e5e7eb">${i + 1}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600">${student?.name || '-'}${p.is_captain ? ' ⭐' : ''}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;font-family:monospace;font-size:12px">${p.hall_ticket}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb">${student?.phone || student?.phone_number || '-'}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb">${dept}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;text-transform:capitalize">${p.player_role || '-'}</td>
          </tr>`
        }).join('')

        teamsHTML += `
          <div style="page-break-inside:avoid;margin-bottom:30px;border:2px solid #1a7a4f;border-radius:12px;overflow:hidden">
            <div style="background:linear-gradient(135deg,#1a7a4f,#15803d);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:1px">${idx + 1}. ${team.name}</div>
                <div style="font-size:12px;opacity:0.85;margin-top:2px">Captain: ${team.captain?.name || '-'} | Players: ${teamPlayers.length}</div>
              </div>
              <div style="background:${team.approved ? 'rgba(255,255,255,0.25)' : 'rgba(255,200,0,0.3)'};padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">${team.approved ? 'Approved' : 'Pending'}</div>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead>
                <tr style="background:#f0fdf4">
                  <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;font-size:11px;text-transform:uppercase;color:#166534;letter-spacing:1px;width:40px">#</th>
                  <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;font-size:11px;text-transform:uppercase;color:#166534;letter-spacing:1px">Name</th>
                  <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;font-size:11px;text-transform:uppercase;color:#166534;letter-spacing:1px">Hall Ticket</th>
                  <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;font-size:11px;text-transform:uppercase;color:#166534;letter-spacing:1px">Phone</th>
                  <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;font-size:11px;text-transform:uppercase;color:#166534;letter-spacing:1px">Dept</th>
                  <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;font-size:11px;text-transform:uppercase;color:#166534;letter-spacing:1px">Role</th>
                </tr>
              </thead>
              <tbody>${playersRows}</tbody>
            </table>
          </div>`
      })

      const htmlContent = `<!DOCTYPE html><html><head><title>KMCE Cricket Teams</title><style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:30px;color:#111;background:#fff}
        @media print{body{padding:15px}@page{margin:15mm;size:A4}}
      </style></head><body>
        <div style="text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #1a7a4f">
          <div style="font-size:28px;font-weight:900;color:#1a7a4f;letter-spacing:2px">🏏 KMCE CRICKET CHAMPIONSHIP 2026</div>
          <div style="font-size:13px;color:#666;margin-top:6px">Team-wise Player List | Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} | Total Teams: ${teams.length}</div>
        </div>
        ${teamsHTML}
        <div style="text-align:center;margin-top:30px;padding-top:15px;border-top:1px solid #e5e7eb;font-size:11px;color:#999">KMCE Cricket Tournament — Confidential</div>
      </body></html>`

      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        setTimeout(() => printWindow.print(), 500)
      }
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Failed to generate PDF')
    }
  }

  const openMessageAllModal = async (team: any) => {
    setMessageTeam(team)
    setCustomMessage(`Hi ${team.name} members! `)
    setMessageSending(true)
    setShowMessageModal(true)
    try {
      const { data: playersData, error } = await supabase
        .from('team_players')
        .select('*')
        .eq('team_id', team.id)
      if (error) throw error
      const hallTickets = playersData.map(p => p.hall_ticket)
      const { data: studentsData } = await supabase
        .from('student_data')
        .select('*')
        .in('hall_ticket', hallTickets)
      const members = playersData.map(p => ({
        ...p,
        student: studentsData?.find(s => s.hall_ticket === p.hall_ticket)
      }))
      setMessageMembers(members)
    } catch (err) {
      console.error('Error fetching team members:', err)
    } finally {
      setMessageSending(false)
    }
  }

  const copyMessageToClipboard = () => {
    navigator.clipboard.writeText(customMessage)
      .then(() => alert('Message copied to clipboard!'))
      .catch(() => alert('Failed to copy message'))
  }

  const openWhatsAppForMember = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`
    const encodedMessage = encodeURIComponent(customMessage)
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodedMessage}`, '_blank')
  }

  const sendToAllMembers = () => {
    if (!customMessage.trim()) {
      alert('Please type a message first')
      return
    }
    const phonesWithData = messageMembers
      .map(m => m.student?.phone || m.student?.phone_number)
      .filter(Boolean)
    if (phonesWithData.length === 0) {
      alert('No phone numbers found for this team')
      return
    }
    setMessageSending(true)
    phonesWithData.forEach((phone: string, index: number) => {
      setTimeout(() => {
        openWhatsAppForMember(phone)
        if (index === phonesWithData.length - 1) {
          setMessageSending(false)
        }
      }, index * 800)
    })
  }

  const filteredTeams = teams.filter(t => {
    if (filter === 'all') return true
    if (filter === 'approved') return t.approved
    if (filter === 'pending') return !t.approved
    return true
  })

  if (!isAdmin && loading) return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-500"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white selection:bg-cricket-500/30 pb-24 md:pb-20">
      {/* Admin Navbar */}
      <nav className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-[#0a0f1a]/90">
        <div className="max-w-7xl mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            <Link href="/" className="text-slate-400 hover:text-white font-bold text-xs md:text-sm flex items-center gap-1.5 transition-colors min-h-[44px]">
              <span>←</span> <span className="hidden sm:inline">Home</span>
            </Link>
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="text-lg md:text-2xl">🏏</span>
              <span className="font-black text-base md:text-xl tracking-tight">KMCE<span className="text-cricket-500">Cricket</span></span>
              <span className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 bg-cricket-500/20 rounded text-[8px] md:text-[10px] font-black uppercase tracking-widest text-cricket-400 border border-cricket-500/30">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={toggleAnalytics}
              className={`w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center min-h-[44px] ${showAnalytics ? 'bg-cricket-500/20 border-cricket-500/30 text-cricket-400' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
            >
              <span className="md:hidden">📊</span>
              <span className="hidden md:inline">📊 Analytics</span>
            </button>
            <button
              onClick={exportTeamsCSV}
              className="hidden md:flex w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/10 items-center justify-center min-h-[44px]"
              title="Export CSV"
            >
              <span className="hidden md:inline">📥 CSV</span>
            </button>
            <button
              onClick={exportTeamsPDF}
              className="hidden md:flex w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/10 items-center justify-center min-h-[44px]"
              title="Export PDF"
            >
              <span className="hidden md:inline">📄 PDF</span>
            </button>
            <Link href="/admin/tournament-settings" className="hidden md:flex w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/10 items-center justify-center">
              <span className="hidden md:inline">⚙️ Settings</span>
            </Link>
            <button
              onClick={async () => { clearSessionStartTime(); await supabase.auth.signOut(); router.push('/') }}
              className="hidden md:flex px-3 md:px-4 py-2 text-xs md:text-sm font-bold text-red-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-all min-h-[44px] items-center"
            >
              Logout
            </button>
            <button
              onClick={() => setShowMobileActions(!showMobileActions)}
              className="md:hidden w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl text-lg font-bold transition-all border border-white/10 flex items-center justify-center min-h-[44px] min-w-[44px]"
            >
              ⋮
            </button>
          </div>
        </div>
        {showMobileActions && (
          <div className="md:hidden bg-[#0a0f1a] border-b border-white/10 animate-fadeIn">
            <div className="max-w-7xl mx-auto px-3 py-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => { exportTeamsCSV(); setShowMobileActions(false) }}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/10 min-h-[44px]"
              >
                📥 CSV Export
              </button>
              <button
                onClick={() => { exportTeamsPDF(); setShowMobileActions(false) }}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/10 min-h-[44px]"
              >
                📄 PDF Export
              </button>
              <Link
                href="/admin/tournament-settings"
                className="flex items-center justify-center gap-2 px-3 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/10 min-h-[44px]"
              >
                ⚙️ Settings
              </Link>
              <button
                onClick={async () => { clearSessionStartTime(); await supabase.auth.signOut(); router.push('/') }}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-xs font-bold text-red-400 transition-all border border-red-500/20 min-h-[44px]"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-3 md:px-4 mt-6 md:mt-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-12 gap-4 md:gap-6">
          <div>
            <div className="text-cricket-500 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1 md:mb-2">Governance Console</div>
            <h1 className="text-2xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">Management Center</h1>
          </div>

          <div className="flex bg-white/5 border border-white/10 p-0.5 md:p-1 rounded-xl md:rounded-2xl overflow-hidden backdrop-blur-xl w-full md:w-auto">
            {['pending', 'approved', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all min-h-[44px] ${filter === f ? 'bg-cricket-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Section */}
        {showAnalytics && (
          <div className="mb-8 md:mb-12 animate-fadeIn">
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cricket-500"></div>
              </div>
            ) : analyticsData && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {[
                    { label: 'Total Teams', value: analyticsData.totalTeams, color: 'text-white' },
                    { label: 'Approved', value: analyticsData.approvedTeams, color: 'text-green-400' },
                    { label: 'Pending', value: analyticsData.pendingTeams, color: 'text-yellow-500' },
                    { label: 'Total Players', value: analyticsData.totalPlayers, color: 'text-cricket-400' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5">
                      <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
                      <div className={`text-2xl md:text-3xl font-black ${stat.color}`}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[32px] p-4 md:p-6">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Branch-wise Breakdown</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {Object.entries(analyticsData.branchCounts || {}).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([branch, count]) => (
                      <div key={branch} className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
                        <div className="text-lg md:text-2xl font-black text-cricket-400">{count as number}</div>
                        <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{branch}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[32px] p-4 md:p-6">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Year-wise Breakdown</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(analyticsData.yearCounts || {}).map(([year, count]) => (
                      <div key={year} className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
                        <div className="text-lg md:text-2xl font-black text-indigo-400">{count as number}</div>
                        <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{year}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[32px] overflow-hidden">
                  <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/10 bg-white/[0.02]">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Team Overview</div>
                  </div>
                  <div className="divide-y divide-white/[0.05]">
                    {teams.map((team) => (
                      <div key={team.id} className="px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="font-black text-xs md:text-sm uppercase italic truncate">{team.name}</span>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex-shrink-0">{team.captain?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[9px] font-black text-cricket-500/70 uppercase tracking-widest">{team.playerCount || 0} players</span>
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${team.approved ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'}`}>
                            {team.approved ? 'Approved' : 'Pending'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${team.payment?.status === 'approved' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : team.payment?.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : team.payment?.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-slate-500/10 text-slate-600 border-white/5'}`}>
                            {team.payment?.status || 'No Payment'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selection Toolbar - Desktop */}
        {selectedTeams.size > 0 && (
          <div className="hidden lg:flex mb-4 bg-cricket-600/10 border border-cricket-500/20 rounded-2xl p-3 md:p-4 flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-xs md:text-sm font-black text-cricket-400">{selectedTeams.size} team{selectedTeams.size > 1 ? 's' : ''} selected</span>
              <button onClick={() => setSelectedTeams(new Set())} className="text-[10px] md:text-xs text-slate-500 hover:text-white font-bold uppercase tracking-widest transition-colors">Clear</button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={exportSelectedPDF}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-cricket-600 text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-cricket-500 transition-all min-h-[44px] flex items-center justify-center gap-1.5"
              >
                📄 Export Selected PDF
              </button>
            </div>
          </div>
        )}

        {/* Teams Table - Desktop */}
        <div className="hidden lg:block bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="pl-6 pr-2 py-6 w-12">
                    <button onClick={toggleSelectAll} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all min-h-[24px] min-w-[24px] ${selectedTeams.size === filteredTeams.length && filteredTeams.length > 0 ? 'bg-cricket-500 border-cricket-500 text-white' : 'border-slate-600 hover:border-cricket-500'}`}>
                      {selectedTeams.size === filteredTeams.length && filteredTeams.length > 0 && <span className="text-xs">✓</span>}
                    </button>
                  </th>
                  <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Team Identity</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Captain Details</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Payment Audit</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Decision Status</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredTeams.map((team) => (
                  <React.Fragment key={team.id}>
                    <tr className={`hover:bg-white/[0.02] transition-colors group ${selectedTeams.has(team.id) ? 'bg-cricket-600/5' : ''}`}>
                      <td className="pl-6 pr-2 py-6">
                        <button onClick={() => toggleTeamSelection(team.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedTeams.has(team.id) ? 'bg-cricket-500 border-cricket-500 text-white' : 'border-slate-600 hover:border-cricket-500'}`}>
                          {selectedTeams.has(team.id) && <span className="text-xs">✓</span>}
                        </button>
                      </td>
                      <td className="px-6 py-6">
                        <div className="font-black text-xl uppercase italic group-hover:text-cricket-400 transition-colors tracking-tight">{team.name || 'UNNAMED SQUAD'}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{team.sport}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                          <span className="text-[10px] font-black text-cricket-500/70 tracking-widest uppercase">{team.playerCount || 0} ATHLETES</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm">
                        <div className="font-black text-white hover:text-cricket-400 transition-colors uppercase tracking-tight">{team.captain?.name}</div>
                        <div className="text-slate-500 font-mono text-xs mt-1">
                          {team.captain?.hall_ticket} • {team.captain?.phone || (team.captain as any)?.phone_number || 'No Contact'}
                        </div>
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
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col gap-2 items-end">
                          <button
                            onClick={() => toggleTeamDetails(team.id)}
                            className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors"
                          >
                            {expandedTeamId === team.id ? 'Collapse ▴' : 'Inspect Squad ▾'}
                          </button>

                          <div className="flex gap-2 flex-wrap justify-end">
                            {team.payment && team.payment.status === 'pending' && (
                              <>
                                <button onClick={() => handleAction(team.id, 'approve_payment')} className="w-8 h-8 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 flex items-center justify-center hover:bg-green-500 hover:text-black transition-all">✓</button>
                                <button onClick={() => handleAction(team.id, 'reject_payment')} className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center hover:bg-red-50 hover:text-black transition-all">✗</button>
                              </>
                            )}
                            {team.payment && team.payment.status === 'rejected' && (
                              <button
                                onClick={() => { if (confirm('Request repayment? This will allow the team to submit a new payment.')) handleAction(team.id, 'request_repayment') }}
                                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500 hover:text-black transition-all"
                              >
                                Repay
                              </button>
                            )}
                            {team.approved && (
                              <button
                                onClick={() => sendWhatsApp(team)}
                                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600 hover:text-white transition-all flex items-center gap-1"
                              >
                                📱 WhatsApp
                              </button>
                            )}
                            <button
                              onClick={() => openMessageAllModal(team)}
                              className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-all flex items-center gap-1"
                            >
                              📩 All
                            </button>
                            <button
                              onClick={() => handleAction(team.id, team.approved ? 'reject_team' : 'approve_team')}
                              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${team.approved ? 'bg-white/5 text-slate-500 hover:bg-red-500 hover:text-white' : 'bg-white text-black hover:bg-cricket-500 shadow-lg'}`}
                            >
                              {team.approved ? 'Revoke' : 'Register 🚀'}
                            </button>
                            <button
                              onClick={() => { if (confirm('DELETE this team completely? This cannot be undone!')) handleAction(team.id, 'delete_team') }}
                              className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {expandedTeamId === team.id && (
                      <tr className="bg-white/[0.01]">
                        <td colSpan={6} className="px-8 py-8">
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
                                    <th className="px-6 py-4">Phone</th>
                                    <th className="px-6 py-4">Year</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02]">
                                  {teamPlayers.map((p, idx) => (
                                    <tr key={idx} className="text-xs hover:bg-white/[0.02]">
                                      <td className="px-6 py-4 font-black uppercase tracking-tight">{p.student?.name}</td>
                                      <td className="px-6 py-4 text-slate-500 font-mono">{p.hall_ticket}</td>
                                      <td className="px-6 py-4 text-cricket-500 font-mono">
                                        <a href={`tel:${p.student?.phone || p.student?.phone_number}`} className="hover:text-cricket-400 transition-colors">
                                          {p.student?.phone || p.student?.phone_number || 'N/A'}
                                        </a>
                                      </td>
                                      <td className="px-6 py-4 text-slate-400 font-bold">{p.student?.year} Year</td>
                                      <td className="px-6 py-4">
                                        {editingPlayer === p.id ? (
                                          <select
                                            value={editPlayerRole}
                                            onChange={(e) => setEditPlayerRole(e.target.value)}
                                            className="bg-[#1e293b] border border-white/20 rounded-lg px-2 py-1 text-xs"
                                          >
                                            <option value="Batsman">Batsman</option>
                                            <option value="Bowler">Bowler</option>
                                            <option value="All-Rounder">All-Rounder</option>
                                            <option value="Wicket Keeper">Wicket Keeper</option>
                                          </select>
                                        ) : (
                                          <span className="text-cricket-500/70 font-black uppercase tracking-widest text-[10px]">{p.player_role}</span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4">
                                        {p.is_captain ? <span className="text-yellow-500 font-black text-[10px] tracking-widest">★ LEADER</span> : <span className="text-slate-700 font-black text-[10px] uppercase tracking-widest">MEMBER</span>}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          {editingPlayer === p.id ? (
                                            <>
                                              <button
                                                onClick={() => handleSavePlayerEdit(p.id, team.id)}
                                                disabled={savingPlayer}
                                                className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-[9px] font-black uppercase hover:bg-green-500 hover:text-white transition-all"
                                              >
                                                {savingPlayer ? '...' : 'Save'}
                                              </button>
                                              <button
                                                onClick={() => { setEditingPlayer(null); setEditPlayerRole('') }}
                                                className="px-3 py-1.5 bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded-lg text-[9px] font-black uppercase hover:bg-slate-500 hover:text-white transition-all"
                                              >
                                                Cancel
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <button
                                                onClick={() => handleEditPlayer(p.id, p.player_role)}
                                                className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-[9px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all"
                                              >
                                                ✏️ Edit
                                              </button>
                                              <button
                                                onClick={() => handleRemovePlayer(p.id, p.student?.name || 'Unknown', p.is_captain, team.id)}
                                                className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all"
                                              >
                                                🗑️ Remove
                                              </button>
                                            </>
                                          )}
                                        </div>
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
        </div>

        {/* Teams - Mobile Card View */}
        <div className="lg:hidden space-y-3 md:space-y-4">
          {/* Mobile Select All */}
          <div className="flex items-center justify-between px-1">
            <button onClick={toggleSelectAll} className="flex items-center gap-2.5 min-h-[44px] min-w-[44px] active:scale-95 transition-all">
              <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${selectedTeams.size === filteredTeams.length && filteredTeams.length > 0 ? 'bg-cricket-500 border-cricket-500 text-white' : 'border-slate-600'}`}>
                {selectedTeams.size === filteredTeams.length && filteredTeams.length > 0 && <span className="text-sm">✓</span>}
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select All</span>
            </button>
            {selectedTeams.size > 0 && (
              <span className="text-[10px] font-black text-cricket-400 uppercase tracking-widest">{selectedTeams.size} selected</span>
            )}
          </div>
          {filteredTeams.map((team) => (
            <div key={team.id} className={`border rounded-2xl md:rounded-[32px] px-3 py-3 md:p-6 space-y-3 md:space-y-6 transition-all ${selectedTeams.has(team.id) ? 'bg-cricket-600/10 border-cricket-500/30' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleTeamSelection(team.id)} className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedTeams.has(team.id) ? 'bg-cricket-500 border-cricket-500 text-white' : 'border-slate-600'}`}>
                    {selectedTeams.has(team.id) && <span className="text-xs">✓</span>}
                  </div>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="font-black text-sm md:text-xl uppercase italic tracking-tight leading-none truncate">{team.name || 'UNNAMED SQUAD'}</div>
                  <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{team.playerCount || 0} players</div>
                </div>
                <button onClick={() => toggleTeamDetails(team.id)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-sm active:scale-95 transition-all text-white flex-shrink-0 min-h-[44px] min-w-[44px]">
                  {expandedTeamId === team.id ? '▲' : '▼'}
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                <span className="text-slate-500 font-bold">Captain:</span>
                <span className="font-black uppercase italic truncate max-w-[120px]">{team.captain?.name || 'N/A'}</span>
                <span className="text-slate-600">•</span>
                <span className={`font-black uppercase tracking-wide ${team.approved ? 'text-green-400' : 'text-yellow-500'}`}>
                  {team.approved ? '✓ Approved' : '⏳ Pending'}
                </span>
              </div>

              {team.payment && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-black text-slate-500 uppercase">UTR:</span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 truncate max-w-[100px]">{team.payment.utr_number}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wide border ${team.payment.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' : team.payment.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'}`}>
                    {team.payment.status}
                  </span>
                  {team.payment.screenshot_url && (
                    <a
                      href={team.payment.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-md text-[8px] font-black uppercase hover:bg-indigo-500 hover:text-white transition-all"
                    >
                      📷 Proof
                    </a>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                {!team.approved ? (
                  <button onClick={() => handleAction(team.id, 'approve_team')} className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all min-h-[44px]">✓ Approve</button>
                ) : (
                  <button onClick={() => handleAction(team.id, 'reject_team')} className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all min-h-[44px]">✗ Reject</button>
                )}
                {team.payment && team.payment.status === 'pending' && (
                  <button onClick={() => handleAction(team.id, 'approve_payment')} className="px-3 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all min-h-[44px]">💰 Verify</button>
                )}
                {team.payment && team.payment.status === 'rejected' && (
                  <button onClick={() => { if (confirm('Request repayment?')) handleAction(team.id, 'request_repayment') }} className="px-3 py-2 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all min-h-[44px]">🔄 Repay</button>
                )}
                {team.approved && (
                  <button onClick={() => sendWhatsApp(team)} className="px-3 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all min-h-[44px] flex items-center gap-1">
                    📱 WA
                  </button>
                )}
                <button onClick={() => openMessageAllModal(team)} className="px-3 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all min-h-[44px] flex items-center gap-1">
                  📩 Msg
                </button>
                <button onClick={() => { if (confirm('DELETE this team completely?')) handleAction(team.id, 'delete_team') }} className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all min-h-[44px]">🗑️ Delete</button>
              </div>

              {expandedTeamId === team.id && (
                <div className="animate-fadeIn space-y-2 pt-3 border-t border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Squad Roster Audit</h4>
                  {teamPlayers.map((p, idx) => (
                    <div key={idx} className="bg-white/5 p-2.5 rounded-lg border border-white/5 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-black uppercase italic">{p.student?.name}</div>
                          {editingPlayer === p.id ? (
                            <select
                              value={editPlayerRole}
                              onChange={(e) => setEditPlayerRole(e.target.value)}
                              className="mt-1 bg-[#1e293b] border border-white/20 rounded-lg px-2 py-1 text-[10px]"
                            >
                              <option value="Batsman">Batsman</option>
                              <option value="Bowler">Bowler</option>
                              <option value="All-Rounder">All-Rounder</option>
                              <option value="Wicket Keeper">Wicket Keeper</option>
                            </select>
                          ) : (
                            <div className="text-[9px] font-bold text-slate-500 uppercase">{p.player_role}</div>
                          )}
                          <a href={`tel:${p.student?.phone || p.student?.phone_number}`} className="text-[10px] font-mono text-cricket-500 hover:text-cricket-400">
                            {p.student?.phone || p.student?.phone_number || 'N/A'}
                          </a>
                        </div>
                        {p.is_captain && <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">LEADER</span>}
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        {editingPlayer === p.id ? (
                          <>
                            <button
                              onClick={() => handleSavePlayerEdit(p.id, team.id)}
                              disabled={savingPlayer}
                              className="flex-1 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-[9px] font-black uppercase hover:bg-green-500 hover:text-white transition-all min-h-[36px]"
                            >
                              {savingPlayer ? '...' : 'Save'}
                            </button>
                            <button
                              onClick={() => { setEditingPlayer(null); setEditPlayerRole('') }}
                              className="flex-1 py-2 bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded-lg text-[9px] font-black uppercase hover:bg-slate-500 hover:text-white transition-all min-h-[36px]"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditPlayer(p.id, p.player_role)}
                              className="flex-1 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-[9px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all min-h-[36px]"
                            >
                              ✏️ Edit Role
                            </button>
                            <button
                              onClick={() => handleRemovePlayer(p.id, p.student?.name || 'Unknown', p.is_captain, team.id)}
                              className="flex-1 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all min-h-[36px]"
                            >
                              🗑️ Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Match Scheduling Section */}
        <div className="mt-12 md:mt-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 md:mb-8">
            <div>
              <div className="text-cricket-500 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1 md:mb-2">Tournament Ops</div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase italic leading-none">Match Schedule</h1>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={openMatchGenerator}
                className="flex-1 sm:flex-none px-4 md:px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all min-h-[44px]"
              >
                🎲 Random
              </button>
              <button
                onClick={() => setShowScheduleForm(!showScheduleForm)}
                className="flex-1 sm:flex-none px-4 md:px-6 py-3 bg-cricket-600 text-white rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg shadow-cricket-600/30 hover:scale-105 transition-all min-h-[44px]"
              >
                {showScheduleForm ? 'Close' : 'Schedule 📅'}
              </button>
            </div>
          </div>

          {showScheduleForm && (
            <div className="bg-white/5 border border-white/10 p-4 md:p-8 rounded-2xl md:rounded-[40px] mb-8 md:mb-12 animate-fadeIn">
              <form onSubmit={handleScheduleMatch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Team A (Home)</label>
                  <select
                    required
                    value={newMatch.team_a_id}
                    onChange={(e) => setNewMatch({ ...newMatch, team_a_id: e.target.value })}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cricket-500 outline-none transition-all min-h-[44px]"
                  >
                    <option value="">Select Team</option>
                    {teams.filter(t => t.approved).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Team B (Away)</label>
                  <select
                    required
                    value={newMatch.team_b_id}
                    onChange={(e) => setNewMatch({ ...newMatch, team_b_id: e.target.value })}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cricket-500 outline-none transition-all min-h-[44px]"
                  >
                    <option value="">Select Team</option>
                    {teams.filter(t => t.approved).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Venue</label>
                  <input
                    required
                    type="text"
                    value={newMatch.venue}
                    onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cricket-500 outline-none transition-all min-h-[44px]"
                    placeholder="e.g. Main Stadium Ground"
                  />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</label>
                  <input
                    required
                    type="date"
                    value={newMatch.match_date}
                    onChange={(e) => setNewMatch({ ...newMatch, match_date: e.target.value })}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cricket-500 outline-none transition-all min-h-[44px]"
                  />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Time</label>
                  <input
                    required
                    type="time"
                    value={newMatch.match_time}
                    onChange={(e) => setNewMatch({ ...newMatch, match_time: e.target.value })}
                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cricket-500 outline-none transition-all min-h-[44px]"
                  />
                </div>
                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <button type="submit" className="w-full py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-cricket-500 transition-all shadow-lg active:scale-95 min-h-[44px]">Schedule 🚀</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mt-8 md:mt-12">
            {matches.map((match) => (
              <div key={match.id} className="bg-white/5 border border-white/10 p-5 md:p-8 rounded-2xl md:rounded-[40px] relative overflow-hidden group hover:bg-white/[0.08] transition-all">
                <div className="flex justify-between items-start mb-5 md:mb-8">
                  <div className="text-[9px] md:text-[10px] font-black text-cricket-400 uppercase tracking-widest bg-cricket-500/10 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-cricket-500/20">
                    {new Date(match.match_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <button
                    onClick={() => deleteMatch(match.id)}
                    className="w-11 h-11 md:w-11 md:h-11 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center text-xs hover:bg-red-500 hover:text-white transition-all shadow-lg min-h-[44px] min-w-[44px]"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 md:gap-6 mb-6 md:mb-10">
                  <div className="flex-1 text-center min-w-0">
                    <div className="text-[9px] md:text-[10px] text-white/40 font-black uppercase tracking-widest mb-0.5 md:mb-1">Home</div>
                    <div className="text-sm md:text-xl font-black uppercase italic text-white leading-tight truncate">{match.team_a?.name}</div>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white/5 rounded-full border border-white/10 text-[8px] md:text-[9px] font-black text-cricket-500 italic flex-shrink-0">VS</div>
                  <div className="flex-1 text-center min-w-0">
                    <div className="text-[9px] md:text-[10px] text-white/40 font-black uppercase tracking-widest mb-0.5 md:mb-1">Away</div>
                    <div className="text-sm md:text-xl font-black uppercase italic text-white leading-tight truncate">{match.team_b?.name}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 md:pt-6 border-t border-white/5 gap-2">
                  <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">🕒 {match.match_time.slice(0, 5)}</div>
                  <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">📍 {match.venue}</div>
                </div>
              </div>
            ))}
          </div>

          {matches.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[32px] p-8 md:p-12 text-center">
              <div className="text-2xl opacity-30 mb-2">📅</div>
              <div className="text-[10px] md:text-xs font-black text-slate-600 uppercase tracking-widest">No matches scheduled yet</div>
            </div>
          )}
        </div>
      </main>

      {/* Message All Members Modal */}
      {showMessageModal && messageTeam && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-[32px] p-5 md:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base md:text-xl font-black uppercase tracking-tight">Message All — {messageTeam.name}</h2>
              <button
                onClick={() => { setShowMessageModal(false); setMessageTeam(null); setMessageMembers([]) }}
                className="text-slate-500 hover:text-white transition-colors text-2xl min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Custom Message</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cricket-500 outline-none transition-all resize-none"
                  placeholder="Type your message..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={copyMessageToClipboard}
                  className="py-3 bg-cricket-500/20 text-cricket-400 border border-cricket-500/30 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-cricket-500 hover:text-white transition-all min-h-[44px]"
                >
                  📋 Copy Message
                </button>
                <button
                  onClick={sendToAllMembers}
                  disabled={messageSending}
                  className="py-3 bg-green-600/20 text-green-400 border border-green-500/30 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all min-h-[44px] disabled:opacity-50"
                >
                  {messageSending ? '⏳ Opening...' : '🚀 Send to All'}
                </button>
              </div>

              <div>
                <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Members ({messageMembers.length})</div>
                {messageSending ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                    <div className="text-[10px] text-green-400 font-black uppercase tracking-widest">Opening WhatsApp for all members...</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messageMembers.map((m, idx) => {
                      const phone = m.student?.phone || m.student?.phone_number
                      return (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-black uppercase truncate">{m.student?.name || 'Unknown'}</div>
                            <div className="text-[10px] font-mono text-slate-500">{phone || 'No phone'}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {m.is_captain && <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">★</span>}
                            {phone && (
                              <button
                                onClick={() => openWhatsAppForMember(phone)}
                                className="px-3 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg text-[9px] font-black uppercase hover:bg-green-600 hover:text-white transition-all min-h-[44px] flex items-center"
                              >
                                📱
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Draw Knockout Bracket Modal */}
      {showMatchGenerator && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-[32px] p-6 md:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black uppercase italic tracking-tight">
                {drawPhase === 'idle' && 'Live Draw'}
                {drawPhase === 'spinning' && 'SHUFFLING...'}
                {drawPhase === 'drawing' && `Drawing team ${currentDrawIndex} of ${teams.filter(t => t.approved).length}...`}
                {drawPhase === 'complete' && 'Knockout Bracket'}
              </h2>
              <button
                onClick={() => {
                  clearAllTimers()
                  setShowMatchGenerator(false)
                  broadcastDrawEvent('draw_end', {})
                }}
                className="text-slate-500 hover:text-white transition-colors text-2xl min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {(() => {
              const approvedTeams = teams.filter(t => t.approved)

              if (approvedTeams.length < 2) {
                return (
                  <div className="text-center py-10 animate-fadeIn">
                    <div className="text-4xl mb-4">⚠️</div>
                    <p className="text-slate-400 font-bold">Need at least 2 approved teams</p>
                    <p className="text-slate-600 text-sm mt-2">Currently: {approvedTeams.length} team(s)</p>
                  </div>
                )
              }

              if (drawPhase === 'idle') {
                return (
                  <div className="animate-fadeIn">
                    <div className="mb-4 text-center">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        {approvedTeams.length} Teams in the Pool
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-6">
                      {spinningTeams.map((team) => (
                        <div key={team.id} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center transition-all">
                          <div className="font-black text-xs uppercase tracking-tight truncate">{team.name}</div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={startLiveDraw}
                      className="w-full py-4 bg-cricket-500 hover:bg-cricket-600 text-white rounded-2xl font-black text-lg uppercase italic tracking-tight transition-all min-h-[44px] animate-pulse"
                    >
                      🎲 START DRAW
                    </button>
                  </div>
                )
              }

              if (drawPhase === 'spinning') {
                return (
                  <div className="animate-fadeIn">
                    <div className="mb-4 text-center">
                      <span className="text-sm font-black text-cricket-400 uppercase tracking-widest animate-pulse">
                        Shuffling Teams...
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {spinningTeams.map((team, idx) => (
                        <div
                          key={`spin-${idx}-${team.id}`}
                          className="bg-white/5 border border-cricket-500/40 rounded-xl p-3 text-center transition-all animate-pulse"
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <div className="font-black text-xs uppercase tracking-tight truncate text-cricket-300">{team.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }

              if (drawPhase === 'drawing') {
                return (
                  <div className="animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Remaining Pool</div>
                        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
                          {spinningTeams.map((team) => (
                            <div key={team.id} className="bg-white/5 border border-white/5 rounded-lg p-2.5 text-center opacity-50 transition-all">
                              <div className="font-bold text-xs text-slate-400 truncate">{team.name}</div>
                            </div>
                          ))}
                          {spinningTeams.length === 0 && (
                            <div className="text-center py-4 text-slate-600 text-xs font-bold">All teams drawn!</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-cricket-500 uppercase tracking-widest mb-3">Bracket Order</div>
                        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
                          {drawnTeams.map((team, idx) => (
                            <div
                              key={team.id}
                              className={`border rounded-lg p-2.5 text-center transition-all ${
                                idx === drawnTeams.length - 1
                                  ? 'bg-cricket-500/20 border-cricket-500/50 scale-[1.02]'
                                  : 'bg-white/5 border-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-2 justify-center">
                                <span className="text-[10px] font-black text-slate-500 w-5">{idx + 1}</span>
                                <span className="font-black text-xs uppercase tracking-tight truncate">{team.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              if (drawPhase === 'complete') {
                return (
                  <div className="animate-fadeIn">
                    <div className="space-y-6 mb-6">
                      {bracketRounds.map((round, roundIdx) => (
                        <div key={roundIdx}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="text-[10px] font-black text-cricket-500 uppercase tracking-widest">{round.name}</div>
                            <div className="flex-1 h-px bg-white/10"></div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {round.matches.map((match: any, matchIdx: number) => (
                              <div key={matchIdx} className="bg-white/5 border border-white/10 rounded-xl p-3">
                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                  Match {match.match_num}
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 text-center">
                                    <div className={`font-black text-xs uppercase tracking-tight truncate ${match.team_a ? 'text-white' : 'text-slate-600 italic'}`}>
                                      {match.team_a ? match.team_a.name : (() => {
                                        const prevRound = bracketRounds[roundIdx - 1]
                                        if (prevRound) {
                                          const feedIdx = matchIdx * 2
                                          const feederMatch = prevRound.matches[feedIdx]
                                          if (feederMatch) return `W${feederMatch.match_num}`
                                        }
                                        return 'TBD'
                                      })()}
                                    </div>
                                    {match.is_bye && match.team_a && (
                                      <span className="inline-block mt-1 text-[8px] font-black text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded uppercase tracking-widest">BYE</span>
                                    )}
                                  </div>
                                  <div className="px-2 text-slate-600 font-black text-[10px]">VS</div>
                                  <div className="flex-1 text-center">
                                    <div className={`font-black text-xs uppercase tracking-tight truncate ${match.team_b ? 'text-white' : 'text-slate-600 italic'}`}>
                                      {match.team_b ? match.team_b.name : (() => {
                                        const prevRound = bracketRounds[roundIdx - 1]
                                        if (prevRound) {
                                          const feedIdx = matchIdx * 2 + 1
                                          const feederMatch = prevRound.matches[feedIdx]
                                          if (feederMatch) return `W${feederMatch.match_num}`
                                        }
                                        return 'TBD'
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {byeTeam && Array.isArray(byeTeam) && byeTeam.length > 0 && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 text-center">
                        <div className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mb-1">
                          Teams with Bye (Advance to Next Round)
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                          {byeTeam.map((t: any) => (
                            <span key={t.id} className="text-xs font-black text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg">{t.name}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {matchesSaved ? (
                      <div className="bg-cricket-500/10 border border-cricket-500/20 rounded-xl p-3 mb-4 text-center">
                        <p className="text-[10px] text-cricket-400 font-bold uppercase tracking-widest">
                          ✅ Bracket saved to database
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Not saved yet — use buttons below to save or redraw
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {!matchesSaved && generatedMatches.length > 0 && (
                        <button
                          onClick={saveGeneratedMatches}
                          disabled={savingMatches}
                          className="flex-1 min-w-[120px] py-3 bg-cricket-600 hover:bg-cricket-500 text-white rounded-xl font-black text-sm uppercase italic tracking-tight transition-all min-h-[44px] disabled:opacity-50"
                        >
                          {savingMatches ? '⏳ Saving...' : '💾 Save to DB'}
                        </button>
                      )}
                      {matchesSaved && (
                        <button
                          onClick={deleteAllBracketMatches}
                          disabled={savingMatches}
                          className="flex-1 min-w-[120px] py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-sm uppercase italic tracking-tight transition-all min-h-[44px] disabled:opacity-50"
                        >
                          {savingMatches ? '⏳ Deleting...' : '🗑️ Delete from DB'}
                        </button>
                      )}
                      <button
                        onClick={regenerateMatches}
                        className="flex-1 min-w-[120px] py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-sm uppercase italic tracking-tight transition-all min-h-[44px]"
                      >
                        🔄 Redraw
                      </button>
                      <button
                        onClick={() => {
                          clearAllTimers()
                          setDrawPhase('idle')
                          setDrawnTeams([])
                          setCurrentDrawIndex(0)
                          setBracketRounds([])
                          setGeneratedMatches([])
                          setByeTeam(null)
                          setMatchesSaved(false)
                          setSpinningTeams([])
                          setShowMatchGenerator(false)
                          broadcastDrawEvent('draw_end', {})
                        }}
                        className="flex-1 min-w-[120px] py-3 bg-red-500/80 hover:bg-red-600 text-white rounded-xl font-black text-sm uppercase italic tracking-tight transition-all min-h-[44px]"
                      >
                        ✖ Reset & Close
                      </button>
                    </div>
                  </div>
                )
              }

              return null
            })()}
          </div>
        </div>
      )}

      {/* Mobile Selection Toolbar - Sticky Bottom */}
      {selectedTeams.size > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0f1a]/95 backdrop-blur-md border-t border-white/10 px-4 py-3 animate-fadeIn">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-cricket-400">{selectedTeams.size} selected</span>
              <button onClick={() => setSelectedTeams(new Set())} className="text-[10px] text-slate-500 hover:text-white font-bold uppercase tracking-widest transition-colors min-h-[44px]">Clear</button>
            </div>
            <button
              onClick={exportSelectedPDF}
              className="px-4 py-2.5 bg-cricket-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cricket-500 transition-all min-h-[44px] flex items-center gap-1.5"
            >
              📄 Export PDF
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
