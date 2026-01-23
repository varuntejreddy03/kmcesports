import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: true,
    detectSessionInUrl: true
  }
})

const SESSION_DURATION = 30 * 60 * 1000

export const checkSessionTimeout = () => {
  if (typeof window === 'undefined') return

  const loginTime = localStorage.getItem('session_start_time')
  if (loginTime) {
    const elapsed = Date.now() - parseInt(loginTime)
    if (elapsed > SESSION_DURATION) {
      localStorage.removeItem('session_start_time')
      supabase.auth.signOut()
      return true
    }
  }
  return false
}

export const setSessionStartTime = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('session_start_time', Date.now().toString())
  }
}

export const clearSessionStartTime = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('session_start_time')
  }
}

// KMCE College validation - check if hall ticket belongs to KMCE (P81 or P85 at positions 3-5)
export const VALID_COLLEGE_CODES = ['P81', 'P85']

export const isKMCEStudent = (hallTicket: string): boolean => {
  if (!hallTicket || hallTicket.length < 6) return false
  const collegeCode = hallTicket.substring(2, 5).toUpperCase() // Characters at position 3-5 (0-indexed: 2-4)
  return VALID_COLLEGE_CODES.includes(collegeCode)
}

// Department validation for team creation
export const DEPARTMENT_CODES: Record<string, { name: string; shortName: string }> = {
  '05': { name: 'Computer Science and Engineering', shortName: 'CSE' },
  '69': { name: 'Computer Science and Engineering (IoT)', shortName: 'CSO' },
  '04': { name: 'Electronics and Communication Engineering', shortName: 'ECE' },
  '66': { name: 'Artificial Intelligence and Machine Learning', shortName: 'CSM' },
  '62': { name: 'Computer Science and Engineering (Cyber Security)', shortName: 'CSC' },
  '67': { name: 'Computer Science and Engineering (Data Science)', shortName: 'CSD' },
}

// Department groups
export const CSE_GROUP_CODES = ['05', '69', '04'] // CSE, CSO, ECE
export const CSM_GROUP_CODES = ['66', '62', '67', '04'] // CSM, CSC, CSD, ECE

export type DepartmentGroup = 'CSE' | 'CSM' | null

// Extract department code from roll number (characters at position 7 and 8, i.e., index 6 and 7)
export const extractDeptCode = (rollNumber: string): string | null => {
  if (!rollNumber || rollNumber.length < 8) return null
  return rollNumber.substring(6, 8)
}

// Get department info from roll number
export const getDepartmentInfo = (rollNumber: string): { code: string; name: string; shortName: string } | null => {
  const code = extractDeptCode(rollNumber)
  if (!code || !DEPARTMENT_CODES[code]) return null
  return { code, ...DEPARTMENT_CODES[code] }
}

// Determine which department group a student belongs to based on roll number
// Returns 'BOTH' for ECE (04) since they can be in either group
export const getDepartmentGroup = (rollNumber: string): DepartmentGroup | 'BOTH' => {
  const code = extractDeptCode(rollNumber)
  if (!code) return null
  
  // ECE (04) is in both groups - let them choose
  if (code === '04') {
    return 'BOTH'
  }
  
  // Check CSE group (CSE, CSO)
  if (CSE_GROUP_CODES.includes(code)) {
    return 'CSE'
  }
  
  // Check CSM group (CSM, CSC, CSD)
  if (CSM_GROUP_CODES.includes(code)) {
    return 'CSM'
  }
  
  return null
}

// Check if a student is eligible for a specific department group
export const isEligibleForGroup = (rollNumber: string, group: DepartmentGroup): boolean => {
  if (!group) return false
  const code = extractDeptCode(rollNumber)
  if (!code) return false
  
  if (group === 'CSE') {
    return CSE_GROUP_CODES.includes(code)
  }
  if (group === 'CSM') {
    return CSM_GROUP_CODES.includes(code)
  }
  return false
}

// Get all eligible department codes for a group
export const getEligibleCodesForGroup = (group: DepartmentGroup): string[] => {
  if (group === 'CSE') return CSE_GROUP_CODES
  if (group === 'CSM') return CSM_GROUP_CODES
  return []
}

// Database types (will be auto-generated from Supabase CLI)
// Database types (Manually defined based on user schema)
export type Database = {
  public: {
    Tables: {
      student_data: {
        Row: {
          hall_ticket: string
          name: string
          year: string
          phone: string
          role: 'student' | 'admin'
          player_role: string | null
          created_at: string
        }
        Insert: {
          hall_ticket: string
          name: string
          year: string
          phone: string
          role?: 'student' | 'admin'
          player_role?: string | null
          created_at?: string
        }
        Update: {
          hall_ticket?: string
          name?: string
          year?: string
          phone?: string
          role?: 'student' | 'admin'
          player_role?: string | null
          created_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          sport: string
          name: string
          captain_id: string
          approved: boolean
          registration_fee?: number
          status?: string
          payment_status?: string
        }
        Insert: {
          id?: string
          sport: string
          name: string
          captain_id: string
          approved?: boolean
          registration_fee?: number
          status?: string
          payment_status?: string
        }
        Update: {
          id?: string
          sport?: string
          name?: string
          captain_id?: string
          approved?: boolean
          registration_fee?: number
          status?: string
          payment_status?: string
        }
      }
      team_players: {
        Row: {
          id: string
          team_id: string
          hall_ticket: string
          student_id: string
          player_role: string | null
          is_captain: boolean
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          hall_ticket: string
          student_id: string
          player_role?: string | null
          is_captain?: boolean
          created_at?: string
        }
        Update: {
          team_id?: string
          hall_ticket?: string
          student_id?: string
          player_role?: string | null
          is_captain?: boolean
          created_at?: string
        }
      }
      payments: {
        Row: {
          team_id: string
          amount: number
          utr: string
          screenshot_url: string
          verified: boolean
        }
        Insert: {
          team_id: string
          amount: number
          utr: string
          screenshot_url: string
          verified?: boolean
        }
        Update: {
          team_id?: string
          amount?: number
          utr?: string
          screenshot_url?: string
          verified?: boolean
        }
      }
    }
  }
}
