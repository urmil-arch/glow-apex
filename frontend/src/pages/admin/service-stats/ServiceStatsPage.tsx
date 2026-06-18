import { useEffect, useState, useCallback } from 'react'
import {
  Eye, ThumbsUp, Users, MessageSquare, Film, Heart,
  RefreshCw, Clock, TrendingUp, BarChart2, Package,
} from 'lucide-react'
import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/config'

interface ServiceStat {
  category_name: string
  total_orders: number
  week_orders: number
  month_orders: number
  last_used_at: string | null
  top_quantity: number | null
}

interface ServiceMeta {
  icon: React.ReactNode
  color: string
  ring: string
  bg: string
  bar: string
}

const SERVICE_META: Record<string, ServiceMeta> = {
  'YouTube Views': {
    icon: <Eye className="w-5 h-5" />,
    color: 'text-blue-600',
    ring: 'ring-blue-200',
    bg: 'bg-blue-50',
    bar: 'bg-blue-500',
  },
  'YouTube Likes': {
    icon: <ThumbsUp className="w-5 h-5" />,
    color: 'text-red-500',
    ring: 'ring-red-200',
    bg: 'bg-red-50',
    bar: 'bg-red-500',
  },
  'YouTube Subscribers': {
    icon: <Users className="w-5 h-5" />,
    color: 'text-green-600',
    ring: 'ring-green-200',
    bg: 'bg-green-50',
    bar: 'bg-green-500',
  },
  'YouTube Comments': {
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'text-purple-600',
    ring: 'ring-purple-200',
    bg: 'bg-purple-50',
    bar: 'bg-purple-500',
  },
  'YouTube Shorts Views': {
    icon: <Film className="w-5 h-5" />,
    color: 'text-orange-500',
    ring: 'ring-orange-200',
    bg: 'bg-orange-50',
    bar: 'bg-orange-500',
  },
  'YouTube Shorts Likes': {
    icon: <Heart className="w-5 h-5" />,
    color: 'text-pink-500',
    ring: 'ring-pink-200',
    bg: 'bg-pink-50',
    bar: 'bg-pink-500',
  },
}

const DEFAULT_META: ServiceMeta = {
  icon: <Package className="w-5 h-5" />,
  color: 'text-gray-500',
  ring: 'ring-gray-200',
  bg: 'bg-gray-50',
  bar: 'bg-gray-400',
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n.toLocaleString('en-US')
}

export default function ServiceStatsPage() {
  const [stats, setStats] = useState<ServiceStat[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const res = await api.get<ServiceStat[]>(API_ENDPOINTS.ADMIN_ORDERS_SERVICE_STATS)
      setStats(res.data)
      setLastRefreshed(new Date())
    } catch {
      setError('Failed to load service stats.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(true), 60_000)
    return () => clearInterval(interval)
  }, [load])

  const maxTotal = stats.length ? Math.max(...stats.map((s) => s.total_orders)) : 1

  const totalOrders = stats.reduce((sum, s) => sum + s.total_orders, 0)
  const totalThisWeek = stats.reduce((sum, s) => sum + s.week_orders, 0)
  const totalThisMonth = stats.reduce((sum, s) => sum + s.month_orders, 0)
  const mostUsed = stats[0] ?? null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-teal-600" />
            Service Usage Stats
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track which services are active, popular, and when they were last ordered.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-gray-400">
              Updated {timeAgo(lastRefreshed.toISOString())}
            </span>
          )}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary row */}
      {!loading && !error && stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Orders', value: fmtNum(totalOrders), icon: <TrendingUp className="w-4 h-4 text-teal-600" />, bg: 'bg-teal-50' },
            { label: 'This Week', value: fmtNum(totalThisWeek), icon: <Clock className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50' },
            { label: 'This Month', value: fmtNum(totalThisMonth), icon: <BarChart2 className="w-4 h-4 text-purple-600" />, bg: 'bg-purple-50' },
            {
              label: 'Most Popular',
              value: mostUsed?.category_name ?? '—',
              icon: <TrendingUp className="w-4 h-4 text-orange-500" />,
              bg: 'bg-orange-50',
              small: true,
            },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
                {c.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium">{c.label}</p>
                <p className={`font-bold text-gray-900 truncate ${c.small ? 'text-sm mt-0.5' : 'text-xl'}`}>
                  {c.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && stats.length === 0 && (
        <div className="text-center py-20 text-gray-400 text-sm">
          No orders have been placed yet.
        </div>
      )}

      {/* Cards grid */}
      {!loading && !error && stats.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const meta = SERVICE_META[stat.category_name] ?? DEFAULT_META
            const pct = maxTotal > 0 ? Math.round((stat.total_orders / maxTotal) * 100) : 0
            const isTopService = stat.total_orders === maxTotal && maxTotal > 0

            return (
              <div
                key={stat.category_name}
                className={`bg-white border rounded-xl p-5 flex flex-col gap-4 ${
                  isTopService ? `ring-2 ${meta.ring} border-transparent` : 'border-gray-100'
                }`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-lg ${meta.bg} ${meta.color} flex items-center justify-center flex-shrink-0`}>
                      {meta.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 leading-snug">
                        {stat.category_name}
                      </p>
                      {isTopService && (
                        <span className="text-[10px] font-semibold text-orange-500 uppercase tracking-wide">
                          Most Used
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 tabular-nums flex-shrink-0">
                    {fmtNum(stat.total_orders)}
                  </span>
                </div>

                {/* Usage bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Usage share</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${meta.bar} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">This Week</p>
                    <p className="text-base font-bold text-gray-800 tabular-nums">{fmtNum(stat.week_orders)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">This Month</p>
                    <p className="text-base font-bold text-gray-800 tabular-nums">{fmtNum(stat.month_orders)}</p>
                  </div>
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {stat.last_used_at ? (
                      <span>Last used: <span className="font-medium text-gray-700">{timeAgo(stat.last_used_at)}</span></span>
                    ) : (
                      <span className="text-gray-400">Never used</span>
                    )}
                  </div>
                  {stat.top_quantity !== null && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium tabular-nums">
                      Top: {fmtNum(stat.top_quantity)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
