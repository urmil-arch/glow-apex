import { useRef, useState } from 'react'
import { motion, AnimatePresence, useInView, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Calendar, BarChart3, Layers, Search, FileText, Share2, AlertTriangle,
  Users, Newspaper, Mic, Lightbulb, TrendingUp, Globe, MessageSquare,
  PieChart, Video, ArrowRight, X,
} from 'lucide-react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
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

/* ─── SERVICE DATA ──────────────────────────────────────────────── */
export const ALL_SERVICES = [
  {
    icon: <Calendar className="w-5 h-5" />,
    title: 'Special Events',
    category: 'Engagement',
    short: 'High-impact events that generate coverage and brand buzz.',
    detail: 'From product launches and press conferences to sponsorships and experiential activations, we plan and execute events that put your brand in front of the right audiences. We handle venue coordination, media invitations, on-site logistics, and post-event coverage amplification.',
  },
  {
    icon: <Newspaper className="w-5 h-5" />,
    title: 'Media Relations',
    category: 'Media',
    short: 'Earned coverage in the outlets that matter.',
    detail: 'Our media relations team maintains deep relationships with journalists, editors, and producers across print, digital, broadcast, and podcast channels. We craft compelling pitches, write press materials, and secure coverage that builds credibility you can\'t buy.',
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Issue Management',
    category: 'Reputation',
    short: 'Protect your reputation when it matters most.',
    detail: 'When a crisis hits, speed and precision are everything. We provide 24/7 monitoring, rapid response planning, spokesperson preparation, and media management to minimize damage and restore stakeholder confidence quickly.',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Community Relations',
    category: 'Engagement',
    short: 'Building trust where your brand operates.',
    detail: 'We develop and execute community engagement programs that strengthen relationships with local audiences, advocacy groups, and key stakeholders. From grassroots campaigns to CSR initiatives, we help your brand become a valued community partner.',
  },
  {
    icon: <Layers className="w-5 h-5" />,
    title: 'Brand Strategy Development',
    category: 'Strategy',
    short: 'A coherent identity that resonates and converts.',
    detail: 'We work with you to define your brand\'s purpose, voice, visual identity guidelines, and narrative pillars. Every touchpoint — from press releases to social bios — flows from a single strategic foundation that makes your brand unmistakable.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Marketing Plan Development',
    category: 'Strategy',
    short: 'A full-funnel roadmap built for your goals.',
    detail: 'We build integrated marketing plans that connect PR, content, paid, and organic channels into a single cohesive strategy. Each plan includes channel mix, timelines, KPIs, and budget allocation — ready to execute from day one.',
  },
  {
    icon: <Search className="w-5 h-5" />,
    title: 'Market Research',
    category: 'Intelligence',
    short: 'Data-backed insights to guide every decision.',
    detail: 'We design and execute primary and secondary research to map audience behavior, identify emerging trends, and validate messaging before you commit budget. Our reports translate raw data into clear strategic recommendations.',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Competitive Analysis',
    category: 'Intelligence',
    short: 'Deep intelligence on your market rivals.',
    detail: 'We conduct thorough competitive audits — analyzing messaging, positioning, media presence, and audience sentiment of your key competitors. The result is a clear picture of whitespace opportunities and strategic advantages your brand can own.',
  },
  {
    icon: <Share2 className="w-5 h-5" />,
    title: 'Social Media',
    category: 'Digital',
    short: 'Consistent presence that builds community and credibility.',
    detail: 'We manage content calendars, creative production, community engagement, and paid amplification across all major platforms. Our social strategies are rooted in brand voice and backed by analytics to drive meaningful, measurable growth.',
  },
  {
    icon: <Lightbulb className="w-5 h-5" />,
    title: 'Thought Leadership',
    category: 'Executive',
    short: 'Position your executives as the voices worth following.',
    detail: 'We identify speaking opportunities, ghostwrite op-eds, place bylined articles, and prepare executives for high-profile media appearances. Thought leadership programs build long-term authority that no ad spend can replicate.',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Digital PR & SEO',
    category: 'Digital',
    short: 'Online visibility that compounds over time.',
    detail: 'We merge traditional PR with search strategy — earning high-authority backlinks, optimizing press for discovery, and building a digital footprint that drives organic traffic alongside earned media coverage.',
  },
  {
    icon: <Mic className="w-5 h-5" />,
    title: 'Influencer Relations',
    category: 'Media',
    short: 'Authentic voices amplifying your message.',
    detail: 'We identify, vet, and manage relationships with creators and influencers whose audiences align with yours. From campaign briefs to content approvals and performance reporting, we run end-to-end influencer programs that feel genuine and deliver results.',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Government & Public Affairs',
    category: 'Strategy',
    short: 'Navigate policy and shape public perception.',
    detail: 'We help organizations engage effectively with government stakeholders, regulatory bodies, and the public on policy-sensitive issues. Our public affairs team bridges the gap between your business objectives and the political landscape.',
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'Internal Communications',
    category: 'Executive',
    short: 'Align your team around one clear narrative.',
    detail: 'Change management, leadership announcements, culture campaigns — we craft internal communication strategies that keep employees informed, engaged, and aligned with your brand direction during every stage of growth.',
  },
  {
    icon: <PieChart className="w-5 h-5" />,
    title: 'Investor Relations',
    category: 'Executive',
    short: 'Build confidence with the stakeholders who fund your vision.',
    detail: 'We craft investor narratives, prepare earnings communications, manage analyst relationships, and develop materials that present your story compellingly to the financial community — whether you\'re raising a round or preparing for a public offering.',
  },
  {
    icon: <Video className="w-5 h-5" />,
    title: 'Content Creation',
    category: 'Digital',
    short: 'Compelling content built for your brand voice.',
    detail: 'Press releases, blog posts, whitepapers, video scripts, social copy, and executive messaging — our content team produces everything you need to maintain a consistent, authoritative presence across every channel your audience uses.',
  },
]

