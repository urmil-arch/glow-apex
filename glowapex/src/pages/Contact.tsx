import { useRef, useState } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, MapPin, Globe, CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react'

/* ─── Form schema ──────────────────────────────────────────────── */
const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email({ message: 'Enter a valid email address' }),
  company: z.string().max(80).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
})

type FormData = z.infer<typeof schema>

/* ─── Shared motion ────────────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }

function SectionReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'} className={className}>
      {children}
    </motion.div>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" strokeWidth={0} />
    </svg>
  )
}
function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  )
}
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

/* ─── Hero ─────────────────────────────────────────────────────── */
function ContactHero() {
  return (
    <section className="relative pt-36 pb-16 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-blue-500/[0.06] rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-5"
        >
          Get In Touch
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-none mb-6"
        >
          Let's Talk<br />
          <span className="gradient-text">Growth.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="max-w-xl text-lg text-zinc-400 leading-relaxed"
        >
          Questions, partnerships, custom requirements, or business inquiries — we'd love to hear from you.
        </motion.p>
      </div>
    </section>
  )
}

/* ─── Contact Body ─────────────────────────────────────────────── */
function ContactBody() {
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (_data: FormData) => {
    setSubmitState('loading')
    await new Promise((r) => setTimeout(r, 1600))
    setSubmitState('success')
    reset()
  }

  const inputBase =
    'w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] transition-all'

  return (
    <section className="py-16 md:py-24 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/[0.04] rounded-full blur-[160px] translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] bg-blue-500/[0.03] rounded-full blur-[120px]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.6fr] gap-12 lg:gap-16">

          {/* Info card */}
          <SectionReveal>
            <motion.div variants={fadeUp} className="glass rounded-2xl p-7 h-fit space-y-7">
              <div>
                <h3 className="text-white font-bold text-lg mb-5">Contact Information</h3>
                <div className="space-y-4">
                  <a
                    href="mailto:hello@glowapex.com"
                    className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 group-hover:bg-emerald-500/15 transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600 mb-0.5">Email</p>
                      <span className="text-sm font-medium">hello@glowapex.com</span>
                    </div>
                  </a>

                  <a
                    href="https://glowapex.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0 group-hover:border-white/[0.15] transition-colors">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600 mb-0.5">Website</p>
                      <span className="text-sm font-medium">glowapex.com</span>
                    </div>
                  </a>

                  <div className="flex items-center gap-3 text-zinc-500">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600 mb-0.5">Location</p>
                      <span className="text-sm font-medium text-zinc-400">Ahmedabad, Gujarat, India</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/[0.06]" />

              {/* Socials */}
              <div>
                <p className="text-xs text-zinc-600 font-semibold tracking-widest uppercase mb-4">Follow Us</p>
                <div className="flex items-center gap-3">
                  {[
                    { href: 'https://instagram.com', icon: <InstagramIcon />, label: 'Instagram' },
                    { href: 'https://linkedin.com', icon: <LinkedInIcon />, label: 'LinkedIn' },
                    { href: 'https://youtube.com', icon: <YouTubeIcon />, label: 'YouTube' },
                  ].map(({ href, icon, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-500 hover:text-white hover:border-white/[0.2] transition-all"
                    >
                      {icon}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </SectionReveal>

          {/* Form */}
          <SectionReveal>
            <motion.div variants={fadeUp} className="glass rounded-2xl p-7 md:p-9">
              {submitState === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center gap-5"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl mb-2">Message Sent!</h3>
                    <p className="text-zinc-500 text-sm">We'll get back to you within 24 hours.</p>
                  </div>
                  <button
                    onClick={() => setSubmitState('idle')}
                    className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <h3 className="text-white font-bold text-lg mb-6">Send a Message</h3>

                  {submitState === 'error' && (
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      Something went wrong. Please try again.
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-2 font-medium">First Name *</label>
                      <input
                        {...register('firstName')}
                        placeholder="John"
                        className={`${inputBase} ${errors.firstName ? 'border-red-500/50' : ''}`}
                      />
                      {errors.firstName && <p className="mt-1.5 text-xs text-red-400">{errors.firstName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-2 font-medium">Last Name *</label>
                      <input
                        {...register('lastName')}
                        placeholder="Doe"
                        className={`${inputBase} ${errors.lastName ? 'border-red-500/50' : ''}`}
                      />
                      {errors.lastName && <p className="mt-1.5 text-xs text-red-400">{errors.lastName.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-2 font-medium">Email *</label>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="john@company.com"
                      className={`${inputBase} ${errors.email ? 'border-red-500/50' : ''}`}
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-2 font-medium">Company <span className="text-zinc-700">(optional)</span></label>
                    <input
                      {...register('company')}
                      placeholder="Your company"
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-2 font-medium">Message *</label>
                    <textarea
                      {...register('message')}
                      rows={5}
                      placeholder="Tell us about your project or inquiry..."
                      className={`${inputBase} resize-none ${errors.message ? 'border-red-500/50' : ''}`}
                    />
                    {errors.message && <p className="mt-1.5 text-xs text-red-400">{errors.message.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={submitState === 'loading'}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-black font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 disabled:cursor-not-allowed"
                  >
                    {submitState === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </SectionReveal>
        </div>
      </div>
    </section>
  )
}

export default function Contact() {
  return (
    <main>
      <ContactHero />
      <ContactBody />
      {/* <ContactBottomCta /> */}
    </main>
  )
}
