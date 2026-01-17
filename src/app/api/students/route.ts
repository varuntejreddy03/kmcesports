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
    const token = authHeader?.substring(7)

    let captainHallTicket: string | null = null
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        const { data: captainData } = await supabase
          .from('students')
          .select('hall_ticket')
          .eq('id', user.id)
          .single()
        captainHallTicket = captainData?.hall_ticket
      }
    }

    const { data: students, error } = await supabase
      .from('student_data')
      .select('hall_ticket, name, year, phone')
      .order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const formattedStudents = students
      ?.filter(student => student.hall_ticket !== captainHallTicket)
      ?.map((student: any) => ({
        id: student.hall_ticket,
        hall_ticket: student.hall_ticket,
        name: student.name,
        year: student.year,
        phone: student.phone
      })) || []

    return NextResponse.json({ students: formattedStudents })

  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}