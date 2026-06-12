import { Link } from 'react-router-dom'
import { Zap, Mail, MapPin, ExternalLink } from 'lucide-react'

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

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">

          {/* Brand */}
          <div className="space-y-5">
            <Link to="/" className="flex items-center gap-2.5 w-fit group">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
                <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">
                Glow <span className="text-emerald-400">Apex</span>
              </span>
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-[260px]">
              Powering digital visibility and social proof at scale.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {[
                { href: 'https://instagram.com', icon: <InstagramIcon />, label: 'Instagram' },
                { href: 'https://youtube.com', icon: <YouTubeIcon />, label: 'YouTube' },
                { href: 'https://linkedin.com', icon: <LinkedInIcon />, label: 'LinkedIn' },
              ].map(({ href, icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.07] text-zinc-500 hover:text-white hover:border-white/[0.14] transition-all"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Navigation</h3>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Home', to: '/' },
                { label: 'About', to: '/about' },
                { label: 'Services', to: '/services' },
                { label: 'Contact', to: '/contact' },
              ].map(({ label, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="text-sm text-zinc-500 hover:text-white transition-colors w-fit"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Contact</h3>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:hello@glowapex.com"
                className="flex items-center gap-2.5 text-sm text-zinc-500 hover:text-white transition-colors w-fit"
              >
                <Mail className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                hello@glowapex.com
              </a>
              <a
                href="https://glowapex.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-zinc-500 hover:text-emerald-400 transition-colors w-fit"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                glowapex.com
              </a>
              <div className="flex items-center gap-2.5 text-sm text-zinc-600">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                Ahmedabad, Gujarat, India
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-zinc-700 text-xs">
            © {new Date().getFullYear()} Glow Apex. All rights reserved.
          </p>
          <p className="text-zinc-700 text-xs">
            Powering{' '}
            <a href="https://glowapex.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-emerald-400 transition-colors">
              GlowApex.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
