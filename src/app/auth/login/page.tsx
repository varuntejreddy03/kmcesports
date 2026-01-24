'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase, setSessionStartTime, isKMCEStudent } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { StudentData } from '@/types'
import Link from 'next/link'

function LoginContent() {
  const searchParams = useSearchParams()
  const [hallTicket, setHallTicket] = useState('')
  const [playerRole, setPlayerRole] = useState('all-rounder')
  const [sessionExpired, setSessionExpired] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'hall_ticket' | 'verify_details' | 'password'>('hall_ticket')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [student, setStudent] = useState<StudentData | null>(null)

  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setSessionExpired(true)
    }
  }, [searchParams])

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('student_data')
        .select('*')
        .eq('hall_ticket', hallTicket.toUpperCase())
        .single()

      if (error || !data) {
        setError('Hall Ticket not found. New students can register using the link below.')
        return
      }

      setStudent(data)
      setPhoneNumber(data.phone || '')

      if (data.hall_ticket === 'ADMIN') {
        setStep('password')
        return
      }

      // Check if user has logged in before (login_count > 0 means returning user)
      const hasLoggedInBefore = (data.login_count || 0) > 0

      if (hasLoggedInBefore) {
        // Returning user - go directly to password with empty field
        setPlayerRole(data.player_role || 'all-rounder')
        setPassword('')
        setStep('password')
      } else if (data.player_role) {
        // First login but has role set - go to password with default
        setPlayerRole(data.player_role)
        setPassword('Kmce123$')
        setStep('password')
      } else {
        // First login, no role - show role selection with default password
        setPassword('Kmce123$')
        setStep('verify_details')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDetails = async () => {
    if (!student) return
    setLoading(true)
    setError(null)
    try {
      const { error: updateError } = await supabase
        .from('student_data')
        .update({ phone: phoneNumber, player_role: playerRole })
        .eq('hall_ticket', student.hall_ticket)

      if (updateError) throw new Error('Failed to lock in your profile.')
      setStep('password')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) return
    setLoading(true)
    setError(null)

    try {
      const email = `${student.hall_ticket.toLowerCase()}@kmce.local`
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials') && password === 'Kmce123$') {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                hall_ticket: student.hall_ticket,
                name: student.name,
                phone: phoneNumber,
                player_role: playerRole
              }
            }
          })
          if (signUpError) throw signUpError
          if (signUpData.user) { router.push('/auth/change-password'); return }
        }
        throw signInError
      }

      // Store login info in database (silently handle if columns don't exist)
      try {
        await supabase.from('student_data').update({
          last_login: new Date().toISOString(),
          login_count: (student.login_count || 0) + 1
        }).eq('hall_ticket', student.hall_ticket)
      } catch (e) {
        console.log('Login tracking skipped:', e)
      }

      setSessionStartTime()
      
      // Only force password change on FIRST login with default password
      const isFirstLogin = (student.login_count || 0) === 0
      if (isFirstLogin && password === 'Kmce123$' && !student.password_changed && student.hall_ticket !== 'ADMIN') {
        router.push('/auth/change-password')
        return
      }

      if (student.hall_ticket === 'ADMIN') router.push('/admin')
      else router.push('/dashboard')
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Incorrect Password' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-3 md:p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cricket-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse shadow-2xl"></div>
        <div className="absolute inset-0 opacity-[0.03] space-pattern"></div>
      </div>

      <div className="max-w-xl w-full relative z-10 transition-all duration-700 ease-out translate-y-0 opacity-100">
        <div className="mb-4 md:mb-6">
          <Link href="/" className="text-slate-400 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors w-fit min-h-[44px]">
            <span>←</span> Back to Home
          </Link>
        </div>
        <div className="text-center mb-6 md:mb-10">
          <Link href="/" className="inline-flex items-center gap-2 md:gap-3 group mb-4 md:mb-6">
            <div className="w-11 h-11 md:w-14 md:h-14 bg-gradient-to-br from-cricket-500 to-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl shadow-cricket-500/20 group-hover:scale-110 transition-transform duration-500">
              <span className="text-2xl md:text-3xl">🏏</span>
            </div>
            <span className="font-black text-2xl md:text-3xl tracking-tight text-white leading-none">
              KMCE<span className="text-cricket-500">Cricket</span>
            </span>
          </Link>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-5xl font-black tracking-tighter uppercase italic">Championship <span className="text-cricket-500">Portal</span></h1>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 text-[10px] md:text-xs font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-slate-500 italic">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cricket-500"></span> Captain Login</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Player Dashboard</span>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl md:rounded-[48px] p-5 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>

          <div className="relative z-10">
            {step === 'hall_ticket' && (
              <div className="mb-6 md:mb-10 text-center animate-fadeIn">
                <p className="text-slate-400 font-medium text-sm md:text-lg leading-relaxed">
                  Captain & Player Login — Manage your team and track tournament progress.
                </p>
              </div>
            )}

            {sessionExpired && (
              <div className="mb-6 md:mb-8 p-4 md:p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl md:rounded-[24px] text-yellow-400 text-xs md:text-sm font-black text-center flex items-center justify-center gap-2">
                <span>⏰</span> Session expired. Please login again.
              </div>
            )}

            {error && (
              <div className="mb-6 md:mb-8 p-4 md:p-5 bg-red-500/10 border border-red-500/20 rounded-xl md:rounded-[24px] text-red-400 text-xs md:text-sm font-black text-center animate-shake flex items-center justify-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {step === 'hall_ticket' && (
              <form onSubmit={handleLookup} className="space-y-5 md:space-y-8">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Hall Ticket ID</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={hallTicket}
                    onChange={(e) => setHallTicket(e.target.value.toUpperCase())}
                    className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-lg md:text-xl font-black tracking-[0.05em] focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-800 min-h-[48px]"
                    placeholder="21XXXXXX"
                  />
                </div>
                <button
                  disabled={loading || !hallTicket}
                  className="w-full py-4 md:py-6 bg-gradient-to-r from-cricket-600 to-indigo-600 text-white rounded-xl md:rounded-[24px] font-black text-base md:text-xl hover:scale-[1.02] shadow-xl shadow-cricket-600/30 transition-all active:scale-95 disabled:opacity-30 min-h-[52px]"
                >
                  {loading ? 'Scanning...' : 'Verify Access 🚀'}
                </button>
              </form>
            )}

            {step === 'verify_details' && student && (
              <div className="space-y-5 md:space-y-8 animate-fade-in">
                <div className="bg-white/5 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 space-y-3 md:space-y-4">
                  <div className="flex justify-between items-center group">
                    <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Athlete</span>
                    <span className="font-black text-sm md:text-lg uppercase italic group-hover:text-cricket-400 transition-colors truncate ml-2">{student.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Year</span>
                    <span className="font-black text-white/60">{student.year} Year</span>
                  </div>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Mobile</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-5 md:px-6 py-3.5 md:py-4 font-bold focus:ring-2 focus:ring-cricket-500 outline-none transition-all min-h-[48px]"
                    placeholder="Enter mobile number"
                  />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">On-Field Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['batsman', 'bowler', 'all-rounder', 'wicket-keeper'].map((role) => (
                      <button
                        key={role}
                        onClick={() => setPlayerRole(role)}
                        className={`py-3 px-3 md:px-4 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border transition-all min-h-[44px] ${playerRole === role ? 'bg-cricket-600 border-cricket-400 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                      >
                        {role.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleConfirmDetails}
                  disabled={loading}
                  className="w-full py-4 md:py-6 bg-white text-black rounded-xl md:rounded-[24px] font-black text-base md:text-xl hover:scale-[1.02] shadow-xl transition-all active:scale-95 disabled:opacity-30 min-h-[52px]"
                >
                  Finish Setup 🏁
                </button>
              </div>
            )}

            {step === 'password' && (
              <form onSubmit={handleLogin} className="space-y-5 md:space-y-8 animate-fade-in">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Password</label>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-lg md:text-xl font-black focus:ring-2 focus:ring-cricket-500 outline-none transition-all min-h-[48px]"
                    placeholder="••••••••"
                  />
                  {(student?.login_count || 0) === 0 && (
                    <p className="text-[9px] md:text-[10px] text-slate-600 font-bold text-center">Default: Kmce123$</p>
                  )}
                </div>
                <button
                  disabled={loading}
                  className="w-full py-4 md:py-6 bg-gradient-to-r from-cricket-600 to-indigo-600 text-white rounded-xl md:rounded-[24px] font-black text-base md:text-xl hover:scale-[1.02] shadow-xl shadow-cricket-600/30 transition-all active:scale-95 min-h-[52px]"
                >
                  {loading ? 'Unlocking...' : 'Launch Dashboard 🚀'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('hall_ticket')}
                  className="w-full py-2 text-slate-600 hover:text-slate-400 text-xs font-black uppercase tracking-widest transition-colors min-h-[44px]"
                >
                  ← Wrong User?
                </button>
              </form>
            )}
          </div>

          {step === 'hall_ticket' && (
            <div className="mt-8 md:mt-12 text-center space-y-3 md:space-y-4">
              <p className="text-slate-500 text-xs font-bold">
                New student? <Link href="/auth/student-register" className="text-cricket-400 hover:text-white transition-colors">Register here</Link>
              </p>
              <div className="h-px w-20 bg-white/10 mx-auto"></div>
              <Link href="/admin/login" className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-cricket-400 transition-colors block min-h-[44px] flex items-center justify-center">Admin Governance Access</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
