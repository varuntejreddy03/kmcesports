'use client'

import { useState, useEffect } from 'react'
import { supabase, setSessionStartTime } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Deadline editing state
  const [isEditingDeadline, setIsEditingDeadline] = useState(false)
  const [deadlineDate, setDeadlineDate] = useState('2026-01-27')
  const [deadlineTime, setDeadlineTime] = useState('12:30')
  const [savingDeadline, setSavingDeadline] = useState(false)

  // Format deadline for display
  const formatDeadlineDisplay = () => {
    const date = new Date(`${deadlineDate}T${deadlineTime}:00`)
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    const dateStr = date.toLocaleDateString('en-US', options)
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const hour12 = hours % 12 || 12
    return `${dateStr}, ${hour12}:${minutes} ${ampm}`
  }

  // Load deadline from database
  useEffect(() => {
    const loadDeadline = async () => {
      const { data } = await supabase
        .from('tournament_settings')
        .select('registration_deadline')
        .eq('sport', 'cricket')
        .maybeSingle()
      
      if (data?.registration_deadline) {
        const deadline = new Date(data.registration_deadline)
        setDeadlineDate(deadline.toISOString().split('T')[0])
        setDeadlineTime(deadline.toTimeString().slice(0, 5))
      }
    }
    loadDeadline()
  }, [])

  // Save deadline to database
  const saveDeadline = async () => {
    setSavingDeadline(true)
    try {
      const deadlineISO = new Date(`${deadlineDate}T${deadlineTime}:00`).toISOString()
      
      // Check if record exists
      const { data: existing } = await supabase
        .from('tournament_settings')
        .select('id')
        .eq('sport', 'cricket')
        .maybeSingle()
      
      if (existing) {
        await supabase
          .from('tournament_settings')
          .update({ registration_deadline: deadlineISO })
          .eq('sport', 'cricket')
      } else {
        await supabase
          .from('tournament_settings')
          .insert({ sport: 'cricket', registration_deadline: deadlineISO })
      }
      
      setIsEditingDeadline(false)
    } catch (err) {
      console.error('Error saving deadline:', err)
    } finally {
      setSavingDeadline(false)
    }
  }

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

      setSessionStartTime()
      window.location.href = '/admin'
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Governance Themed Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] bg-slate-800/20 blur-[150px] rounded-full shadow-2xl"></div>
      </div>

      <div className="max-w-xl w-full relative z-10 transition-all duration-700">
        <div className="mb-6">
          <Link href="/" className="text-slate-400 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors w-fit">
            <span>←</span> Back to Home
          </Link>
        </div>
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-3xl flex items-center justify-center shadow-2xl border border-white/5">
              <span className="text-4xl italic font-black text-white/20">⚖️</span>
            </div>
            <div className="text-left">
              <div className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] mb-1">Administrative Node</div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Command Center</h1>
            </div>
          </Link>
          <div className="flex justify-center gap-6 text-xs font-black uppercase tracking-[0.2em] text-slate-500 italic mb-10">
            <span className="flex items-center gap-2 underline decoration-indigo-500 underline-offset-4">Tournament Registry</span>
            <span className="flex items-center gap-2">Operations Center</span>
          </div>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[56px] p-8 md:p-14 shadow-[0_48px_100px_-24px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          {/* Subtle Inner Glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          <div className="relative z-10">
            <div className="mb-12 text-center">
              <p className="text-slate-400 font-medium text-lg leading-relaxed">
                Admin Login – Manage tournament settings, match schedules, and team approvals.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-10">
              {error && (
                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-[28px] text-red-400 text-sm font-black text-center animate-shake flex items-center justify-center gap-3">
                  <span>⚓</span> {error}
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Identity Code</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-[28px] px-8 py-5 text-xl font-black tracking-[0.2em] focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:text-slate-800 focus:bg-white/[0.05]"
                  placeholder="ADMIN"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Access Sequence</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-[28px] px-8 py-5 text-xl font-black focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:text-slate-800 focus:bg-white/[0.05]"
                  placeholder="••••••••"
                />
              </div>

              <button
                disabled={loading}
                className="group relative w-full py-6 bg-white text-black rounded-[32px] font-black text-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="relative z-10 group-hover:text-white transition-colors duration-500">
                  {loading ? 'Validating...' : 'Unlock Systems ⚡'}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Registration Deadline */}
        <div className="mt-10 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[32px] p-6 text-center">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Registration Deadline</div>
          {isEditingDeadline ? (
            <div className="space-y-3">
              <div className="flex gap-2 justify-center">
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm font-bold focus:ring-2 focus:ring-cricket-500 outline-none"
                />
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm font-bold focus:ring-2 focus:ring-cricket-500 outline-none"
                />
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={saveDeadline}
                  disabled={savingDeadline}
                  className="bg-cricket-500 hover:bg-cricket-600 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors"
                >
                  {savingDeadline ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditingDeadline(false)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setIsEditingDeadline(true)}
              className="text-2xl md:text-3xl font-black text-white cursor-pointer hover:text-cricket-400 transition-colors"
              title="Click to edit"
            >
              {formatDeadlineDisplay()}
            </div>
          )}
        </div>

        {/* Cricket Coordinators Contact */}
        <div className="mt-6 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[32px] p-6">
          <div className="text-center mb-4">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Cricket Coordinators</div>
            <div className="text-[9px] text-slate-600 mt-1">3rd Year Students - For Enquiries</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
              <div className="text-sm font-black text-white uppercase tracking-tight">Suresh</div>
              <a href="tel:6303860267" className="text-cricket-500 font-mono text-sm font-bold hover:text-cricket-400 transition-colors">6303860267</a>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
              <div className="text-sm font-black text-white uppercase tracking-tight">Sreeker</div>
              <a href="tel:9063128733" className="text-cricket-500 font-mono text-sm font-bold hover:text-cricket-400 transition-colors">9063128733</a>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-cricket-500 transition-all hover:gap-4">
            <span>←</span> Back to Athlete Portal
          </Link>
          <div className="mt-8 text-[9px] font-black text-slate-800 uppercase tracking-[0.5em]">Cricket Administration System</div>
        </div>
      </div>
    </div>
  )
}
