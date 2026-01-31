'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
      <div className="text-white text-center">
        <p className="text-lg font-bold">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}
