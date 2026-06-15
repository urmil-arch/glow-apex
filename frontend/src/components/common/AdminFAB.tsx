import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function AdminFAB() {
  const { user } = useAuth()

  const isStaff = user?.is_admin || (user?.permissions ?? []).length > 0
  if (!isStaff) return null

  return (
    <Link
      to="/admin"
      title="Admin Panel"
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-zinc-900 border border-white/10 shadow-xl shadow-black/40 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/20 hover:bg-zinc-800 transition-all duration-200 hover:scale-110"
    >
      <ShieldCheck className="w-5 h-5" />
    </Link>
  )
}
