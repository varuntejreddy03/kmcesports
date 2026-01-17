export type UserRole = 'student' | 'admin'

export interface StudentData {
  hall_ticket: string
  name: string
  year: string
  phone: string
  role: UserRole
  player_role?: string
  created_at: string
}

export interface Team {
  id: string
  sport: string
  name: string
  captain_id: string
  approved: boolean
  registration_fee?: number
  created_at?: string
}

export interface TeamPlayer {
  id?: string
  team_id: string
  hall_ticket: string
  player_role?: string
  is_captain?: boolean
  created_at?: string
}

export interface Payment {
  id?: string
  team_id: string
  amount: number
  utr_number: string
  screenshot_url: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
}

// Helper type for joining data in UI
export interface TeamWithDetails extends Team {
  captain?: StudentData
  players?: StudentData[]
  payment?: Payment
  playerCount?: number
}
