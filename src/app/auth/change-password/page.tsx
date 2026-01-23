'use client'

import { useState, useEffect } from 'react'
import { supabase, setSessionStartTime } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hallTicket, setHallTicket] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setHallTicket(user.user_metadata?.hall_ticket || null)
      }
    }
    getUser()
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (authError) throw authError

      // Update password_changed flag in database (silently handle if columns don't exist)
      if (hallTicket) {
        try {
          await supabase.from('student_data').update({
            password_changed: true,
            password_changed_at: new Date().toISOString()
          }).eq('hall_ticket', hallTicket)
        } catch (e) {
          console.log('Password tracking skipped:', e)
        }
      }

      setSessionStartTime()
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-cricket-600/10 blur-[100px] md:blur-[120px] rounded-full -mr-24 md:-mr-48 -mt-24 md:-mt-48"></div>
      <div className="absolute bottom-0 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-600/10 blur-[100px] md:blur-[120px] rounded-full -ml-24 md:-ml-48 -mb-24 md:-mb-48"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="mb-4 md:mb-6">
          <Link href="/dashboard" className="text-slate-400 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors w-fit min-h-[44px]">
            <span>←</span> Back to Dashboard
          </Link>
        </div>
        <div className="text-center mb-6 md:mb-10">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-cricket-500 to-indigo-600 rounded-2xl md:rounded-[28px] flex items-center justify-center text-3xl md:text-4xl mx-auto mb-4 md:mb-6 shadow-2xl shadow-cricket-600/20">🔑</div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-1.5 md:mb-2 uppercase italic leading-none">Security <span className="text-cricket-500">Update</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] text-[9px] md:text-[10px]">Refresh your access key</p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-[40px] p-5 md:p-10 shadow-2xl">
          {error && (
            <div className="mb-5 md:mb-6 p-3 md:p-4 bg-red-500/10 border border-red-500/20 rounded-xl md:rounded-2xl text-red-500 text-xs font-bold text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-5 md:space-y-8">
            <div className="space-y-1.5 md:space-y-2">
              <label className="block text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-lg md:text-xl font-black focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-800 min-h-[48px]"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <label className="block text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Confirm Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-lg md:text-xl font-black focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-800 min-h-[48px]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 md:py-6 bg-gradient-to-r from-cricket-600 to-indigo-600 text-white rounded-xl md:rounded-[24px] font-black text-base md:text-xl hover:scale-[1.02] shadow-xl shadow-cricket-600/20 transition-all active:scale-95 disabled:opacity-30 min-h-[52px]"
            >
              {loading ? 'Securing...' : 'Update Password 🚀'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
