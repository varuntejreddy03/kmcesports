'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, checkSessionTimeout, clearSessionStartTime } from '@/lib/supabase'

export function useSessionCheck() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const isExpired = checkSessionTimeout()
      if (isExpired) {
        router.push('/auth/login?expired=true')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        clearSessionStartTime()
        router.push('/auth/login')
      }
    }

    checkSession()

    const interval = setInterval(checkSession, 60000)

    return () => clearInterval(interval)
  }, [router])
}
