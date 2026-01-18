import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
