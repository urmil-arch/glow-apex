import { useRef } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Target, Lightbulb, Eye, Shield, ArrowRight } from 'lucide-react'
import AnimatedCounter from '../components/AnimatedCounter'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11 } },
}

function SectionReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'} className={className}>
      {children}
    </motion.div>
  )
}

function AboutHero() {
  return (
    <section className="relative min-h-[60vh] flex items-end pb-20 pt-36 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-blue-500/[0.06] rounded-full blur-[120px]" />
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
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-5"
        >
          About Glow Apex
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-none mb-6"
        >
          We Shape Narratives<br />
          <span className="gradient-text">That Matter.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="max-w-2xl text-lg md:text-xl text-zinc-400 leading-relaxed"
        >
          Glow Apex is a full-service PR and communications agency helping brands build credibility, protect their reputation, and earn coverage that drives real business growth.
        </motion.p>
      </div>
    </section>
  )
}

function NumbersSection() {
  const stats = [
    { value: 500, suffix: '+', label: 'Campaigns Delivered' },
    { value: 200, suffix: '+', label: 'Clients Served' },
    { value: 10, suffix: 'K+', label: 'Media Placements' },
    { value: 50, suffix: '+', label: 'Countries Reached' },
  ]

  return (
    <section className="py-20 md:py-28 border-y border-white/[0.05] relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-blue-500/[0.04] rounded-full blur-[120px]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <SectionReveal className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.05]">
          {stats.map(({ value, suffix, label }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              className="bg-[#0A0A0A] py-10 px-6 text-center group hover:bg-white/[0.02] transition-colors"
            >
              <div className="text-4xl lg:text-5xl font-black text-white mb-2 tabular-nums">
                <AnimatedCounter target={value} suffix={suffix} duration={2200} />
              </div>
              <p className="text-zinc-500 text-sm">{label}</p>
            </motion.div>
          ))}
        </SectionReveal>
      </div>
    </section>
  )
}

function WhoWeAreSection() {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -right-40 top-1/3 w-[500px] h-[500px] bg-blue-500/[0.05] rounded-full blur-[140px]" />
        <div className="absolute left-0 bottom-0 w-[250px] h-[250px] bg-blue-500/[0.03] rounded-full blur-[100px]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
          <SectionReveal>
            <motion.p variants={fadeUp} className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-5">Who We Are</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-6">
              We're Passionate<br />About PR.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-400 text-base md:text-lg leading-relaxed">
              At Glow Apex, we live and breathe public relations. Through years of experience across media relations, brand strategy, and crisis communications, we've helped businesses of all sizes build the kind of reputation that earns trust, attention, and lasting loyalty.
            </motion.p>
          </SectionReveal>

          <SectionReveal>
            <motion.div variants={fadeUp} className="relative">
              <div className="glass rounded-2xl p-8 space-y-4">
                {[
                  { label: 'Media Coverage Rate', pct: 94 },
                  { label: 'Client Retention', pct: 91 },
                  { label: 'Campaign Success Rate', pct: 88 },
                  { label: 'Stakeholder Satisfaction', pct: 96 },
                ].map(({ label, pct }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-zinc-300 font-medium">{label}</span>
                      <span className="text-zinc-500">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                      />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-zinc-600 pt-2">Average metrics across active client engagements</p>
              </div>
            </motion.div>
          </SectionReveal>
        </div>
      </div>
    </section>
  )
}

function MissionSection() {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/[0.12] to-transparent pointer-events-none" />
      <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <SectionReveal>
          <motion.p variants={fadeUp} className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-6">Our Mission</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-8">
            Helping Ambitious Brands<br />Own Their Story.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Our mission is to give every brand — regardless of size — access to strategic, honest, and effective PR that builds lasting credibility and moves the conversation in the right direction.
          </motion.p>
        </SectionReveal>
      </div>
    </section>
  )
}

function ValuesSection() {
  const values = [
    { icon: <Target className="w-5 h-5" />, title: 'Results First', description: 'Everything we build is focused on measurable outcomes. We succeed when you grow.' },
    { icon: <Lightbulb className="w-5 h-5" />, title: 'Innovation', description: 'We continuously improve our systems and processes to stay ahead of the curve.' },
    { icon: <Eye className="w-5 h-5" />, title: 'Transparency', description: 'Clear communication and honest expectations — no smoke and mirrors.' },
    { icon: <Shield className="w-5 h-5" />, title: 'Integrity', description: "We give honest counsel, even when it's not what you want to hear. That's what builds trust." },
  ]

  return (
    <section className="py-24 md:py-32 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/[0.04] rounded-full blur-[140px]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <SectionReveal className="text-center mb-14">
          <motion.p variants={fadeUp} className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-4">Core Values</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            What drives us.
          </motion.h2>
        </SectionReveal>

        <SectionReveal className="grid sm:grid-cols-2 gap-4">
          {values.map((v) => (
            <motion.div
              key={v.title}
              variants={fadeUp}
              className="glass glass-hover rounded-2xl p-7 flex gap-5 items-start cursor-default transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 group-hover:bg-emerald-500/15 transition-colors">
                {v.icon}
              </div>
              <div>
                <h3 className="text-white font-semibold text-base mb-2">{v.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{v.description}</p>
              </div>
            </motion.div>
          ))}
        </SectionReveal>
      </div>
    </section>
  )
}

function AboutCta() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionReveal>
          <motion.div
            variants={fadeUp}
            className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-12 md:p-20 text-center"
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-500/[0.08] rounded-full blur-[80px]" />
            </div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
                Ready To Work<br />Together?
              </h2>
              <p className="text-zinc-400 text-lg mb-10 max-w-md mx-auto">
                Tell us about your brand and goals — we'll build a PR strategy around them.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 px-7 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all duration-200 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                >
                  Explore Services
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-7 py-4 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.09] text-white font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  Contact Us
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </SectionReveal>
      </div>
    </section>
  )
}

export default function About() {
  return (
    <main>
      <AboutHero />
      <NumbersSection />
      <WhoWeAreSection />
      <MissionSection />
      <ValuesSection />
      <AboutCta />
    </main>
  )
}
