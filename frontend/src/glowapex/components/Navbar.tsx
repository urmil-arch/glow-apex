import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap } from 'lucide-react'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#0A0A0A]/90 backdrop-blur-2xl border-b border-white/[0.06] shadow-xl shadow-black/40'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-[72px]">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
                <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">
                Glow <span className="text-emerald-400">Apex</span>
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                 const active = location.pathname === link.href
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="relative px-4 py-2 text-sm font-medium transition-colors group"
                  >
                    <span className={active ? 'text-white' : 'text-zinc-400 group-hover:text-white transition-colors'}>
                      {link.label}
                    </span>
                    {active && (
                      <motion.div
                        layoutId="ga-nav-pill"
                        className="absolute inset-0 bg-white/[0.06] rounded-lg"
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 40 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-[#0D0D0D] border-l border-white/[0.07] p-6 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <Link to="/" className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-emerald-500 rounded-md flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
                  </div>
                  <span className="text-white font-bold text-base tracking-tight">
                    Glow <span className="text-emerald-400">Apex</span>
                  </span>
                </Link>
                <button onClick={() => setMobileOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                {navLinks.map((link) => {
                   const active = location.pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-white/[0.07] text-white'
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
