import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Loader } from 'lucide-react'

export default function CheckoutSuccess() {
  const d1Url = (import.meta.env.VITE_D1_URL || 'http://localhost:5173').replace(/\/$/, '')

  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = `${d1Url}/dashboard/orders`
    }, 2000)
    return () => clearTimeout(timer)
  }, [d1Url])

  return (
    <main className="pt-36 pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mb-12"
        >
          <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-4">
            Payment Status
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-none">
            Order <span className="gradient-text">Confirmed.</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          className="max-w-md"
        >
          <div className="glass rounded-2xl p-10 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl mb-2">Payment Confirmed</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Your order is being processed. Redirecting you to your dashboard…
              </p>
            </div>
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <Loader className="w-4 h-4 animate-spin text-emerald-400" />
              Redirecting…
            </div>
          </div>
        </motion.div>

      </div>
    </main>
  )
}
