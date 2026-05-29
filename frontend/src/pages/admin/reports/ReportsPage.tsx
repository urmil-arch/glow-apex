import { useEffect, useState, useCallback } from 'react';
import {
  BarChart3, TrendingUp, ShoppingCart, Ticket,
  DollarSign, Layers, Server, RefreshCw, Loader2, AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ReportRow {
  period: string;
  payments: number;
  revenue: number;
  orders: number;
  quantity: number;
  charges: number;
  profit: number;
  server_price: number;
  tickets: number;
  ticket_replies: number;
  refills: number;
  refill_quantity: number;
}

interface ReportSummary {
  total_payments: number;
  total_revenue: number;
  total_orders: number;
  total_quantity: number;
  total_charges: number;
  total_profit: number;
  total_server_price: number;
  total_tickets: number;
  total_ticket_replies: number;
  total_refills: number;
}

interface ReportResponse {
  summary: ReportSummary;
  rows: ReportRow[];
}

type PeriodKey = 'today' | 'week' | 'month' | '3months' | 'year' | 'all';
type GroupBy   = 'day' | 'month';
type TabKey    = 'payments' | 'orders' | 'tickets' | 'replies' | 'profit' | 'charges' | 'quantity' | 'server_price' | 'refiller';

// ── Constants ──────────────────────────────────────────────────────────────────

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today',   label: 'Today'         },
  { key: 'week',    label: 'This Week'     },
  { key: 'month',   label: 'This Month'    },
  { key: '3months', label: 'Last 3 Months' },
  { key: 'year',    label: 'This Year'     },
  { key: 'all',     label: 'All Time'      },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: 'payments',     label: 'Payments'       },
  { key: 'orders',       label: 'Orders'          },
  { key: 'tickets',      label: 'Tickets'         },
  { key: 'replies',      label: 'Ticket Replies'  },
  { key: 'profit',       label: 'Profit'          },
  { key: 'charges',      label: 'Charges'         },
  { key: 'quantity',     label: 'Quantity'        },
  { key: 'server_price', label: 'Server Price'    },
  { key: 'refiller',     label: 'Refiller'        },
];

interface ColDef {
  header: string;
  getValue: (r: ReportRow) => number | string;
  format: (v: number | string) => string;
  cls?: (v: number | string) => string;
  isTotal?: boolean;
}

const $   = (n: number) => `$${n.toFixed(2)}`;
const num = (n: number) => n.toLocaleString();

