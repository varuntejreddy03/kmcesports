'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function PaymentPage() {
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
    fetchSettings()
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
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-cricket-500/30">
      <nav className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-[#0f172a]/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-slate-400 font-bold flex items-center gap-2"><span>←</span> Cancel</Link>
          <div className="font-black text-xl tracking-tighter uppercase italic">Secure<span className="text-cricket-500">Checkout</span></div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {success ? (
          <div className="text-center animate-fadeIn">
            <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 border border-green-500/30">✓</div>
            <h1 className="text-5xl font-black mb-6 tracking-tight">Proof <span className="text-green-400">Received</span></h1>
            <p className="text-slate-400 max-w-lg mx-auto mb-12 text-lg font-medium">
              We've locked in your payment proof. Our admins are currently verifying the transaction. Your team status will update shortly.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-10 py-5 bg-white text-black rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div>
                <div className="text-cricket-500 font-black text-xs uppercase tracking-widest mb-2">Step 2: Verification</div>
                <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Complete<br /><span className="text-cricket-500">Registration</span></h1>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6 relative overflow-hidden group">
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

              <form onSubmit={handleUpload} className="space-y-8">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">12-Digit Transaction ID (UTR)</label>
                  <input
                    type="text"
                    required
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
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
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-white/5 border-2 border-dashed border-white/10 group-hover:border-cricket-500/50 rounded-2xl p-8 flex flex-col items-center justify-center transition-all">
                      <div className="text-4xl mb-3">{file ? '🖼️' : '📤'}</div>
                      <div className="font-bold text-sm text-slate-400">{file ? file.name : 'Choose File or Drag & Drop'}</div>
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
                  disabled={loading || !file || !utr}
                  type="submit"
                  className="w-full py-6 bg-gradient-to-r from-cricket-600 to-indigo-600 text-white rounded-[24px] font-black text-xl hover:scale-[1.02] shadow-xl shadow-cricket-600/30 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                >
                  {loading ? 'Submitting Proof...' : 'Verify Payment 🚀'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