type Service = (typeof ALL_SERVICES)[number]

const CATEGORIES = ['All', ...Array.from(new Set(ALL_SERVICES.map((s) => s.category)))]

/* ─── MODAL ─────────────────────────────────────────────────────── */
function ServiceModal({ service, onClose }: { service: Service; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }}
        exit={{ opacity: 0, scale: 0.95, y: 8, transition: { duration: 0.15 } }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#111] border border-white/[0.1] rounded-2xl p-8 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full mb-4">
          {service.category}
        </span>

        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
          {service.icon}
        </div>

        <h3 className="text-white font-bold text-xl mb-3 uppercase tracking-wide">{service.title}</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">{service.detail}</p>

        <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center gap-3">
          <Link
            to="/contact"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
          >
            Get in Touch
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── HERO ──────────────────────────────────────────────────────── */
function ServicesHero() {
  return (
    <section className="relative min-h-[55vh] flex items-end pb-20 pt-36 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/[0.06] rounded-full blur-[130px]" />
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
          What We Offer
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-none mb-6"
        >
          PR Services<br />
          <span className="gradient-text">Built to Perform.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="max-w-2xl text-lg md:text-xl text-zinc-400 leading-relaxed"
        >
          Full-spectrum public relations and communications services designed to build credibility, protect reputation, and amplify your brand at every stage.
        </motion.p>
      </div>
    </section>
  )
}

/* ─── SERVICES GRID ─────────────────────────────────────────────── */
function ServicesGrid() {
  const [active, setActive] = useState<Service | null>(null)
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'All' ? ALL_SERVICES : ALL_SERVICES.filter((s) => s.category === filter)

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Category filter */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="flex flex-wrap gap-2 mb-12"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-200 ${
                filter === cat
                  ? 'bg-emerald-500 border-emerald-500 text-black'
                  : 'bg-white/[0.03] border-white/[0.09] text-zinc-400 hover:text-white hover:border-white/[0.2]'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        <SectionReveal className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((service) => (
              <motion.div
                key={service.title}
                variants={fadeUp}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass glass-hover rounded-2xl p-6 flex flex-col gap-4 group transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/15 transition-colors">
                  {service.icon}
                </div>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">{service.category}</span>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-1.5">{service.title}</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed">{service.short}</p>
                </div>
                <button
                  onClick={() => setActive(service)}
                  className="self-start inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-xs font-semibold transition-colors group/btn"
                >
                  Read More
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </SectionReveal>
      </div>

      <AnimatePresence>
        {active && <ServiceModal service={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </section>
  )
}

/* ─── CTA ───────────────────────────────────────────────────────── */
function ServicesCta() {
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
                Not Sure Where<br />To Start?
              </h2>
              <p className="text-zinc-400 text-lg mb-10 max-w-md mx-auto">
                Tell us about your brand and goals — we'll build the right PR strategy for you.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-7 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all duration-200 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
              >
                Talk to Our Team
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </SectionReveal>
      </div>
    </section>
  )
}

/* ─── PAGE EXPORT ───────────────────────────────────────────────── */
export default function Services() {
  return (
    <main>
      <ServicesHero />
      <ServicesGrid />
      <ServicesCta />
    </main>
  )
}
