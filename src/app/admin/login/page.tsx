'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (username.toUpperCase() !== 'ADMIN') {
        setError('Unauthorized access token required.')
        setLoading(false)
        return
      }

      const { data: adminData } = await supabase
        .from('student_data')
        .select('*')
        .eq('hall_ticket', 'ADMIN')
        .single()

      if (!adminData) {
        setError('Governance record not found.')
        setLoading(false)
        return
      }

      const email = `admin@sports.local`

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                hall_ticket: 'ADMIN',
                name: 'System Admin',
                role: 'admin'
              }
            }
          })
          if (signUpError) throw signUpError
          await supabase.auth.signInWithPassword({ email, password })
        } else {
          throw signInError
        }
      }

      window.location.href = '/admin'
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cricket-600/10 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 rounded-[28px] flex items-center justify-center text-4xl mx-auto mb-8 shadow-2xl rotate-3">⚖️</div>
          <h1 className="text-4xl font-black tracking-tight mb-2 uppercase italic leading-none">Command Center</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Governance & Management</p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Authority User</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-black tracking-[0.1em] focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-800"
                placeholder="ADMIN"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Access Key</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              disabled={loading}
              className="w-full py-6 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-[24px] font-black text-xl hover:scale-[1.02] shadow-xl shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-30"
            >
              {loading ? 'Authenticating...' : 'Enter Dashboard ⚡'}
            </button>
          </form>
        </div>

        <div className="mt-12 text-center flex flex-col gap-4">
          <Link href="/auth/login" className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">← Standard Athlete Access</Link>
          <p className="text-slate-700 text-[10px] font-bold uppercase tracking-widest">KMCESportsPortol Advanced Sports Governance v4.0</p>
        </div>
      </div>
    </div>
  )
}
