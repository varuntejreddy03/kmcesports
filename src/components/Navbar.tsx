'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, loading } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${scrolled ? 'bg-[#0f172a]/80 backdrop-blur-xl border-white/10 py-3' : 'bg-transparent border-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-cricket-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-cricket-500/20 group-hover:scale-110 transition-transform">
              <span className="text-xl">🏏</span>
            </div>
            <span className="font-black text-xl tracking-tighter uppercase italic text-white">KMCE<span className="text-cricket-500">SportsPortol</span></span>
          </Link>

          <div className="hidden md:flex items-center space-x-1 bg-white/5 border border-white/10 p-1 rounded-2xl backdrop-blur-md">
            {user ? (
              <>
                <NavLink href="/dashboard" active={pathname === '/dashboard'}>Dashboard</NavLink>
                <NavLink href="/team/create" active={pathname === '/team/create'}>Create Team</NavLink>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-white/5 rounded-xl transition-all"
                >
                  Logout
                </button>
              </>
            ) : null}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden items-center transition-all duration-500 overflow-hidden ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pt-4 pb-6 space-y-2 bg-[#0f172a]/95 backdrop-blur-2xl border-b border-white/10">
          {user ? (
            <>
              <MobileNavLink href="/dashboard">Dashboard</MobileNavLink>
              <MobileNavLink href="/team/create">Create Team</MobileNavLink>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-red-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 rounded-xl transition-all"
              >
                Logout
              </button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, active, children }: { href: string, active: boolean, children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white/10 text-white shadow-inner' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link href={href} className="block px-4 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-white hover:bg-white/5 rounded-xl transition-all">
      {children}
    </Link>
  )
}