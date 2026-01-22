'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StudentRegisterPage() {
  const router = useRouter()
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hallTicket' ? value.toUpperCase() : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.hallTicket || !formData.name || !formData.phone) {
        throw new Error('Please fill in all required fields')
      }

      if (formData.phone.length < 10) {
        throw new Error('Please enter a valid phone number')
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
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cricket-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse shadow-2xl"></div>
        <div className="absolute inset-0 opacity-[0.03] space-pattern"></div>
      </div>

      <div className="max-w-xl w-full relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-cricket-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-cricket-500/20 group-hover:scale-110 transition-transform duration-500">
              <span className="text-3xl">🏏</span>
            </div>
            <span className="font-black text-3xl tracking-tighter uppercase italic text-white leading-none">
              KMCE<span className="text-cricket-500">Sports</span>
            </span>
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">New Student <span className="text-cricket-500">Registration</span></h1>
            <p className="text-slate-500 text-sm font-bold">4th Year students can register here to join the tournament</p>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[48px] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>

          <div className="relative z-10">
            {success ? (
              <div className="text-center py-8 animate-fadeIn">
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="text-2xl font-black uppercase mb-4">Registration Successful!</h2>
                <p className="text-slate-400 mb-6">Redirecting you to login...</p>
                <div className="w-16 h-1 bg-cricket-500 mx-auto rounded-full animate-pulse"></div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-[24px] text-red-400 text-sm font-black text-center flex items-center justify-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Hall Ticket ID *</label>
                    <input
                      type="text"
                      name="hallTicket"
                      required
                      autoFocus
                      value={formData.hallTicket}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-black tracking-[0.05em] focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-700"
                      placeholder="21XXXXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-700"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Year</label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-cricket-500 outline-none transition-all"
                      >
                        <option value="1st" className="bg-slate-900">1st Year</option>
                        <option value="2nd" className="bg-slate-900">2nd Year</option>
                        <option value="3rd" className="bg-slate-900">3rd Year</option>
                        <option value="4th" className="bg-slate-900">4th Year</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-700"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Playing Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['batsman', 'bowler', 'all-rounder', 'wicket-keeper'].map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, playerRole: role }))}
                          className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.playerRole === role ? 'bg-cricket-600 border-cricket-400 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                        >
                          {role.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 bg-gradient-to-r from-cricket-600 to-indigo-600 text-white rounded-[24px] font-black text-xl hover:scale-[1.02] shadow-xl shadow-cricket-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Registering...' : 'Register as Student 🎓'}
                  </button>
                </form>
              </>
            )}
          </div>

          {!success && (
            <div className="mt-8 text-center">
              <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
                Already registered? <Link href="/auth/login" className="text-cricket-400 hover:text-white transition-colors">Sign in here</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
