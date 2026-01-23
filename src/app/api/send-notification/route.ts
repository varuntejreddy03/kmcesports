import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTeamCreationEmail, sendPaymentConfirmationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { teamId, type, captainHallTicket } = await request.json()

    if (!teamId || !type || !captainHallTicket) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single()

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    if (team.captain_id !== captainHallTicket) {
      return NextResponse.json({ error: 'Unauthorized - Only the team captain can trigger notifications' }, { status: 403 })
    }

    const teamCreatedAt = new Date(team.created_at).getTime()
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000
    if (type === 'team_creation' && (now - teamCreatedAt) > fiveMinutes) {
      return NextResponse.json({ error: 'Team creation notification window expired' }, { status: 400 })
    }

    const { data: players, error: playersError } = await supabase
      .from('team_players')
      .select('*')
      .eq('team_id', teamId)

    if (playersError) {
      return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
    }

    const hallTickets = players.map(p => p.hall_ticket)
    const { data: studentsData } = await supabase
      .from('student_data')
      .select('*')
      .in('hall_ticket', hallTickets)

    const captain = players.find(p => p.is_captain)
    const captainStudent = studentsData?.find(s => s.hall_ticket === captain?.hall_ticket)

    const teamData = {
      teamName: team.name,
      teamId: team.id,
      department: team.department || 'Not specified',
      captain: {
        name: captainStudent?.student_name || 'Unknown',
        hallTicket: captain?.hall_ticket || 'Unknown',
        phone: captainStudent?.phone_number || 'Not provided'
      },
      players: players.map(p => {
        const student = studentsData?.find(s => s.hall_ticket === p.hall_ticket)
        return {
          name: student?.student_name || 'Unknown',
          hallTicket: p.hall_ticket,
          phone: student?.phone_number || 'Not provided',
          role: p.player_role || 'all-rounder',
          isCaptain: p.is_captain
        }
      })
    }

    let result

    if (type === 'team_creation') {
      result = await sendTeamCreationEmail(teamData)
    } else if (type === 'payment_confirmation') {
      result = await sendPaymentConfirmationEmail({ ...teamData, paymentStatus: 'approved' })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Email sent successfully' })
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Send notification error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
