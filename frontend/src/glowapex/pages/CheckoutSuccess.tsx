import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import { resolveReturnOrigin } from '../lib/returnOrigin'

const REDIRECT_MS = 4000

export default function CheckoutSuccess() {
  const d1Url = resolveReturnOrigin(window.location.search)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      window.location.href = `${d1Url}/dashboard/orders`
    }, REDIRECT_MS)

    const start = Date.now()
    const interval = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / REDIRECT_MS) * 100, 100)
      setProgress(pct)
    }, 30)

    return () => {
      clearTimeout(redirectTimer)
      clearInterval(interval)
    }
  }, [d1Url])

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[#0a0a0a] relative overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-emerald-500/[0.04] blur-[140px]" />
      </div>

      <div className="relative w-full max-w-lg text-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >

          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center"
              >
                <CheckCircle className="w-12 h-12 text-emerald-400" strokeWidth={1.75} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45, duration: 0.35 }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </motion.div>
            </div>
          </div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">
              Payment Confirmed
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.45 }}
            className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-none mb-4"
          >
            Order <span className="gradient-text">Placed!</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36, duration: 0.4 }}
            className="text-zinc-400 text-base leading-relaxed max-w-sm mx-auto mb-10"
          >
            Your order is being processed and delivery will begin shortly. Track your progress from the dashboard.
          </motion.p>

          {/* Progress card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44, duration: 0.45 }}
            className="glass rounded-2xl p-8 mb-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold text-sm">Order confirmed</p>
                <p className="text-zinc-500 text-xs mt-0.5">Delivery dispatched through our network</p>
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-zinc-500 text-xs">Redirecting to dashboard…</span>
                <span className="text-emerald-400 text-xs font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* Manual CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <a
              href={`${d1Url}/dashboard/orders`}
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors group"
            >
              Go to dashboard now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </motion.div>

        </motion.div>
      </div>
    </main>
  )
}
