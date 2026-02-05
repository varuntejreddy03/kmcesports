'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, checkSessionTimeout, clearSessionStartTime, updateLastActivity, refreshSupabaseSession } from '@/lib/supabase'

export function useSessionCheck() {
  const router = useRouter()

  const handleActivity = useCallback(() => {
    updateLastActivity()
  }, [])

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

  useEffect(() => {
    const events = ['click', 'keydown', 'scroll', 'touchstart', 'mousemove']
    
    let activityTimeout: NodeJS.Timeout | null = null
    
    const throttledActivity = () => {
      if (activityTimeout) return
      handleActivity()
      activityTimeout = setTimeout(() => {
        activityTimeout = null
      }, 5000)
    }

    events.forEach(event => {
      window.addEventListener(event, throttledActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledActivity)
      })
      if (activityTimeout) clearTimeout(activityTimeout)
    }
  }, [handleActivity])

  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const expiresAt = session.expires_at
        if (expiresAt) {
          const expiresIn = expiresAt * 1000 - Date.now()
          if (expiresIn < 5 * 60 * 1000) {
            await refreshSupabaseSession()
          }
        }
      }
    }, 60000)

    return () => clearInterval(refreshInterval)
  }, [])
}
