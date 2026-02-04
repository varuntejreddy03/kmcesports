import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPaymentConfirmationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const DEPARTMENT_CODES: Record<string, string> = {
  '05': 'CSE',
  '69': 'CSE',
  '04': 'ECE',
  '66': 'CSM',
  '62': 'CSM',
  '67': 'CSM',
}

function getDepartmentFromHallTicket(hallTicket: string): string {
  if (!hallTicket || hallTicket.length < 8) return 'Unknown'
  const code = hallTicket.substring(6, 8)
  return DEPARTMENT_CODES[code] || 'Unknown'
}

export async function POST(request: NextRequest) {
  try {
    const { teamId, action } = await request.json()

    if (!teamId || !action) {
      return NextResponse.json({ error: 'Missing teamId or action' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Perform the database updates based on action
    let updateError = null

    if (action === 'approve_payment' || action === 'approve_team') {
      if (action === 'approve_payment') {
        const { error: pError } = await supabase.from('payments').update({ status: 'approved' }).eq('team_id', teamId)
        if (pError) updateError = pError
      }

      const { error: tError } = await supabase.from('teams').update({ approved: true }).eq('id', teamId)
      if (tError) updateError = tError

      if (!updateError) {
        try {
          const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).single()
          const { data: players } = await supabase.from('team_players').select('*').eq('team_id', teamId)

          if (team && players) {
            const hallTickets = players.map(p => p.hall_ticket)
            const { data: studentsData } = await supabase.from('student_data').select('*').in('hall_ticket', hallTickets)

            const captain = players.find(p => p.is_captain)
            const captainStudent = studentsData?.find(s => s.hall_ticket === captain?.hall_ticket)
            const captainDept = getDepartmentFromHallTicket(captain?.hall_ticket || '')

            const teamData = {
              teamName: team.name,
              teamId: team.id,
              department: captainDept,
              captain: {
                name: captainStudent?.name || 'Unknown',
                hallTicket: captain?.hall_ticket || 'Unknown',
                phone: captainStudent?.phone || 'Not provided'
              },
              players: players.map(p => {
                const student = studentsData?.find(s => s.hall_ticket === p.hall_ticket)
                return {
                  name: student?.name || 'Unknown',
                  hallTicket: p.hall_ticket,
                  phone: student?.phone || 'Not provided',
                  role: p.player_role || 'all-rounder',
                  isCaptain: p.is_captain
                }
              }),
              paymentStatus: 'approved'
            }

            await sendPaymentConfirmationEmail(teamData)
          }
        } catch (emailErr) {
          console.error('Failed to send approval confirmation email:', emailErr)
        }
      }
    } else if (action === 'reject_payment') {
      const { error: pError } = await supabase.from('payments').update({ status: 'rejected' }).eq('team_id', teamId)
      updateError = pError
    } else if (action === 'reject_team') {
      const { error: tError } = await supabase.from('teams').update({ approved: false, whatsapp_sent: false }).eq('id', teamId)
      updateError = tError
    } else if (action === 'delete_team') {
      const { data: players } = await supabase.from('team_players').select('hall_ticket').eq('team_id', teamId)
      if (players && players.length > 0) {
        const hallTickets = players.map(p => p.hall_ticket)
        await supabase.from('student_data').update({ player_role: null }).in('hall_ticket', hallTickets)
      }
      await supabase.from('team_players').delete().eq('team_id', teamId)
      await supabase.from('payments').delete().eq('team_id', teamId)
      const { error: tError } = await supabase.from('teams').delete().eq('id', teamId)
      updateError = tError
    } else if (action === 'request_repayment') {
      const { error: pError } = await supabase.from('payments').delete().eq('team_id', teamId)
      const { error: tError } = await supabase.from('teams').update({ approved: false }).eq('id', teamId)
      updateError = pError || tError
    }

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Management action processed successfully'
    })

  } catch (error: any) {
    console.error('Approval API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
