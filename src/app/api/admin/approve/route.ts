import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPaymentConfirmationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

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

    if (action === 'approve_payment') {
      const { error: pError } = await supabase.from('payments').update({ status: 'approved' }).eq('team_id', teamId)
      if (pError) updateError = pError
      const { error: tError } = await supabase.from('teams').update({ approved: true }).eq('id', teamId)
      if (tError) updateError = tError

      try {
        const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).single()
        const { data: players } = await supabase.from('team_players').select('*').eq('team_id', teamId)
        
        if (team && players) {
          const hallTickets = players.map(p => p.hall_ticket)
          const { data: studentsData } = await supabase.from('student_data').select('*').in('hall_ticket', hallTickets)
          
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
            }),
            paymentStatus: 'approved'
          }

          await sendPaymentConfirmationEmail(teamData)
        }
      } catch (emailErr) {
        console.error('Failed to send payment confirmation email:', emailErr)
      }
    } else if (action === 'approve_team') {
      const { error: tError } = await supabase.from('teams').update({ approved: true }).eq('id', teamId)
      if (tError) updateError = tError
    } else if (action === 'reject_payment') {
      const { error: pError } = await supabase.from('payments').update({ status: 'rejected' }).eq('team_id', teamId)
      updateError = pError
    } else if (action === 'reject_team') {
      // When rejecting, also reset the notification flag if needed, 
      // though messaging is disabled, keeping flag management is fine
      const { error: tError } = await supabase.from('teams').update({ approved: false, whatsapp_sent: false }).eq('id', teamId)
      updateError = tError
    } else if (action === 'delete_team') {
      // Delete team completely - first delete related records, then the team
      await supabase.from('team_players').delete().eq('team_id', teamId)
      await supabase.from('payments').delete().eq('team_id', teamId)
      const { error: tError } = await supabase.from('teams').delete().eq('id', teamId)
      updateError = tError
    } else if (action === 'request_repayment') {
      // Delete the payment record so team can submit a new one
      const { error: pError } = await supabase.from('payments').delete().eq('team_id', teamId)
      // Also set team as not approved
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
