'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, isKMCEStudent } from '@/lib/supabase'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [hallTicket, setHallTicket] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRedirect = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validate hall ticket format (10 characters)
    if (hallTicket.length !== 10) {
      setError('Hall Ticket must be exactly 10 characters')
      return
    }
    
    // Validate KMCE college code (P81 or P85 at positions 3-5)
    if (!isKMCEStudent(hallTicket)) {
      setError('Invalid Hall Ticket. Only KMCE students (P81/P85) are allowed.')
      return
    }
    
    // In our new flow, registration is handled within the Login page via Hall Ticket lookup.
    // We redirect the user to the Login page with their hall ticket pre-filled.
    router.push(`/auth/login?ht=${hallTicket.toUpperCase()}`)
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col md:flex-row shadow-2xl overflow-hidden">
      {/* Visual Left Side */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-600 to-cricket-900 relative items-center justify-center p-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/20 blur-[100px] rounded-full -ml-48 -mb-48"></div>

        <div className="relative z-10 text-center">
          <div className="text-8xl mb-8">🎖️</div>
          <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-none mb-6">Begin Your<br /><span className="text-white/40">Journey</span></h2>
          <p className="text-xl font-medium text-white/70 max-w-sm mx-auto">Registration is integrated. Just verify your Hall Ticket and we'll setup your athlete profile instantly.</p>
        </div>

        <div className="absolute bottom-10 left-10">
          <Link href="/" className="font-black text-xl tracking-tight text-white/50 hover:text-white transition-colors">KMCE<span className="text-white">Cricket</span></Link>
        </div>
      </div>

      {/* Register Right Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0f172a]">
        <div className="max-w-md w-full">
          <div className="mb-6">
            <Link href="/" className="text-slate-400 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors w-fit">
              <span>←</span> Back to Home
            </Link>
          </div>
          <div className="mb-12">
            <div className="inline-block px-4 py-1.5 bg-cricket-600/20 border border-cricket-600/30 rounded-full text-cricket-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Official Enrollment</div>
            <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Create Profile</h1>
            <p className="text-slate-500 font-medium">Enter your Hall Ticket to start your registration as a team captain.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <form onSubmit={handleRedirect} className="space-y-8">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold text-center">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Hall Ticket ID</label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={10}
                  value={hallTicket}
                  onChange={(e) => setHallTicket(e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-black tracking-[0.05em] focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-800"
                  placeholder="23P81AXXXX"
                />
                <div className="text-[10px] text-slate-600 font-medium">Example: 23P81A6234 or 24P85A0511</div>
              </div>

              <button
                type="submit"
                className="w-full py-6 bg-gradient-to-r from-cricket-600 to-indigo-600 text-white rounded-[24px] font-black text-xl hover:scale-[1.02] shadow-xl shadow-cricket-600/30 transition-all active:scale-95"
              >
                Proceed to Identity 🚀
              </button>
            </form>
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
              Already verified? <Link href="/auth/login" className="text-cricket-400 hover:text-white transition-colors">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
