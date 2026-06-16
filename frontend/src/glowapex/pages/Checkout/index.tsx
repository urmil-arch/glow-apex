import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle, ArrowRight, CheckCircle, CreditCard, ListOrdered,
  Loader, Lock, Mail, ShieldCheck, TrendingUp, Zap,
} from 'lucide-react'
import api from '../../lib/api'
import { resolveReturnOriginValue, storeNameFromOrigin } from '../../lib/returnOrigin'

declare const Razorpay: new (options: Record<string, unknown>) => { open(): void }

interface SessionData {
  payment_method: string
  order_id: string
  service_name: string
  category_name: string
  quantity: number
  charge: number
  currency: string
  link: string
  description: string
  return_origin?: string
  // Stripe
  checkout_url?: string
  // Razorpay
  razorpay_order_id?: string
  key_id?: string
  amount_paise?: number
  // Cryptomus (populated after POST /checkout/create-cryptomus-invoice)
  cryptomus_invoice_id?: string
  cryptomus_payment_url?: string
}

interface VerifyRazorpayBody {
  session_token: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('rzp-script')) { resolve(true); return }
    const script = document.createElement('script')
    script.id = 'rzp-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// Slide-in toast that auto-dismisses after 4 s
function RedirectBanner({ storeName }: { storeName: string }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 80 }}
          transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          className="fixed top-20 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-[#111] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/60 max-w-xs"
        >
          <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold leading-tight">Redirected from {storeName}</p>
            <p className="text-zinc-500 text-[10px] mt-0.5">Your order details are ready</p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="ml-1 text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0 text-xs leading-none"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Left info panel shown alongside the payment card
