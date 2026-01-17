'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

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
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cricket-600/10 blur-[120px] rounded-full -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full -ml-48 -mb-48"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-cricket-500 to-indigo-600 rounded-[28px] flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl shadow-cricket-600/20">🔑</div>
          <h1 className="text-4xl font-black tracking-tight mb-2 uppercase italic leading-none">Security <span className="text-cricket-500">Update</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Refresh your access key</p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-8">
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">New Secret Sequence</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-black focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-800"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Verify Sequence</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-black focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-800"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-gradient-to-r from-cricket-600 to-indigo-600 text-white rounded-[24px] font-black text-xl hover:scale-[1.02] shadow-xl shadow-cricket-600/20 transition-all active:scale-95 disabled:opacity-30"
            >
              {loading ? 'Securing...' : 'Update Password 🚀'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">Skip for now</Link>
        </div>
      </div>
    </div>
  )
}
