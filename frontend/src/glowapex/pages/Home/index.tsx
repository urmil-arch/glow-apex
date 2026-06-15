import { useRef } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Eye, Globe, Shield, Clock, CheckCircle,
  BarChart3, Rocket, Search, Target, ArrowRight,
} from 'lucide-react'

import AnimatedCounter from '../../components/AnimatedCounter'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

function SectionReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function HeroSection() {
  const stats = [
    { value: 500, suffix: '+', label: 'Campaigns Executed' },
    { value: 200, suffix: '+', label: 'Clients Served' },
    { value: 98, suffix: '%', label: 'Client Retention' },
  ]

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-blue-500/[0.07] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-500/[0.04] rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8"
        >
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Full-Service PR & Communications Agency
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-none text-white mb-6"
        >
          Growth Without
          <br />
          <span className="gradient-text">Guesswork.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-400 leading-relaxed mb-10"
        >
          We help brands, executives, and businesses build credibility, earn media coverage, and communicate with clarity at every stage of growth.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20"
        >
          <a
            href="#services"
            onClick={(e) => { e.preventDefault(); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) }}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5"
          >
            Explore Services
            <ArrowRight className="w-4 h-4" />
          </a>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.09] text-white font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
          >
            Contact Us
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="grid grid-cols-3 max-w-xl mx-auto gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]"
        >
          {stats.map(({ value, suffix, label }) => (
            <div key={label} className="flex flex-col items-center py-5 px-4 bg-[#0A0A0A]/60 backdrop-blur-sm">
              <span className="text-2xl md:text-3xl font-bold text-white tabular-nums">
                <AnimatedCounter target={value} suffix={suffix} duration={2000} />
              </span>
              <span className="text-xs text-zinc-500 mt-1">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-zinc-600 tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className="w-px h-8 bg-gradient-to-b from-zinc-600 to-transparent"
        />
      </motion.div>
    </section>
  )
}

function WhatWeDoSection() {
  const cards = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Media Relations',
      description: 'We earn your brand coverage in the publications, broadcasts, and podcasts that your audience trusts.',
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: 'Reputation Management',
      description: 'Shape how the world sees your brand — proactively building a narrative that holds up under scrutiny.',
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: 'Strategic Communications',
      description: 'Coherent messaging across every channel — from press releases to executive speeches to social copy.',
    },
  ]

  return (
    <section id="what-we-do" className="py-24 md:py-32 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/[0.05] rounded-full blur-[130px]" />
        <div className="absolute right-0 top-0 w-[300px] h-[300px] bg-blue-500/[0.03] rounded-full blur-[100px]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <SectionReveal className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-4">What We Do</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Built for scale.<br />Designed for results.
          </motion.h2>
        </SectionReveal>

        <SectionReveal className="grid md:grid-cols-3 gap-5">
          {cards.map((card) => (
            <motion.div
              key={card.title}
              variants={fadeUp}
              className="glass glass-hover rounded-2xl p-7 flex flex-col gap-4 cursor-default transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/15 transition-colors">
                {card.icon}
              </div>
              <h3 className="text-white font-semibold text-lg">{card.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </SectionReveal>
      </div>
    </section>
  )
}

function ServicesSection() {
  const pills = ['Media Relations', 'Brand Strategy', 'Special Events', 'Crisis Management', 'Thought Leadership', 'Social Media', 'Market Research', 'Influencer Relations']

  return (
    <section id="services" className="py-24 md:py-32 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-500/[0.04] rounded-full blur-[120px]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <SectionReveal className="text-center">
          <motion.p variants={fadeUp} className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-4">Our Services</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Everything you need<br />to own your narrative.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-5 text-zinc-500 text-lg max-w-xl mx-auto mb-10">
            Full-spectrum PR and communications services designed to build, protect, and amplify your brand.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2 mb-10">
            {pills.map((p) => (
              <span key={p} className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-white/[0.09] bg-white/[0.03] text-zinc-400">
                {p}
              </span>
            ))}
            <span className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">+8 more</span>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5"
            >
              View All Services
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </SectionReveal>
      </div>
    </section>
  )
}

function HowWeWorkSection() {
  const steps = [
    {
      icon: <Search className="w-6 h-6" />,
      step: '01',
      title: 'Analyze',
      description: 'We evaluate your current presence, goals, and target audience to build a precise growth strategy.',
    },
    {
      icon: <Target className="w-6 h-6" />,
      step: '02',
      title: 'Optimize',
      description: 'We fine-tune your positioning and select the right services for maximum impact and efficiency.',
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      step: '03',
      title: 'Execute',
      description: 'We launch. Press coverage, stakeholder engagement, and brand moments — built to last.',
    },
  ]

  return (
    <section className="py-24 md:py-32 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/[0.04] rounded-full blur-[150px]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <SectionReveal className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-4">How We Work</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Simple process.<br />Powerful results.
          </motion.h2>
        </SectionReveal>

        <SectionReveal className="grid md:grid-cols-3 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.05]">
          {steps.map((step, i) => (
            <motion.div key={step.title} variants={fadeUp} className="relative bg-[#0A0A0A] p-8 lg:p-10 flex flex-col gap-5 group hover:bg-white/[0.02] transition-colors">
              <span className="text-[80px] font-black text-white/[0.04] leading-none absolute top-6 right-6 select-none group-hover:text-white/[0.06] transition-colors">
                {step.step}
              </span>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 z-10">
                {step.icon}
              </div>
              <div className="z-10">
                <h3 className="text-white font-bold text-xl mb-3">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-[13px] z-20 w-6 h-6 rounded-full bg-[#0A0A0A] border border-white/[0.08] items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-zinc-600" />
                </div>
              )}
            </motion.div>
          ))}
        </SectionReveal>
      </div>
    </section>
  )
}

function WhySection() {
  const features = [
    { icon: <Rocket className="w-5 h-5" />, title: 'Strategic Approach', desc: 'Every campaign is built on research, positioning, and a clear narrative.' },
    { icon: <BarChart3 className="w-5 h-5" />, title: 'Measurable Impact', desc: 'We track coverage, sentiment, and reach so you always see the ROI.' },
    { icon: <Globe className="w-5 h-5" />, title: 'Global Reach', desc: 'PR and communications experience across markets in 50+ countries.' },
    { icon: <Shield className="w-5 h-5" />, title: 'Reputation First', desc: 'Everything we do is designed to protect and strengthen your brand.' },
    { icon: <Clock className="w-5 h-5" />, title: '24/7 Support', desc: 'Our team is available around the clock — especially when it matters.' },
    { icon: <CheckCircle className="w-5 h-5" />, title: 'Proven Results', desc: 'Campaigns that have earned coverage in top-tier media worldwide.' },
  ]

  return (
    <section className="py-24 md:py-32 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/[0.05] rounded-full blur-[130px]" />
        <div className="absolute left-0 bottom-0 w-[300px] h-[300px] bg-blue-500/[0.03] rounded-full blur-[100px]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <SectionReveal className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-4">Why Glow Apex</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            The infrastructure<br />growth deserves.
          </motion.h2>
        </SectionReveal>

        <SectionReveal className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="glass glass-hover rounded-xl p-6 flex gap-4 items-start cursor-default transition-all duration-300 group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5 group-hover:bg-emerald-500/15 transition-colors">
                {f.icon}
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1.5">{f.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </SectionReveal>
      </div>
    </section>
  )
}

function TrustSection() {
  const metrics = [
    { value: 10, suffix: 'K+', label: 'Media Placements' },
    { value: 500, suffix: '+', label: 'Campaigns Delivered' },
    { value: 50, suffix: '+', label: 'Countries Served' },
  ]
  const trustGroups = ['Founders', 'Agencies', 'Startups', 'D2C Brands', 'SaaS Teams', 'Global Firms']

  return (
    <section className="py-24 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/10 to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <SectionReveal className="text-center mb-16">
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Trusted By Brands, Executives &amp;<br />Agencies Worldwide
          </motion.h2>
        </SectionReveal>

        <SectionReveal className="mb-16">
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4">
            {trustGroups.map((group) => (
              <div
                key={group}
                className="flex h-12 min-w-32 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] px-5 text-sm font-semibold text-zinc-300 shadow-sm shadow-black/20 transition-colors hover:border-emerald-500/25 hover:bg-emerald-500/[0.06] hover:text-white"
              >
                {group}
              </div>
            ))}
          </motion.div>
        </SectionReveal>

        <SectionReveal className="grid sm:grid-cols-3 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.05]">
          {metrics.map(({ value, suffix, label }) => (
            <motion.div key={label} variants={fadeUp} className="bg-[#0A0A0A] py-10 px-6 text-center">
              <div className="text-4xl md:text-5xl font-black text-white mb-2">
                <AnimatedCounter target={value} suffix={suffix} duration={2000} />
              </div>
              <p className="text-zinc-500 text-sm">{label}</p>
            </motion.div>
          ))}
        </SectionReveal>
      </div>
    </section>
  )
}

function AboutSnippetSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <SectionReveal>
          <motion.p variants={fadeUp} className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-6">About Glow Apex</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-8">
            We Build Brands<br />That Get Noticed.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-zinc-400 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            Glow Apex is a full-service PR and communications agency. We craft compelling narratives, build media relationships, and protect the reputations of the brands we partner with.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold text-sm transition-colors group"
            >
              Learn more about us
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </SectionReveal>
      </div>
    </section>
  )
}

function CtaSection() {
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
              <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-5">
                Ready To Grow?
              </h2>
              <p className="text-zinc-400 text-lg mb-10 max-w-lg mx-auto">
                Join leading brands and executives that trust Glow Apex to shape their story and protect their reputation.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-7 py-4 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.09] text-white font-bold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  Contact Team
                </Link>
              </div>
            </div>
          </motion.div>
        </SectionReveal>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <main>
      <HeroSection />
      <WhatWeDoSection />
      <ServicesSection />
      <HowWeWorkSection />
      <WhySection />
      <TrustSection />
      <AboutSnippetSection />
      <CtaSection />
    </main>
  )
}
