import { motion } from 'framer-motion'
import { ArrowRight, Mail, ShieldCheck, Zap } from 'lucide-react'

function CancelInfoPanel({ d1Url }: { d1Url: string }) {
  const reasons = [
    { icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, text: 'No charge was made to your card' },
    { icon: <Zap className="w-4 h-4 text-emerald-400" />, text: 'Your order details are still saved' },
    { icon: <ArrowRight className="w-4 h-4 text-emerald-400" />, text: 'You can retry anytime from the store' },
  ]

  return (
    <div className="glass rounded-2xl p-7 space-y-7 h-fit">
      <div>
        <h3 className="text-white font-bold text-base mb-5">Good to know</h3>
        <div className="space-y-4">
          {reasons.map(({ icon, text }, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <p className="text-zinc-400 text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.06]" />

      <div>
        <p className="text-xs text-zinc-600 font-semibold tracking-widest uppercase mb-3">Try Again</p>
        <a
          href={d1Url}
          className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium group w-fit"
        >
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          Back to BuyRealViews Store
        </a>
      </div>

      <div className="border-t border-white/[0.06]" />

      <div>
        <p className="text-xs text-zinc-600 font-semibold tracking-widest uppercase mb-3">Had a Problem?</p>
        <a
          href="mailto:hello@glowapex.com"
          className="flex items-center gap-2.5 text-zinc-400 hover:text-white transition-colors group w-fit"
        >
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center group-hover:border-white/[0.15] transition-colors flex-shrink-0">
            <Mail className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-600 mb-0.5">We're here to help</p>
            <span className="text-sm font-medium">hello@glowapex.com</span>
          </div>
        </a>
      </div>
    </div>
  )
}

export default function CheckoutCancel() {
  const d1Url = (import.meta.env.VITE_D1_URL || 'http://localhost:5173').replace(/\/$/, '')

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
            Payment Cancelled
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-none">
            No Worries,<br />
            <span className="gradient-text">Come Back Anytime.</span>
          </h1>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-8 items-start">

          {/* Left — info panel */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          >
            <CancelInfoPanel d1Url={d1Url} />
          </motion.div>

          {/* Right — cancel card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
          >
            <div className="glass rounded-2xl p-10 flex flex-col items-start gap-6">
              <div className="w-14 h-14 rounded-full bg-zinc-800 border border-white/[0.08] flex items-center justify-center text-zinc-400 text-xl font-bold">
                ✕
              </div>
              <div>
                <h2 className="text-white font-bold text-xl mb-2">Payment Cancelled</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  No charge was made. You can return to the store and complete your order whenever you're ready.
                </p>
              </div>
              <a
                href={d1Url}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20"
              >
                Back to Store <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
