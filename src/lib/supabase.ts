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
