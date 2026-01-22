'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, checkSessionTimeout, clearSessionStartTime } from '@/lib/supabase'
import Link from 'next/link'

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const teamId = searchParams.get('teamId')
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const [utrNumber, setUtrNumber] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
  }, [router])

  const fetchSettings = async () => {
    const { data } = await supabase.from('tournament_settings').select('*').eq('sport', 'cricket').maybeSingle()
    if (data) setSettings(data)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0])
    }
  }

  const handlePayment = async () => {
    if (!utrNumber.trim()) {
      setError('Please provide UTR number')
      return
    }
    if (!screenshot) {
      setError('Please upload payment screenshot')
      return
    }
    if (!teamId) {
      setError('Invalid team ID')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const fileExt = screenshot.name.split('.').pop()
      const fileName = `${teamId}-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, screenshot)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('payments')
        .insert({
          team_id: teamId,
          amount: settings?.registration_fee || 2500,
          utr_number: utrNumber,
          screenshot_url: publicUrl,
          status: 'pending'
        })

      if (dbError) throw dbError
      setPaymentSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Payment submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (!teamId) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Invalid Team Link</h1>
          <Link href="/dashboard" className="text-cricket-400 hover:text-white transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (paymentSubmitted) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-white">
        <nav className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-[#0a0f1a]/80">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-slate-400 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors">
                <span>←</span> Dashboard
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏏</span>
                <span className="font-black text-xl tracking-tight">KMCE<span className="text-cricket-500">Cricket</span></span>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 border border-green-500/30">✓</div>
            <h1 className="text-5xl font-black mb-6 tracking-tight">Payment <span className="text-green-400">Submitted</span></h1>
            <p className="text-slate-400 max-w-lg mx-auto mb-12 text-lg font-medium">
              Your payment proof has been received. Our admins will verify the transaction and update your team status.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-10 py-5 bg-white text-black rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl"
            >
              Return to Dashboard
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white selection:bg-cricket-500/30 pb-20">
      <nav className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-[#0a0f1a]/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-slate-400 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors">
              <span>←</span> Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏏</span>
              <span className="font-black text-xl tracking-tight">KMCE<span className="text-cricket-500">Cricket</span></span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div>
              <div className="text-cricket-500 font-black text-xs uppercase tracking-widest mb-2">Step 2: Payment</div>
              <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Complete<br /><span className="text-cricket-500">Registration</span></h1>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cricket-500/10 blur-3xl rounded-full"></div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Registration Fee</div>
                <div className="text-4xl font-black italic">₹{settings?.registration_fee || '2500'}</div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="bg-white/5 p-6 rounded-2xl text-center border border-white/5">
                  <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">UPI Payment Address</div>
                  <div className="text-lg font-black font-mono tracking-tight text-cricket-400">{settings?.upi_id || 'sportsportal@upi'}</div>
                </div>
                <p className="text-sm text-slate-400 font-medium italic leading-relaxed text-center">
                  "{settings?.payment_instructions || 'Please upload the screenshot of your successful transaction and enter the 12-digit UTR number.'}"
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl">
            <h3 className="text-xl font-black mb-8 uppercase tracking-widest border-b border-white/5 pb-4">Payment Proof</h3>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">12-Digit Transaction ID (UTR)</label>
                <input
                  type="text"
                  required
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-black tracking-[0.2em] focus:ring-2 focus:ring-cricket-500 outline-none transition-all placeholder:text-slate-800"
                  placeholder="000000000000"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Payment Screenshot</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full bg-white/5 border-2 border-dashed border-white/10 group-hover:border-cricket-500/50 rounded-2xl p-8 flex flex-col items-center justify-center transition-all">
                    <div className="text-4xl mb-3">{screenshot ? '🖼️' : '📤'}</div>
                    <div className="font-bold text-sm text-slate-400">{screenshot ? screenshot.name : 'Choose File or Drag & Drop'}</div>
                    <div className="text-[10px] text-slate-600 font-bold uppercase mt-1">PNG, JPG, HEIC up to 10MB</div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center">
                  {error}
                </div>
              )}

              <button
                disabled={loading || !screenshot || !utrNumber}
                onClick={handlePayment}
                className="w-full py-6 bg-gradient-to-r from-cricket-600 to-indigo-600 text-white rounded-[24px] font-black text-xl hover:scale-[1.02] shadow-xl shadow-cricket-600/30 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
              >
                {loading ? 'Submitting Proof...' : 'Submit Payment Proof'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center text-white">Loading...</div>}>
      <PaymentContent />
    </Suspense>
  )
}
