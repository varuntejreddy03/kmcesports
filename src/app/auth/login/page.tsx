'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { StudentData } from '@/types'
import Link from 'next/link'

export default function LoginPage() {
  const [hallTicket, setHallTicket] = useState('')
  const [playerRole, setPlayerRole] = useState('all-rounder')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'hall_ticket' | 'verify_details' | 'password'>('hall_ticket')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [student, setStudent] = useState<StudentData | null>(null)

  const router = useRouter()

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
        setError('Hall Ticket not found in our athletic records.')
        return
      }

      setStudent(data)
      setPhoneNumber(data.phone || '')

      if (data.hall_ticket === 'ADMIN') {
        setStep('password')
        return
      }

      const { data: existingTeam } = await supabase
        .from('team_players')
        .select('team_id')
        .eq('hall_ticket', data.hall_ticket)
        .maybeSingle()

      if (existingTeam) {
        setPlayerRole(data.player_role || 'all-rounder')
        setStep('password')
      } else {
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

      if (student.hall_ticket === 'ADMIN') router.push('/admin')
      else router.push('/dashboard')
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Incorrect Password' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col md:flex-row shadow-2xl overflow-hidden">
      {/* Visual Left Side */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-cricket-600 to-indigo-900 relative items-center justify-center p-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/20 blur-[100px] rounded-full -ml-48 -mb-48"></div>

        <div className="relative z-10 text-center">
          <div className="text-8xl mb-8 animate-bounce">🏏</div>
          <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-none mb-6">Enter the<br /><span className="text-white/40">Arena</span></h2>
          <p className="text-xl font-medium text-white/70 max-w-sm mx-auto">The path to glory starts with a single step. Verify your credentials and take the field.</p>
        </div>

        <div className="absolute bottom-10 left-10">
          <Link href="/" className="font-black text-xl tracking-tighter uppercase italic text-white/50 hover:text-white transition-colors">KMCE<span className="text-white">SportsPortol</span></Link>
        </div>
      </div>

      {/* Login Right Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0f172a]">
        <div className="max-w-md w-full">
          <div className="mb-12">
            <div className="inline-block px-4 py-1.5 bg-cricket-600/20 border border-cricket-600/30 rounded-full text-cricket-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Secure Authentication</div>
            <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">
              {step === 'password' ? 'Locked & Loaded' : 'Welcome Back'}
            </h1>
            <p className="text-slate-500 font-medium">
              {step === 'password' ? `Ready to login as ${student?.name}` : 'Login with your credentials to continue your journey.'}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center animate-shake">
                {error}
              </div>
            )}

            {step === 'hall_ticket' && (
              <form onSubmit={handleLookup} className="space-y-8">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Hall Ticket ID</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={hallTicket}
                    onChange={(e) => setHallTicket(e.target.value.toUpperCase())}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-black tracking-[0.05em] focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-800"
                    placeholder="21XXXXXX"
                  />
                </div>
                <button
                  disabled={loading || !hallTicket}
                  className="w-full py-6 bg-gradient-to-r from-cricket-600 to-indigo-600 text-white rounded-[24px] font-black text-xl hover:scale-[1.02] shadow-xl shadow-cricket-600/30 transition-all active:scale-95 disabled:opacity-30"
                >
                  {loading ? 'Scanning Records...' : 'Verify Access 🚀'}
                </button>
              </form>
            )}

            {step === 'verify_details' && student && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center group">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Athlete</span>
                    <span className="font-black text-lg uppercase italic group-hover:text-cricket-400 transition-colors">{student.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Academic Year</span>
                    <span className="font-black text-white/60">{student.year} Year</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Mobile Link</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-cricket-500 outline-none transition-all"
                    placeholder="Enter mobile number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">On-Field Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['batsman', 'bowler', 'all-rounder', 'wicket-keeper'].map((role) => (
                      <button
                        key={role}
                        onClick={() => setPlayerRole(role)}
                        className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${playerRole === role ? 'bg-cricket-600 border-cricket-400 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                      >
                        {role.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleConfirmDetails}
                  disabled={loading}
                  className="w-full py-6 bg-white text-black rounded-[24px] font-black text-xl hover:scale-[1.02] shadow-xl transition-all active:scale-95 disabled:opacity-30"
                >
                  Finish Setup 🏁
                </button>
              </div>
            )}

            {step === 'password' && (
              <form onSubmit={handleLogin} className="space-y-8 animate-fade-in">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Secret Sequence</label>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-black focus:ring-2 focus:ring-cricket-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <p className="text-[10px] text-slate-600 font-bold text-center">Default: Kmce123$</p>
                </div>
                <button
                  disabled={loading}
                  className="w-full py-6 bg-gradient-to-r from-cricket-600 to-indigo-600 text-white rounded-[24px] font-black text-xl hover:scale-[1.02] shadow-xl shadow-cricket-600/30 transition-all active:scale-95"
                >
                  {loading ? 'Unlocking...' : 'Launch Dashboard 🚀'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('hall_ticket')}
                  className="w-full py-2 text-slate-600 hover:text-slate-400 text-xs font-black uppercase tracking-widest transition-colors"
                >
                  ← Incorrect User?
                </button>
              </form>
            )}
          </div>

          {step === 'hall_ticket' && (
            <div className="mt-12 text-center">
              <Link href="/admin/login" className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-cricket-400 transition-colors">Admin Governance Access</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}