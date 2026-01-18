import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  const { data: teams, error: teamsError } = await supabase.from('teams').select('*').limit(1)
  console.log('Teams sample:', teams)
  if (teamsError) console.error('Teams error:', teamsError)

  const { data: studentData, error: studentError } = await supabase.from('student_data').select('*').limit(1)
  console.log('StudentData sample:', studentData)
  if (studentError) console.error('StudentData error:', studentError)
}

checkSchema()
