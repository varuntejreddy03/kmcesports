'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const teamId = searchParams.get('teamId')
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const [utrNumber, setUtrNumber] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0])
    }
  }

  const handlePayment = async () => {
    if (!utrNumber.trim()) {
      alert('Please provide UTR number')
      return
    }

    try {
      const formData = new FormData()
      formData.append('teamId', teamId || '')
      formData.append('utrNumber', utrNumber)

      const response = await fetch('/api/payments', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        setPaymentSubmitted(true)
      } else {
        const result = await response.json()
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Payment submission error:', error)
      alert('Failed to submit payment')
    }
  }

  if (paymentSubmitted) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="content-wrapper">
            <div className="max-w-2xl mx-auto text-center">
              <Card className="p-8">
                <div className="text-6xl mb-4">✅</div>
                <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Submitted!</h1>
                <p className="text-gray-600 mb-6">
                  Your payment has been submitted successfully. Your team registration is now pending admin approval.
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  You will be notified once the admin reviews and approves your team registration.
                </p>
                <Button onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="content-wrapper">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-8">Complete Payment</h1>
            
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Registration Fee</h2>
              
              <div className="bg-cricket-50 p-6 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg">Team Registration Fee</span>
                  <span className="text-2xl font-bold text-cricket-700">₹2,500</span>
                </div>
                <p className="text-sm text-gray-600">
                  This fee covers tournament registration, match facilities, and administrative costs.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="font-bold mb-3">Payment via QR Code:</h3>
                <div className="flex justify-center mb-4">
                  <img 
                    src="/qr-code.jpeg" 
                    alt="Payment QR Code" 
                    className="w-48 h-48 border rounded-lg"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center mb-6">
                  Scan the QR code above to make payment of ₹2,500
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <Input
                  label="UTR Number"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="Enter UTR/Transaction ID"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Payment Screenshot
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cricket-500"
                    required
                  />
                  {screenshot && (
                    <p className="text-sm text-green-600 mt-1">
                      File selected: {screenshot.name}
                    </p>
                  )}
                </div>
              </div>

              <Button 
                onClick={handlePayment}
                className="w-full"
                size="lg"
                disabled={!utrNumber.trim()}
              >
                Submit Payment Confirmation
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}