import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { hallTicket } = await request.json()
    
    if (!hallTicket) {
      return NextResponse.json({ error: 'Hall ticket is required' }, { status: 400 })
    }

    const normalizedHallTicket = hallTicket.trim().toUpperCase()
    
    const { data: student, error } = await supabase
      .from('student_data')
      .select('*')
      .eq('hall_ticket', normalizedHallTicket)
      .single()
    
    if (error || !student) {
      return NextResponse.json({ 
        error: 'Hall ticket not found in our records' 
      }, { status: 404 })
    }

    const { data: existingStudent } = await supabase
      .from('students')
      .select('hall_ticket')
      .eq('hall_ticket', normalizedHallTicket)
      .maybeSingle()
    
    if (existingStudent) {
      return NextResponse.json({ 
        error: 'This hall ticket is already registered' 
      }, { status: 409 })
    }

    const { data: teamPlayer } = await supabase
      .from('team_players')
      .select('team_id')
      .eq('hall_ticket', normalizedHallTicket)
      .maybeSingle()
    
    if (teamPlayer) {
      return NextResponse.json({ 
        error: 'This student is already part of a team' 
      }, { status: 409 })
    }

    return NextResponse.json({ 
      success: true, 
      student: {
        hall_ticket: student.hall_ticket,
        name: student.name,
        year: student.year,
        phone: student.phone
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}