'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase, isKMCEStudent } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function StudentRegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    hallTicket: '',
    name: '',
    year: '4th',
    phone: '',
    playerRole: 'all-rounder'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hallTicketError, setHallTicketError] = useState<string | null>(null)

  // Pre-fill hall ticket from URL parameter on mount
  useEffect(() => {
    const hallTicketFromUrl = searchParams.get('hallTicket')
    if (hallTicketFromUrl) {
      const upperValue = hallTicketFromUrl.toUpperCase().slice(0, 10)
      setFormData(prev => ({ ...prev, hallTicket: upperValue }))

      // Validate the pre-filled hall ticket
      if (upperValue.length === 10) {
        if (!isKMCEStudent(upperValue)) {
          setHallTicketError('Invalid Hall Ticket. Only KMCE students (P81/P85) are allowed.')
        }
      }
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === 'hallTicket') {
      const upperValue = value.toUpperCase().slice(0, 10)
      setFormData(prev => ({ ...prev, hallTicket: upperValue }))

      // Instant validation for hall ticket
      if (upperValue.length === 10) {
        if (!isKMCEStudent(upperValue)) {
          setHallTicketError('Invalid Hall Ticket. Only KMCE students (P81/P85) are allowed.')
        } else {
          setHallTicketError(null)
        }
      } else if (upperValue.length > 0 && upperValue.length < 10) {
        setHallTicketError(null) // Clear error while typing
      } else {
        setHallTicketError(null)
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.hallTicket || !formData.name || !formData.phone) {
        throw new Error('Please fill in all required fields')
      }

      // Validate hall ticket format
      if (formData.hallTicket.length !== 10) {
        throw new Error('Hall Ticket must be exactly 10 characters')
      }

      // Validate KMCE college code
      if (!isKMCEStudent(formData.hallTicket)) {
        throw new Error('Invalid Hall Ticket. Only KMCE students (P81/P85) are allowed.')
      }

      if (formData.phone.length < 10) {
        throw new Error('Please enter a valid 10-digit phone number')
      }

      const { data: existing } = await supabase
        .from('student_data')
        .select('hall_ticket')
        .eq('hall_ticket', formData.hallTicket)
        .maybeSingle()

      if (existing) {
        throw new Error('This Hall Ticket is already registered. Please use the login page.')
      }

      const { error: insertError } = await supabase
        .from('student_data')
        .insert({
          hall_ticket: formData.hallTicket,
          name: formData.name,
          year: formData.year,
          phone: formData.phone,
          player_role: formData.playerRole,
          role: 'student'
        })

      if (insertError) {
        console.error('Insert error:', insertError)
        throw new Error('Failed to register. Please try again.')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col md:flex-row overflow-hidden">
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-cricket-600 to-indigo-700 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/20 blur-[100px] rounded-full -ml-48 -mb-48"></div>

        <div className="relative z-10 text-center max-w-md">
          <div className="text-8xl mb-8">🏏</div>
          <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-tight mb-6">
            Cricket<br /><span className="text-white/50">Tournament</span>
          </h2>
          <p className="text-lg font-medium text-white/70 leading-relaxed">
            Not in our database? No problem! Register here and join the cricket championship.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Quick Registration
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-cricket-400 rounded-full animate-pulse"></span>
              Instant Access
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-8">
          <Link href="/" className="font-black text-xl tracking-tight text-white/50 hover:text-white transition-colors">
            KMCE<span className="text-white">Cricket</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 md:p-12 bg-[#0f172a]">
        <div className="max-w-md w-full">
          <div className="md:hidden text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 group mb-3 min-h-[44px]">
              <div className="w-10 h-10 bg-gradient-to-br from-cricket-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-xl">🏏</span>
              </div>
              <span className="font-black text-xl tracking-tight">
                KMCE<span className="text-cricket-500">Cricket</span>
              </span>
            </Link>
          </div>

          <div className="mb-6 md:mb-8">
            <div className="inline-block px-3 md:px-4 py-1 md:py-1.5 bg-cricket-600/20 border border-cricket-600/30 rounded-full text-cricket-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] mb-3 md:mb-4">
              New Player
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-1.5 md:mb-2 uppercase">
              Player Registration
            </h1>
            <p className="text-slate-400 font-medium text-xs md:text-sm">
              Register to join the cricket championship
            </p>
          </div>

          {success ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-[32px] p-8 md:p-10 text-center">
              <div className="text-5xl md:text-6xl mb-4 md:mb-6">🎉</div>
              <h2 className="text-xl md:text-2xl font-black uppercase mb-2 md:mb-3 text-white">Registration Successful!</h2>
              <p className="text-slate-400 mb-4 md:mb-6 text-sm">Redirecting you to login...</p>
              <div className="w-16 md:w-20 h-1 bg-gradient-to-r from-cricket-500 to-indigo-500 mx-auto rounded-full"></div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-[32px] p-5 md:p-8 shadow-2xl">
              {error && (
                <div className="mb-5 md:mb-6 p-3 md:p-4 bg-red-500/10 border border-red-500/20 rounded-xl md:rounded-2xl text-red-400 text-xs md:text-sm font-bold text-center flex items-center justify-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Hall Ticket ID</label>
                  <input
                    type="text"
                    name="hallTicket"
                    required
                    autoFocus
                    maxLength={10}
                    value={formData.hallTicket}
                    onChange={handleChange}
                    className={`w-full bg-white/5 border rounded-lg md:rounded-xl px-4 md:px-5 py-3 md:py-3.5 text-base md:text-lg font-bold tracking-wide focus:ring-2 focus:ring-cricket-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600 min-h-[48px] ${hallTicketError ? 'border-red-500' : 'border-white/10'}`}
                    placeholder="23P81AXXXX"
                  />
                  {hallTicketError && (
                    <div className="text-red-400 text-[10px] md:text-xs font-bold mt-1">{hallTicketError}</div>
                  )}
                  {!hallTicketError && formData.hallTicket.length === 10 && isKMCEStudent(formData.hallTicket) && (
                    <div className="text-green-400 text-[10px] md:text-xs font-bold mt-1 flex items-center gap-1">
                      <span>✓</span> Valid KMCE Hall Ticket
                    </div>
                  )}
                  <div className="text-[9px] md:text-[10px] text-slate-600 font-medium">Example: 23P81A6234</div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg md:rounded-xl px-4 md:px-5 py-3 md:py-3.5 font-bold focus:ring-2 focus:ring-cricket-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600 min-h-[48px]"
                    placeholder="Your full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Year</label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-lg md:rounded-xl px-3 md:px-5 py-3 md:py-3.5 font-bold focus:ring-2 focus:ring-cricket-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer min-h-[48px]"
                    >
                      <option value="4th" className="bg-slate-900">4th Year</option>
                      <option value="3rd" className="bg-slate-900">3rd Year</option>
                      <option value="2nd" className="bg-slate-900">2nd Year</option>
                      <option value="1st" className="bg-slate-900">1st Year</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-lg md:rounded-xl px-4 md:px-5 py-3 md:py-3.5 font-bold focus:ring-2 focus:ring-cricket-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600 min-h-[48px]"
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Playing Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'batsman', label: 'Batsman', icon: '🏏' },
                      { id: 'bowler', label: 'Bowler', icon: '🎯' },
                      { id: 'all-rounder', label: 'All-Rounder', icon: '⭐' },
                      { id: 'wicket-keeper', label: 'Keeper', icon: '🧤' }
                    ].map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, playerRole: role.id }))}
                        className={`py-2.5 md:py-3 px-2 md:px-3 rounded-lg md:rounded-xl text-[9px] md:text-xs font-black uppercase tracking-wide border transition-all flex items-center justify-center gap-1 md:gap-2 min-h-[44px] ${formData.playerRole === role.id
                          ? 'bg-gradient-to-r from-cricket-600 to-indigo-600 border-cricket-400 text-white shadow-lg shadow-cricket-600/30'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <span>{role.icon}</span>
                        <span className="truncate">{role.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 md:py-5 bg-gradient-to-r from-cricket-600 to-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:scale-[1.02] shadow-xl shadow-cricket-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2 min-h-[52px]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Registering...
                    </span>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </form>

              <div className="mt-5 md:mt-6 pt-5 md:pt-6 border-t border-white/10 text-center">
                <p className="text-slate-500 text-xs md:text-sm">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-cricket-400 hover:text-white font-bold transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          )}

          <div className="mt-5 md:mt-6 text-center">
            <Link href="/" className="text-slate-600 text-xs font-bold hover:text-slate-400 transition-colors min-h-[44px] inline-flex items-center">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StudentRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <StudentRegisterContent />
    </Suspense>
  )
}
