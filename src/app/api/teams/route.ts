import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { teamName, selectedPlayers } = await request.json()

    if (!teamName || !selectedPlayers || selectedPlayers.length < 11) {
      return NextResponse.json({ error: 'Invalid team data' }, { status: 400 })
    }

    // Insert team
    const { data: newTeam, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: teamName,
        captain_id: selectedPlayers[0].studentId,
        status: 'approved'
      })
      .select()
      .single()

    if (teamError) {
      console.error('Team creation error:', teamError)
      return NextResponse.json({ error: 'Failed to create team' }, { status: 400 })
    }

    // Insert team players
    const teamPlayersData = selectedPlayers.map((player: any) => ({
      team_id: newTeam.id,
      student_id: player.studentId,
      hall_ticket: player.studentId,
      player_role: player.playerRole
    }))

    const { error: playersError } = await supabase
      .from('team_players')
      .insert(teamPlayersData)

    if (playersError) {
      console.error('Players insertion error:', playersError)
      // Rollback team creation
      await supabase.from('teams').delete().eq('id', newTeam.id)
      return NextResponse.json({ error: 'Failed to add players' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      teamId: newTeam.id,
      message: 'Team created successfully'
    })

  } catch (error) {
    console.error('Teams API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}