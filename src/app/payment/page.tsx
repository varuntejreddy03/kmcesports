'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, checkSessionTimeout, clearSessionStartTime } from '@/lib/supabase'
import Link from 'next/link'

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const teamId = searchParams.get('teamId')

  const [utr, setUtr] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    const isExpired = checkSessionTimeout()
    if (isExpired) {
      router.push('/auth/login?expired=true')
      return
    }

    fetchSettings()

    const sessionCheckInterval = setInterval(() => {
      const expired = checkSessionTimeout()
      if (expired) {
        router.push('/auth/login?expired=true')
      }
    }, 60000)

    return () => clearInterval(sessionCheckInterval)
  }, [])

  const fetchSettings = async () => {
    const { data } = await supabase.from('tournament_settings').select('*').eq('sport', 'cricket').maybeSingle()
    if (data) setSettings(data)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamId || !file || !utr) return

    setLoading(true)
    setError(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${teamId}-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('payments')
        .insert({
          team_id: teamId,
          amount: settings?.registration_fee || 2500,
          utr_number: utr,
          screenshot_url: publicUrl,
          status: 'pending'
        })

      if (dbError) throw dbError
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Payment submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (!teamId) return <div className="p-8 text-white uppercase font-black text-center">Invalid Team Link</div>

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-cricket-500/30 pb-24 md:pb-0">
      <nav className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-[#0f172a]/90">
        <div className="max-w-7xl mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            <Link href="/dashboard" className="text-slate-400 hover:text-white font-bold text-sm flex items-center gap-1.5 transition-colors min-h-[44px]">
              <span>←</span> <span className="hidden sm:inline">Dashboard</span><span className="sm:hidden">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl">🏏</span>
              <span className="font-black text-lg md:text-xl tracking-tight">KMCE<span className="text-cricket-500">Cricket</span></span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-3 md:px-4 py-6 md:py-20">
        {success ? (
          <div className="text-center animate-fadeIn">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-4xl md:text-5xl mx-auto mb-6 md:mb-8 border border-green-500/30">✓</div>
            <h1 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 tracking-tight">Proof <span className="text-green-400">Received</span></h1>
            <p className="text-slate-400 max-w-lg mx-auto mb-8 md:mb-12 text-sm md:text-lg font-medium px-4">
              We've locked in your payment proof. Our admins are verifying. Your team status will update shortly.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 md:px-10 py-4 md:py-5 bg-white text-black rounded-xl md:rounded-2xl font-black text-base md:text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl min-h-[52px]"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 items-start">
            <div className="space-y-6 md:space-y-8">
              <div>
                <div className="text-cricket-500 font-black text-[10px] md:text-xs uppercase tracking-widest mb-1 md:mb-2">Step 2: Verification</div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">Complete<br /><span className="text-cricket-500">Registration</span></h1>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[32px] p-5 md:p-8 space-y-4 md:space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-cricket-500/10 blur-3xl rounded-full"></div>
                <div>
                  <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500 mb-0.5 md:mb-1">Registration Fee</div>
                  <div className="text-3xl md:text-4xl font-black italic">₹{settings?.registration_fee || '2500'}</div>
                </div>

                <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t border-white/5">
                  <div className="bg-white/5 p-4 md:p-6 rounded-xl md:rounded-2xl text-center border border-white/5">
                    <div className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 md:mb-3">UPI Payment Address</div>
                    <div className="text-base md:text-lg font-black font-mono tracking-tight text-cricket-400 break-all">{settings?.upi_id || 'sportsportal@upi'}</div>
                  </div>
                  <p className="text-xs md:text-sm text-slate-400 font-medium italic leading-relaxed text-center">
                    "{settings?.payment_instructions || 'Upload screenshot and enter 12-digit UTR number.'}"
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-[40px] p-5 md:p-10 shadow-2xl">
              <h3 className="text-base md:text-xl font-black mb-5 md:mb-8 uppercase tracking-widest border-b border-white/5 pb-3 md:pb-4">Payment Proof</h3>

              <form onSubmit={handleUpload} className="space-y-5 md:space-y-8">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Transaction ID (UTR)</label>
                  <input
                    type="text"
                    required
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3.5 md:py-4 text-base md:text-xl font-black tracking-[0.15em] md:tracking-[0.2em] focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-800 min-h-[48px]"
                    placeholder="000000000000"
                  />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Payment Screenshot</label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-white/5 border-2 border-dashed border-white/10 group-hover:border-cricket-500/50 rounded-xl md:rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center transition-all min-h-[120px] md:min-h-[160px]">
                      <div className="text-3xl md:text-4xl mb-2 md:mb-3">{file ? '🖼️' : '📤'}</div>
                      <div className="font-bold text-xs md:text-sm text-slate-400 text-center truncate max-w-full px-2">{file ? file.name : 'Choose File or Drag & Drop'}</div>
                      <div className="text-[9px] md:text-[10px] text-slate-600 font-bold uppercase mt-1">PNG, JPG, HEIC up to 10MB</div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 md:p-4 bg-red-500/10 border border-red-500/20 rounded-xl md:rounded-2xl text-red-500 text-xs font-bold text-center">
                    {error}
                  </div>
                )}

                <button
                  disabled={loading || !file || !utr}
                  type="submit"
                  className="w-full py-5 md:py-6 bg-gradient-to-r from-cricket-600 to-indigo-600 text-white rounded-xl md:rounded-[24px] font-black text-base md:text-xl hover:scale-[1.02] shadow-xl shadow-cricket-600/30 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale min-h-[56px]"
                >
                  {loading ? 'Submitting...' : 'Verify Payment 🚀'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Loading Security Gate...</div>}>
      <PaymentContent />
    </Suspense>
  )
}
