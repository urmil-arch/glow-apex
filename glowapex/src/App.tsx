import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import Contact from './pages/Contact'

const pageVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-[#0A0A0A] relative">
        {/* Global ambient background — persists across all pages */}
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.032]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          {/* Top-right ambient */}
          <div className="absolute -top-32 -right-32 w-[900px] h-[700px] bg-blue-500/[0.045] rounded-full blur-[200px]" />
          {/* Bottom-left ambient */}
          <div className="absolute -bottom-32 -left-32 w-[700px] h-[600px] bg-blue-500/[0.03] rounded-full blur-[180px]" />
          {/* Center pulse — adds depth mid-page */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[400px] bg-blue-500/[0.02] rounded-full blur-[200px]" />
        </div>
        <Navbar />
        <AnimatedRoutes />
        <Footer />
      </div>
    </BrowserRouter>
  )
}
