// Hook to fetch tournament settings
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface TournamentSettings {
  id: string
  tournament_name: string
  sport: string
  ground_name: string
  registration_fee: number
  max_teams: number
  registration_open: boolean
  rules_text: string
  last_updated: string
}

export function useTournamentSettings(sport: string = 'cricket') {
  const [settings, setSettings] = useState<TournamentSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [sport])

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('tournament_settings')
        .select('*')
        .eq('sport', sport)
        .maybeSingle()

      setSettings(data)
    } catch (error) {
      console.error('Error fetching tournament settings:', error)
    } finally {
      setLoading(false)
    }
  }

  return { settings, loading, refetch: fetchSettings }
}
