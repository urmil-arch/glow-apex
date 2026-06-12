import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, CheckCircle, Clock, Loader, Mail, Package } from 'lucide-react'
import api from '../lib/api'

function SuccessInfoPanel({ d1Url }: { d1Url: string }) {
  const steps = [
    {
      icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
      title: 'Confirmation Sent',
      desc: 'A receipt has been sent to your email address.',
    },
    {
      icon: <Package className="w-4 h-4 text-emerald-400" />,
      title: 'Order Dispatched',
      desc: 'Our delivery network has picked up your order and started processing.',
    },
    {
      icon: <Clock className="w-4 h-4 text-emerald-400" />,
      title: 'Delivery in Progress',
      desc: 'Results will arrive within the estimated timeframe shown in your dashboard.',
    },
  ]

  return (
    <div className="glass rounded-2xl p-7 space-y-7 h-fit">
      <div>
        <h3 className="text-white font-bold text-base mb-5">What's next?</h3>
        <div className="space-y-5">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                {step.icon}
              </div>
              <div>
                <p className="text-white text-sm font-semibold mb-0.5">{step.title}</p>
                <p className="text-zinc-500 text-xs leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.06]" />

      <div>
        <p className="text-xs text-zinc-600 font-semibold tracking-widest uppercase mb-3">Track Your Order</p>
        <a
          href={`${d1Url}/dashboard/orders`}
          className="flex items-center gap-2.5 text-zinc-400 hover:text-emerald-400 transition-colors group w-fit text-sm font-medium"
        >
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          Go to Dashboard
        </a>
      </div>

      <div className="border-t border-white/[0.06]" />

      <div>
        <p className="text-xs text-zinc-600 font-semibold tracking-widest uppercase mb-3">Support</p>
        <a
          href="mailto:hello@glowapex.com"
          className="flex items-center gap-2.5 text-zinc-400 hover:text-white transition-colors group w-fit"
        >
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center group-hover:border-white/[0.15] transition-colors flex-shrink-0">
            <Mail className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-600 mb-0.5">Questions? Email us</p>
            <span className="text-sm font-medium">hello@glowapex.com</span>
          </div>
        </a>
      </div>
    </div>
  )
}

export default function CheckoutSuccess() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id') ?? ''
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>(
    sessionId ? 'loading' : 'failed'
  )

  const d1Url = (import.meta.env.VITE_D1_URL || 'http://localhost:5173').replace(/\/$/, '')

  useEffect(() => {
    if (!sessionId) return
    api.get(`/payments/stripe/verify?sessionId=${sessionId}`)
      .then((res) => {
        const s = res.data?.payment_status ?? res.data?.status ?? ''
        setStatus(s === 'paid' || s === 'complete' || s === 'succeeded' ? 'success' : 'failed')
      })
      .catch(() => setStatus('failed'))
  }, [sessionId])

  const heroHeading = status === 'loading'
    ? 'Confirming…'
    : status === 'success'
    ? <span>Order<br /><span className="gradient-text">Confirmed.</span></span>
    : <span>Payment<br /><span className="text-red-400">Incomplete.</span></span>

  return (
    <main className="pt-36 pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Hero */}
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
            {heroHeading}
          </h1>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-8 items-start">

          {/* Left — info panel (only on success) */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          >
            {status === 'success' && <SuccessInfoPanel d1Url={d1Url} />}

            {status === 'failed' && (
              <div className="glass rounded-2xl p-7 space-y-4">
                <h3 className="text-white font-bold text-base">What to do next</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  If you were charged but the order isn't showing, contact our support team with your Stripe session ID and we'll resolve it immediately.
                </p>
                <a
                  href="mailto:hello@glowapex.com"
                  className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium w-fit"
                >
                  <Mail className="w-4 h-4" /> hello@glowapex.com
                </a>
              </div>
            )}

            {status === 'loading' && (
              <div className="glass rounded-2xl p-7 flex items-center justify-center min-h-[200px]">
                <Loader className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
            )}
          </motion.div>

          {/* Right — status card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
          >
            <div className="glass rounded-2xl p-10">
              {status === 'loading' && (
                <div className="flex flex-col items-center gap-5 text-center">
                  <Loader className="w-10 h-10 text-emerald-400 animate-spin" />
                  <p className="text-zinc-400 text-sm">Confirming your payment with Stripe…</p>
                </div>
              )}

              {status === 'success' && (
                <div className="flex flex-col items-center gap-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-xl mb-2">Payment Confirmed</h2>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      Your order is being processed. You'll see it in your dashboard shortly.
                    </p>
                  </div>
                  <a
                    href={`${d1Url}/dashboard/orders`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20"
                  >
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}

              {status === 'failed' && (
                <div className="flex flex-col items-center gap-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-xl mb-2">Payment Incomplete</h2>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      We couldn't confirm your payment. If you were charged, please contact support.
                    </p>
                  </div>
                  <a
                    href={d1Url}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold rounded-xl transition-colors"
                  >
                    Back to Store
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
