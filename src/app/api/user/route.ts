import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('id', user.id)
      .single()

    if (studentData) {
      return NextResponse.json({
        id: studentData.id,
        hallTicket: studentData.hall_ticket,
        name: studentData.name,
        year: studentData.year,
        email: studentData.email,
        phone: studentData.phone,
        role: studentData.role
      })
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 })

  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}