const TAB_COLS: Record<TabKey, ColDef[]> = {
  payments: [
    { header: 'Payments',     getValue: r => r.payments, format: v => num(v as number) },
    { header: 'Total Amount', getValue: r => r.revenue,  format: v => $(v as number),  cls: () => 'text-green-600 font-medium' },
  ],
  orders: [
    { header: 'Orders',   getValue: r => r.orders,   format: v => num(v as number) },
    { header: 'Quantity', getValue: r => r.quantity,  format: v => num(v as number) },
    { header: 'Charges',  getValue: r => r.charges,   format: v => $(v as number),  cls: () => 'text-orange-600' },
  ],
  tickets: [
    { header: 'Tickets', getValue: r => r.tickets,        format: v => num(v as number) },
    { header: 'Replies', getValue: r => r.ticket_replies, format: v => num(v as number) },
  ],
  replies: [
    { header: 'Total Replies', getValue: r => r.ticket_replies, format: v => num(v as number) },
  ],
  profit: [
    { header: 'Revenue',      getValue: r => r.revenue,      format: v => $(v as number),  cls: () => 'text-green-600' },
    { header: 'Charges',      getValue: r => r.charges,      format: v => $(v as number),  cls: () => 'text-gray-700' },
    { header: 'Server Price', getValue: r => r.server_price, format: v => $(v as number),  cls: () => 'text-orange-600' },
    { header: 'Profit',       getValue: r => r.profit,       format: v => $(v as number),  cls: v => (v as number) >= 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold' },
  ],
  charges: [
    { header: 'Charges',  getValue: r => r.charges,  format: v => $(v as number), cls: () => 'text-orange-600 font-medium' },
    { header: 'Quantity', getValue: r => r.quantity, format: v => num(v as number) },
  ],
  quantity: [
    { header: 'Quantity', getValue: r => r.quantity, format: v => num(v as number), cls: () => 'font-medium text-gray-800' },
    { header: 'Orders',   getValue: r => r.orders,   format: v => num(v as number) },
  ],
  server_price: [
    { header: 'Server Cost', getValue: r => r.server_price, format: v => $(v as number), cls: () => 'text-orange-600 font-medium' },
    { header: 'Orders',      getValue: r => r.orders,       format: v => num(v as number) },
  ],
  refiller: [
    { header: 'Refills',         getValue: r => r.refills,         format: v => num(v as number) },
    { header: 'Refill Quantity', getValue: r => r.refill_quantity, format: v => num(v as number), cls: () => 'text-purple-600' },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmtPeriod = (p: string, groupBy: GroupBy) => {
  if (!p) return '—';
  if (groupBy === 'month') {
    const [y, m] = p.split('-');
    if (!y || !m) return p;
    return new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  }
  return new Date(p).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const emptySummary: ReportSummary = {
  total_payments: 0, total_revenue: 0, total_orders: 0, total_quantity: 0,
  total_charges: 0,  total_profit: 0,  total_server_price: 0,
  total_tickets: 0,  total_ticket_replies: 0, total_refills: 0,
};

const ORDER_STATUSES = ['Pending', 'Processing', 'In progress', 'Completed', 'Cancelled', 'Partial', 'Refunded', 'Failed'] as const;
const TICKET_STATUSES: { key: string; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];
const TICKET_TYPES: { key: string; label: string }[] = [
  { key: 'order_related',   label: 'Order Related'   },
  { key: 'payment_related', label: 'Payment Related' },
  { key: 'other',           label: 'Other'           },
];

const orderStatusCls = (s: string): string => {
  const l = s.toLowerCase();
  if (l === 'completed')   return 'bg-green-50 border border-green-100';
  if (l === 'pending')     return 'bg-yellow-50 border border-yellow-100';
  if (l === 'processing' || l === 'in progress') return 'bg-blue-50 border border-blue-100';
  if (l === 'cancelled')   return 'bg-red-50 border border-red-100';
  if (l === 'failed')      return 'bg-red-50 border border-red-100';
  if (l === 'partial')     return 'bg-purple-50 border border-purple-100';
  if (l === 'refunded')    return 'bg-orange-50 border border-orange-100';
  return 'bg-gray-50 border border-gray-100';
};

const ticketStatusCls = (key: string): string => {
  if (key === 'open')        return 'bg-blue-50 border border-blue-100';
  if (key === 'in_progress') return 'bg-amber-50 border border-amber-100';
  if (key === 'resolved')    return 'bg-green-50 border border-green-100';
  if (key === 'closed')      return 'bg-gray-50 border border-gray-100';
  return 'bg-gray-50 border border-gray-100';
};

// ── Stat Card ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const StatCard = ({ label, value, sub, icon, iconBg, iconColor }: StatCardProps) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm text-gray-500">{label}</p>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

// ── Page ───────────────────────────────────────────────────────────────────────

const ReportsPage = () => {
  const [period,  setPeriod]  = useState<PeriodKey>('today');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [tab,     setTab]     = useState<TabKey>('orders');
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);
  const [rows,    setRows]    = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const [orderBreakdown,        setOrderBreakdown]        = useState<Record<string, number>>({});
  const [orderBreakdownLoading, setOrderBreakdownLoading] = useState(false);
  const [ticketStatusBreakdown, setTicketStatusBreakdown] = useState<Record<string, number>>({});
  const [ticketTypeBreakdown,   setTicketTypeBreakdown]   = useState<Record<string, number>>({});
  const [ticketBreakdownLoading, setTicketBreakdownLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<ReportResponse>(API_ENDPOINTS.ADMIN_REPORTS, {
        params: { period, group_by: groupBy },
      });
      setSummary(res.data.summary ?? emptySummary);
      setRows(res.data.rows ?? []);
    } catch {
      setError('Failed to load report data. The reports endpoint may not be implemented yet.');
      setSummary(emptySummary);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [period, groupBy]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const fetchOrderBreakdown = useCallback(async () => {
    setOrderBreakdownLoading(true);
    try {
      const results = await Promise.all(
        ORDER_STATUSES.map(s =>
          api.get<{ orders: unknown[]; total: number }>(API_ENDPOINTS.ADMIN_ORDERS, {
            params: { status_filter: s, page_size: 1 },
          }).then(r => ({ status: s, count: r.data.total ?? 0 }))
        )
      );
      const bd: Record<string, number> = {};
      results.forEach(r => { bd[r.status] = r.count; });
      setOrderBreakdown(bd);
    } catch { /* non-critical */ }
    finally { setOrderBreakdownLoading(false); }
  }, []);

  const fetchTicketBreakdown = useCallback(async () => {
    setTicketBreakdownLoading(true);
    try {
      const statusResults = await Promise.all(
        TICKET_STATUSES.map(s =>
          api.get<{ tickets: unknown[] }>(API_ENDPOINTS.ADMIN_SUPPORT_TICKETS, {
            params: { status_filter: s.key },
          }).then(r => ({ key: s.key, count: (r.data.tickets ?? []).length }))
        )
      );
      const typeResults = await Promise.all(
        TICKET_TYPES.map(t =>
          api.get<{ tickets: unknown[] }>(API_ENDPOINTS.ADMIN_SUPPORT_TICKETS, {
            params: { type_filter: t.key },
          }).then(r => ({ key: t.key, count: (r.data.tickets ?? []).length }))
        )
      );
      const sb: Record<string, number> = {};
      statusResults.forEach(r => { sb[r.key] = r.count; });
      setTicketStatusBreakdown(sb);
      const tb: Record<string, number> = {};
      typeResults.forEach(r => { tb[r.key] = r.count; });
      setTicketTypeBreakdown(tb);
    } catch { /* non-critical */ }
    finally { setTicketBreakdownLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'orders')  fetchOrderBreakdown();
    if (tab === 'tickets') fetchTicketBreakdown();
  }, [tab, fetchOrderBreakdown, fetchTicketBreakdown]);

  const cols = TAB_COLS[tab];

  // Compute totals row
  const totals = rows.reduce<Record<string, number>>((acc, r) => {
    cols.forEach(c => {
      const v = c.getValue(r);
      if (typeof v === 'number') acc[c.header] = (acc[c.header] ?? 0) + v;
    });
    return acc;
  }, {});

  const periodLabel = PERIODS.find(p => p.key === period)?.label ?? '';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">
            Analytics and statistics across all platform activity.
          </p>
        </div>
        <button
          onClick={fetchReport}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex flex-wrap gap-1">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                period === p.key
                  ? 'bg-teal-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['day', 'month'] as GroupBy[]).map(g => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                groupBy === g ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              By {g}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={`Orders — ${periodLabel}`}
          value={num(summary.total_orders)}
          sub={`${num(summary.total_quantity)} units`}
          icon={<ShoppingCart className="w-4 h-4" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <StatCard
          label={`Revenue — ${periodLabel}`}
          value={$(summary.total_revenue)}
          sub={`${summary.total_payments} payments`}
          icon={<DollarSign className="w-4 h-4" />}
          iconBg="bg-green-50"
          iconColor="text-green-500"
        />
        <StatCard
          label={`Profit — ${periodLabel}`}
          value={$(summary.total_profit)}
          sub={`Server: ${$(summary.total_server_price)}`}
          icon={<TrendingUp className="w-4 h-4" />}
          iconBg="bg-teal-50"
          iconColor="text-teal-500"
        />
        <StatCard
          label={`Tickets — ${periodLabel}`}
          value={num(summary.total_tickets)}
          sub={`${num(summary.total_ticket_replies)} replies`}
          icon={<Ticket className="w-4 h-4" />}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
        />
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 mb-4 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
              tab === t.key
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 text-teal-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <AlertCircle className="w-8 h-8 text-amber-400" />
            <p className="text-sm text-gray-500 text-center max-w-sm">{error}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400 gap-2">
            <BarChart3 className="w-10 h-10 text-gray-300" />
            <p className="text-sm">No data for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    {groupBy === 'day' ? 'Date' : 'Month'}
                  </th>
                  {cols.map(c => (
                    <th key={c.header} className="text-left px-4 py-3 font-medium text-gray-600">
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 font-medium text-xs whitespace-nowrap">
                      {fmtPeriod(row.period, groupBy)}
                    </td>
                    {cols.map(c => {
                      const val = c.getValue(row);
                      const formatted = c.format(val);
                      const colorCls = c.cls ? c.cls(val) : 'text-gray-700';
                      return (
                        <td key={c.header} className={`px-4 py-3 text-sm ${colorCls}`}>
                          {formatted}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-800 text-xs">Total</td>
                  {cols.map(c => {
                    const val = totals[c.header] ?? 0;
                    const formatted = typeof val === 'number' ? c.format(val) : '—';
                    const colorCls = c.cls ? c.cls(val) : 'text-gray-800';
                    return (
                      <td key={c.header} className={`px-4 py-3 text-sm font-semibold ${colorCls}`}>
                        {formatted}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Order Status Breakdown */}
      {tab === 'orders' && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Order Status Breakdown</h3>
            <span className="text-xs text-gray-400">All time • live from orders data</span>
          </div>
          {orderBreakdownLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {ORDER_STATUSES.map(s => (
                <div key={s} className={`rounded-xl p-3 text-center ${orderStatusCls(s)}`}>
                  <p className="text-2xl font-bold text-gray-900">{(orderBreakdown[s] ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ticket Status + Type Breakdown */}
      {tab === 'tickets' && (
        <div className="mt-4 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Ticket Status Breakdown</h3>
              <span className="text-xs text-gray-400">All time • live from tickets data</span>
            </div>
            {ticketBreakdownLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TICKET_STATUSES.map(s => (
                  <div key={s.key} className={`rounded-xl p-4 text-center ${ticketStatusCls(s.key)}`}>
                    <p className="text-2xl font-bold text-gray-900">{(ticketStatusBreakdown[s.key] ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Ticket Type Breakdown</h3>
            {ticketBreakdownLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TICKET_TYPES.map(t => (
                  <div key={t.key} className="rounded-xl p-4 text-center bg-gray-50 border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">{(ticketTypeBreakdown[t.key] ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Second stat row — detailed */}
      {!loading && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Charges</p>
            </div>
            <p className="text-xl font-bold text-orange-600">{$(summary.total_charges)}</p>
            <p className="text-xs text-gray-400 mt-1">{num(summary.total_quantity)} total units</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Server Price</p>
            </div>
            <p className="text-xl font-bold text-orange-500">{$(summary.total_server_price)}</p>
            <p className="text-xs text-gray-400 mt-1">SMM panel costs</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Refiller</p>
            </div>
            <p className="text-xl font-bold text-purple-600">{num(summary.total_refills)}</p>
            <p className="text-xs text-gray-400 mt-1">Total refills processed</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
