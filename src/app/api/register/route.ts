import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, password, student, phone, captainRole } = await request.json()
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          hall_ticket: student.hall_ticket,
          name: student.name,
          role: 'captain'
        }
      }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (authData.user) {
      const { error: insertError } = await supabase
        .from('students')
        .insert({
          id: authData.user.id,
          hall_ticket: student.hall_ticket,
          name: student.name,
          year: student.year,
          phone: phone.trim(),
          email: email.trim(),
          role: 'captain',
          captain_role: captainRole
        })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}