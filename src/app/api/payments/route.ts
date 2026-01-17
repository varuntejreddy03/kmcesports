import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const teamId = formData.get('teamId') as string
    const utrNumber = formData.get('utrNumber') as string

    if (!teamId || !utrNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Store payment details in database without file upload
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        team_id: teamId,
        utr_number: utrNumber,
        amount: 2500,
        status: 'pending'
      })

    if (paymentError) {
      console.error('Payment insert error:', paymentError)
      return NextResponse.json({ error: 'Failed to save payment' }, { status: 500 })
    }

    // Update team payment status
    const { error: teamUpdateError } = await supabase
      .from('teams')
      .update({ payment_status: 'submitted' })
      .eq('id', teamId)

    if (teamUpdateError) {
      console.error('Team update error:', teamUpdateError)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Payment API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}