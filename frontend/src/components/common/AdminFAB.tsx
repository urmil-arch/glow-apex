import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function AdminFAB() {
  const { user } = useAuth()

  const isStaff = user?.is_admin || (user?.permissions ?? []).length > 0
  if (!isStaff) return null

  return (
    <div className="group fixed bottom-6 right-6 z-50 flex items-center gap-2">
      <span className="pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap text-xs font-semibold text-white bg-zinc-900 border border-white/10 px-2.5 py-1.5 rounded-lg shadow-lg">
        Admin Panel
      </span>
      <Link
        to="/admin"
        className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 shadow-xl shadow-black/40 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-white/20 group-hover:bg-zinc-800 transition-all duration-200 group-hover:scale-110"
      >
        <ShieldCheck className="w-5 h-5" />
      </Link>
    </div>
  )
}
