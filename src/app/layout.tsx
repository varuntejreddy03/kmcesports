import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KMCE Premier League | Cricket Championship 2026',
  description: 'The ultimate stage for cricketers at KMCE. Join the Inter-Departmental Cricket Tournament 2026. Register your squad, track live matches, and compete for the prestigious KPL Trophy.',
  keywords: ['KMCE', 'Cricket', 'Tournament', 'Sports', 'KPL 2026', 'KMCE Premier League', 'Engineering Sports Championship', 'Cricket Registration'],
  authors: [{ name: 'KMCE Sports Committee' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  openGraph: {
    title: 'KMCE Premier League 2026',
    description: 'Build your squad and compete in the biggest cricket event of KMCE.',
    url: 'https://kmcecricket.varuntej.online', // Replace with actual URL if known
    siteName: 'KMCE Cricket Registration',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KMCE Premier League 2026',
    description: 'Join the inter-departmental cricket championship today!',
  },
  themeColor: '#0f172a',
  appleWebApp: {
    title: 'KPL 2026',
    statusBarStyle: 'black-translucent',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}