import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: userData, error: dbError } = await supabase
      .from('students')
      .select('*')
      .eq('id', user.id)
      .single()

    if (dbError || !userData) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('captain_id', userData.hall_ticket)
      .single()

    const { data: allTeams } = await supabase
      .from('teams')
      .select('status')

    // Get team players if team exists
    let teamPlayers: any[] = []
    if (teamData) {
      const { data: players } = await supabase
        .from('team_players')
        .select(`
          hall_ticket,
          player_role
        `)
        .eq('team_id', teamData.id)

      // Get student details for each player
      if (players && players.length > 0) {
        const hallTickets = players.map(p => p.hall_ticket)
        const { data: studentDetails } = await supabase
          .from('student_data')
          .select('hall_ticket, name, year')
          .in('hall_ticket', hallTickets)

        teamPlayers = players.map(player => {
          const studentInfo = studentDetails?.find(s => s.hall_ticket === player.hall_ticket)
          return {
            ...player,
            name: studentInfo?.name || 'Unknown',
            year: studentInfo?.year || 'N/A'
          }
        })
      }
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        hallTicket: userData.hall_ticket,
        name: userData.name,
        year: userData.year,
        email: userData.email,
        phone: userData.phone,
        role: userData.role
      },
      team: teamData,
      teamPlayers,
      stats: {
        totalTeams: allTeams?.length || 0,
        approvedTeams: allTeams?.filter(t => t.status === 'approved').length || 0
      }
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}