function CheckoutInfoPanel() {
  const steps = [
    {
      icon: <CreditCard className="w-4 h-4 text-emerald-400" />,
      title: 'Payment Confirmed',
      desc: 'An order ID is generated and a confirmation is sent to your email.',
    },
    {
      icon: <ListOrdered className="w-4 h-4 text-emerald-400" />,
      title: 'Order Queued',
      desc: 'Delivery is dispatched through our network within minutes of payment.',
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
      title: 'Results Delivered',
      desc: 'Growth arrives within your service\'s estimated timeframe — no drop guarantee.',
    },
  ]

  const security = [
    { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: '256-bit SSL encryption' },
    { icon: <Lock className="w-3.5 h-3.5" />, label: 'PCI-compliant payment' },
    { icon: <Zap className="w-3.5 h-3.5" />, label: 'Instant processing' },
  ]

  return (
    <div className="glass rounded-2xl p-7 space-y-7 h-fit">
      {/* What happens next */}
      <div>
        <h3 className="text-white font-bold text-base mb-5">What happens next?</h3>
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

      {/* Security */}
      <div>
        <p className="text-xs text-zinc-600 font-semibold tracking-widest uppercase mb-3">Security</p>
        <div className="space-y-2.5">
          {security.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 text-zinc-500 text-xs">
              <span className="text-emerald-400">{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.06]" />

      {/* Support */}
      <div>
        <p className="text-xs text-zinc-600 font-semibold tracking-widest uppercase mb-3">Need Help?</p>
        <a
          href="mailto:hello@glowapex.com"
          className="flex items-center gap-2.5 text-zinc-400 hover:text-white transition-colors group w-fit"
        >
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center group-hover:border-white/[0.15] transition-colors flex-shrink-0">
            <Mail className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-600 mb-0.5">Email support</p>
            <span className="text-sm font-medium">hello@glowapex.com</span>
          </div>
        </a>
      </div>
    </div>
  )
}

function ErrorPage({ message, d1Url }: { message: string; d1Url: string }) {
  return (
    <main className="pt-36 pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-10"
          >
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-white font-bold text-xl mb-3">Link Expired</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">{message}</p>
            <a
              href={d1Url}
              className="mt-7 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-xl transition-colors"
            >
              Back to Store <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </div>
    </main>
  )
}

function SessionPage({ token, d1Url }: { token: string; d1Url: string }) {
  const [session, setSession] = useState<SessionData | null>(null)
  const [fetchError, setFetchError] = useState('')
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const paymentDone = useRef(false)

  useEffect(() => {
    api.get<SessionData>(`/checkout/session/${token}`)
      .then((res) => setSession(res.data))
      .catch(() => setFetchError('This payment link has expired or is invalid. Please return to the store and start over.'))
  }, [token])

  async function handleStripe() {
    if (!session?.checkout_url) return
    setPaying(true)
    window.location.href = session.checkout_url
  }

  async function handleRazorpay() {
    if (!session) return
    setPaying(true)
    setPayError('')

    const loaded = await loadRazorpayScript()
    if (!loaded) {
      setPayError('Failed to load payment SDK. Please check your connection and try again.')
      setPaying(false)
      return
    }

    const options: Record<string, unknown> = {
      key: session.key_id,
      amount: session.amount_paise,
      currency: 'INR',
      name: 'Glow Apex',
      description: session.description,
      order_id: session.razorpay_order_id,
      theme: { color: '#10B981' },
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        paymentDone.current = true
        try {
          const body: VerifyRazorpayBody = {
            session_token: token,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }
          await api.post('/checkout/verify/razorpay', body)
          window.location.href = '/checkout/success'
        } catch {
          setPayError('Payment received but order confirmation failed. Please contact support with your payment ID.')
          setPaying(false)
        }
      },
      modal: { ondismiss: () => { if (!paymentDone.current) setPaying(false) } },
    }

    new Razorpay(options).open()
  }

  async function handleCryptomus() {
    setPaying(true)
    setPayError('')
    try {
      const res = await api.post<{ payment_url: string }>('/checkout/create-cryptomus-invoice', {
        session_token: token,
      })
      window.location.href = res.data.payment_url
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
      const msg = typeof detail === 'string' ? detail : 'Failed to create Cryptomus invoice. Please try again.'
      setPayError(msg)
      setPaying(false)
    }
  }

  if (fetchError) return <ErrorPage message={fetchError} d1Url={d1Url} />

  if (!session) {
    return (
      <main className="pt-36 pb-24 flex items-center justify-center min-h-[60vh]">
        <Loader className="w-6 h-6 text-emerald-400 animate-spin" />
      </main>
    )
  }

  const isStripe = session.payment_method === 'stripe'
  const isCryptomus = session.payment_method === 'cryptomus'
  const label = session.category_name || session.service_name

  return (
    <>
      <RedirectBanner storeName={storeNameFromOrigin(resolveReturnOriginValue(session.return_origin))} />

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
              Secure Checkout
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-none mb-4">
              Complete Your <span className="gradient-text">Payment.</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-lg">
              Your order is locked in — confirm the details and pay securely below.
            </p>
          </motion.div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-8 items-start">

            {/* Left — info panel */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            >
              <CheckoutInfoPanel />
            </motion.div>

            {/* Right — payment card */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
            >
              <div className="glass rounded-2xl overflow-hidden">

                <div className="px-8 pt-8 pb-6 border-b border-white/[0.06]">
                  <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-1">
                    Order Summary
                  </p>
                  <h2 className="text-white font-bold text-xl">{label}</h2>
                </div>

                <div className="px-8 py-6 space-y-3 border-b border-white/[0.06]">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Quantity</span>
                    <span className="text-white font-medium">{session.quantity.toLocaleString()} units</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Payment via</span>
                    <span className="text-white font-medium capitalize">{session.payment_method}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-3 border-t border-white/[0.05]">
                    <span className="text-zinc-300 font-semibold">Total</span>
                    <span className="text-emerald-400 font-bold text-lg">
                      ${session.charge.toFixed(2)} {session.currency}
                    </span>
                  </div>
                </div>

                <div className="px-8 py-6">
                  {payError && (
                    <div className="mb-4 text-xs text-red-400 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3">
                      {payError}
                    </div>
                  )}

                  <button
                    onClick={isStripe ? handleStripe : isCryptomus ? handleCryptomus : handleRazorpay}
                    disabled={paying}
                    className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/25"
                  >
                    {paying ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        {isStripe ? 'Redirecting to Stripe…' : isCryptomus ? 'Creating invoice…' : 'Opening Razorpay…'}
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Pay ${session.charge.toFixed(2)} via {isStripe ? 'Stripe' : isCryptomus ? 'Cryptomus' : 'Razorpay'}
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-6 mt-5">
                    {[
                      { icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />, label: 'Encrypted' },
                      { icon: <Lock className="w-3.5 h-3.5 text-emerald-400" />, label: 'Secure' },
                      { icon: <Zap className="w-3.5 h-3.5 text-emerald-400" />, label: 'Instant' },
                    ].map(({ icon, label }) => (
                      <div key={label} className="flex items-center gap-1.5 text-zinc-600 text-xs">
                        {icon}{label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  )
}

export default function Checkout() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const d1Url = (import.meta.env.VITE_D1_URL || 'http://localhost:5173').replace(/\/$/, '')

  if (!token) {
    return (
      <ErrorPage
        message="Missing payment token. Please return to the store and try again."
        d1Url={d1Url}
      />
    )
  }

  return <SessionPage token={token} d1Url={d1Url} />
}
