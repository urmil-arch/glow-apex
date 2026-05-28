import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ClipboardList,
  Search,
  RefreshCw,
  X,
  Loader2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdminOrder {
  id: string;
  user_id: string;
  user_email: string;
  user_username: string;
  service_id: string;
  service_name: string;
  provider_id: string;
  provider_order_id: string;
  link: string;
  quantity: number;
  charge: number;
  status: string;
  start_count: string;
  remains: string;
  currency: string;
  created_at: string;
}

interface AdminOrderListResponse {
  orders: AdminOrder[];
  total: number;
  page: number;
  page_size: number;
}

interface ServiceOption {
  id: string;
  name: string;
  category_name: string;
}

interface MenuPosition {
  buttonTop: number;
  buttonBottom: number;
  right: number;
  openUpward: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

const STATUS_OPTIONS = [
  'Pending',
  'Processing',
  'In progress',
  'Completed',
  'Cancelled',
  'Refunded',
  'Partial',
  'Failed',
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const getStatusClass = (s: string): string => {
  const lower = s.toLowerCase();
  if (lower === 'completed') return 'bg-green-100 text-green-700';
  if (lower === 'pending') return 'bg-yellow-100 text-yellow-700';
  if (lower === 'processing' || lower === 'in progress') return 'bg-blue-100 text-blue-700';
  if (lower === 'cancelled') return 'bg-red-100 text-red-700';
  if (lower === 'refunded') return 'bg-purple-100 text-purple-700';
  if (lower === 'partial') return 'bg-orange-100 text-orange-700';
  if (lower === 'failed') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
};

const computeCurrent = (order: AdminOrder): string => {
  const sc = parseInt(order.start_count, 10);
  const rem = parseInt(order.remains, 10);
  if (!isNaN(sc) && !isNaN(rem)) {
    return (sc + (order.quantity - rem)).toLocaleString();
  }
  return '—';
};

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const shortId = (id: string): string => `#${id.slice(-8).toUpperCase()}`;

const extractDetail = (err: unknown): string => {
  const e = err as { response?: { data?: { detail?: string } } };
  return e?.response?.data?.detail ?? 'An error occurred. Please try again.';
};

// ── Shared sub-components ──────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" onClick={onClose} />
    <div
      className={`relative bg-white rounded-xl shadow-xl w-full ${
        wide ? 'max-w-2xl' : 'max-w-md'
      } p-6 max-h-[90vh] overflow-y-auto`}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

interface ActionMenuItemProps {
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
}

const ActionMenuItem: React.FC<ActionMenuItemProps> = ({ onClick, label, icon, danger }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 w-full px-4 py-2 text-sm text-left transition-colors ${
      danger
        ? 'text-red-600 hover:bg-red-50'
        : 'text-gray-700 hover:bg-gray-50'
    }`}
  >
    {icon}
    {label}
  </button>
);

interface DetailFieldProps {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}

const DetailField: React.FC<DetailFieldProps> = ({ label, value, mono, children }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    {children ?? (
      <p className={`text-sm text-gray-800 break-all ${mono ? 'font-mono' : ''}`}>
        {value ?? '—'}
      </p>
    )}
  </div>
);

interface SaveButtonProps {
  loading: boolean;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  color?: string;
}

const SaveButton: React.FC<SaveButtonProps> = ({
  loading,
  onClick,
  disabled,
  label = 'Save',
  color = 'bg-teal-600 hover:bg-teal-700',
}) => (
  <button
    onClick={onClick}
    disabled={loading || disabled}
    className={`flex items-center justify-center gap-2 px-4 py-2 text-sm text-white rounded-lg ${color} disabled:opacity-40 transition-colors`}
  >
    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
  </button>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [refetch, setRefetch] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [detailOrder, setDetailOrder] = useState<AdminOrder | null>(null);
  const [detailLive, setDetailLive] = useState<AdminOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [editLinkOrder, setEditLinkOrder] = useState<AdminOrder | null>(null);
  const [editLinkValue, setEditLinkValue] = useState('');

  const [editServiceOrder, setEditServiceOrder] = useState<AdminOrder | null>(null);
  const [adminServices, setAdminServices] = useState<ServiceOption[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');

  const [startCountOrder, setStartCountOrder] = useState<AdminOrder | null>(null);
  const [startCountValue, setStartCountValue] = useState('');

  const [remainsOrder, setRemainsOrder] = useState<AdminOrder | null>(null);
  const [remainsValue, setRemainsValue] = useState('');

  const [partialOrder, setPartialOrder] = useState<AdminOrder | null>(null);
  const [partialValue, setPartialValue] = useState('');

  const [statusOrder, setStatusOrder] = useState<AdminOrder | null>(null);
  const [statusValue, setStatusValue] = useState('');

  const [cancelOrder, setCancelOrder] = useState<AdminOrder | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // ── Debounce search ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // ── Fetch orders ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');

    (async () => {
      try {
        const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
        if (statusFilter) params.set('status', statusFilter);
        if (debouncedSearch) params.set('search', debouncedSearch);
        const res = await api.get<AdminOrderListResponse>(
          `${API_ENDPOINTS.ADMIN_ORDERS}?${params}`,
        );
        if (!cancelled) {
          setOrders(res.data.orders);
          setTotal(res.data.total);
        }
      } catch {
        if (!cancelled) setLoadError('Failed to load orders.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, statusFilter, debouncedSearch, refetch]);

  const triggerRefetch = () => setRefetch((r) => r + 1);

  const closeMenu = () => { setOpenMenuId(null); setMenuPosition(null); };

  // ── Action helpers ────────────────────────────────────────────────────────
  const handlePatch = async (
    url: string,
    body: Record<string, unknown>,
    onSuccess: () => void,
  ) => {
    setActionLoading(true);
    setActionError('');
    try {
      await api.patch(url, body);
      onSuccess();
      triggerRefetch();
    } catch (err) {
      setActionError(extractDetail(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePost = async (url: string, onSuccess: () => void) => {
    setActionLoading(true);
    setActionError('');
    try {
      await api.post(url);
      onSuccess();
      triggerRefetch();
    } catch (err) {
      setActionError(extractDetail(err));
    } finally {
      setActionLoading(false);
    }
  };

  // ── Open detail modal ─────────────────────────────────────────────────────
  const openDetail = async (order: AdminOrder) => {
    setDetailOrder(order);
    setDetailLive(null);
    setDetailLoading(true);
    try {
      const res = await api.get<AdminOrder>(`${API_ENDPOINTS.ADMIN_ORDERS}/${order.id}`);
      setDetailLive(res.data);
    } catch {
      setDetailLive(order);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (!detailOrder) return;
    setDetailLoading(true);
    try {
      const res = await api.get<AdminOrder>(`${API_ENDPOINTS.ADMIN_ORDERS}/${detailOrder.id}`);
      setDetailLive(res.data);
    } catch {
      // keep existing data
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Open edit-service modal ───────────────────────────────────────────────
  const openEditService = async (order: AdminOrder) => {
    setEditServiceOrder(order);
    setSelectedServiceId(order.service_id);
    setActionError('');
    if (adminServices.length === 0) {
      try {
        const res = await api.get<{ id: string; name: string; category_name: string }[]>(
          API_ENDPOINTS.ADMIN_SERVICES,
        );
        setAdminServices(
          res.data.map((s) => ({ id: s.id, name: s.name, category_name: s.category_name })),
        );
      } catch {
        // leave empty
      }
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const openMenuOrder = openMenuId ? (orders.find((o) => o.id === openMenuId) ?? null) : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-50">
          <ClipboardList className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">All orders from all users</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-500">{total.toLocaleString()} total</span>
          <button
            onClick={triggerRefetch}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by link or service name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loadError && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{loadError}</p>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <ClipboardList className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {[
                    'ID',
                    'User',
                    'Charge',
                    'Link',
                    'Start Count',
                    'Current',
                    'Qty',
                    'Service',
                    'Status',
                    'Remains',
                    'Created',
                    'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    {/* ID */}
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                      {shortId(order.id)}
                    </td>
                    {/* User */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs font-medium text-gray-800 max-w-36 truncate">
                        {order.user_email || order.user_id}
                      </p>
                      {order.user_username && (
                        <p className="text-xs text-gray-400">@{order.user_username}</p>
                      )}
                    </td>
                    {/* Charge */}
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">
                      ${order.charge.toFixed(4)}
                    </td>
                    {/* Link */}
                    <td className="px-4 py-3 max-w-52">
                      <a
                        href={order.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={order.link}
                        className="text-teal-600 hover:underline text-xs block truncate"
                      >
                        {order.link}
                      </a>
                    </td>
                    {/* Start Count */}
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {order.start_count || '—'}
                    </td>
                    {/* Current */}
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {computeCurrent(order)}
                    </td>
                    {/* Quantity */}
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {order.quantity.toLocaleString()}
                    </td>
                    {/* Service */}
                    <td className="px-4 py-3 max-w-40">
                      <span
                        className="text-xs text-gray-700 block truncate"
                        title={order.service_name}
                      >
                        {order.service_name || '—'}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    {/* Remains */}
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {order.remains || '—'}
                    </td>
                    {/* Created */}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openMenuId === order.id) { closeMenu(); return; }
                          const rect = e.currentTarget.getBoundingClientRect();
                          const openUpward = window.innerHeight - rect.bottom < 320;
                          setMenuPosition({
                            buttonTop: rect.top,
                            buttonBottom: rect.bottom,
                            right: window.innerWidth - rect.right,
                            openUpward,
                          });
                          setOpenMenuId(order.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of{' '}
            {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <span className="px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Action menu — portaled to <body> so it escapes overflow:hidden/auto containers */}
      {openMenuId && menuPosition && openMenuOrder &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={closeMenu} />
            <div
              className="fixed z-50 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1"
              style={
                menuPosition.openUpward
                  ? { bottom: window.innerHeight - menuPosition.buttonTop + 4, right: menuPosition.right }
                  : { top: menuPosition.buttonBottom + 4, right: menuPosition.right }
              }
            >
              <ActionMenuItem
                onClick={() => { closeMenu(); openDetail(openMenuOrder); }}
                icon={<Eye className="h-4 w-4" />}
                label="Order Details"
              />
              <ActionMenuItem
                onClick={() => { closeMenu(); setEditLinkOrder(openMenuOrder); setEditLinkValue(openMenuOrder.link); setActionError(''); }}
                label="Edit Link"
              />
              <ActionMenuItem
                onClick={() => { closeMenu(); openEditService(openMenuOrder); }}
                label="Edit Service"
              />
              <ActionMenuItem
                onClick={() => { closeMenu(); setStartCountOrder(openMenuOrder); setStartCountValue(openMenuOrder.start_count); setActionError(''); }}
                label="Set Start Count"
              />
              <ActionMenuItem
                onClick={() => { closeMenu(); setRemainsOrder(openMenuOrder); setRemainsValue(openMenuOrder.remains); setActionError(''); }}
                label="Set Remains"
              />
              <ActionMenuItem
                onClick={() => { closeMenu(); setPartialOrder(openMenuOrder); setPartialValue(openMenuOrder.remains); setActionError(''); }}
                label="Set Partial"
              />
              <ActionMenuItem
                onClick={() => { closeMenu(); setStatusOrder(openMenuOrder); setStatusValue(openMenuOrder.status); setActionError(''); }}
                label="Change Status"
              />
              <div className="border-t border-gray-100 my-1" />
              <ActionMenuItem
                onClick={() => { closeMenu(); setCancelOrder(openMenuOrder); setActionError(''); }}
                label="Cancel & Refund"
                danger
              />
            </div>
          </>,
          document.body,
        )
      }

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {/* Order Details */}
      {detailOrder && (
        <Modal title="Order Details" onClose={() => setDetailOrder(null)} wide>
          {detailLoading && !detailLive ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm mb-5">
                <DetailField label="Order ID" value={shortId((detailLive ?? detailOrder).id)} mono />
                <DetailField
                  label="Provider Order ID"
                  value={(detailLive ?? detailOrder).provider_order_id || '—'}
                  mono
                />
                <DetailField label="User Email" value={(detailLive ?? detailOrder).user_email || '—'} />
                <DetailField
                  label="Username"
                  value={
                    (detailLive ?? detailOrder).user_username
                      ? `@${(detailLive ?? detailOrder).user_username}`
                      : '—'
                  }
                />
                <DetailField label="Service" value={(detailLive ?? detailOrder).service_name || '—'} />
                <DetailField label="Status">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass((detailLive ?? detailOrder).status)}`}
                  >
                    {(detailLive ?? detailOrder).status}
                  </span>
                </DetailField>
                <DetailField label="Link" value={(detailLive ?? detailOrder).link} />
                <DetailField
                  label="Quantity"
                  value={(detailLive ?? detailOrder).quantity.toLocaleString()}
                />
                <DetailField
                  label="Charge"
                  value={`$${(detailLive ?? detailOrder).charge.toFixed(4)}`}
                />
                <DetailField label="Currency" value={(detailLive ?? detailOrder).currency} />
                <DetailField
                  label="Start Count"
                  value={(detailLive ?? detailOrder).start_count || '—'}
                />
                <DetailField label="Current" value={computeCurrent(detailLive ?? detailOrder)} />
                <DetailField label="Remains" value={(detailLive ?? detailOrder).remains || '—'} />
                <DetailField label="Created" value={formatDate((detailLive ?? detailOrder).created_at)} />
              </div>
              <button
                onClick={refreshDetail}
                disabled={detailLoading}
                className="flex items-center gap-2 text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                {detailLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh from Provider
              </button>
            </>
          )}
        </Modal>
      )}

      {/* Edit Link */}
      {editLinkOrder && (
        <Modal title="Edit Link" onClose={() => setEditLinkOrder(null)}>
          <p className="text-xs text-gray-500 mb-4">Order {shortId(editLinkOrder.id)}</p>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Link</label>
          <input
            type="text"
            value={editLinkValue}
            onChange={(e) => setEditLinkValue(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
          />
          {actionError && <p className="text-sm text-red-600 mb-3">{actionError}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditLinkOrder(null)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <SaveButton
              loading={actionLoading}
              onClick={() =>
                handlePatch(
                  `${API_ENDPOINTS.ADMIN_ORDERS}/${editLinkOrder.id}/link`,
                  { link: editLinkValue },
                  () => setEditLinkOrder(null),
                )
              }
            />
          </div>
        </Modal>
      )}

      {/* Edit Service */}
      {editServiceOrder && (
        <Modal title="Edit Service" onClose={() => setEditServiceOrder(null)}>
          <p className="text-xs text-gray-500 mb-4">Order {shortId(editServiceOrder.id)}</p>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Service</label>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
          >
            <option value="">Select a service...</option>
            {adminServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.category_name})
              </option>
            ))}
          </select>
          {actionError && <p className="text-sm text-red-600 mb-3">{actionError}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditServiceOrder(null)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <SaveButton
              loading={actionLoading}
              disabled={!selectedServiceId}
              onClick={() => {
                const svc = adminServices.find((s) => s.id === selectedServiceId);
                if (!svc) return;
                handlePatch(
                  `${API_ENDPOINTS.ADMIN_ORDERS}/${editServiceOrder.id}/service`,
                  { service_id: svc.id, service_name: svc.name },
                  () => setEditServiceOrder(null),
                );
              }}
            />
          </div>
        </Modal>
      )}

      {/* Set Start Count */}
      {startCountOrder && (
        <Modal title="Set Start Count" onClose={() => setStartCountOrder(null)}>
          <p className="text-xs text-gray-500 mb-4">Order {shortId(startCountOrder.id)}</p>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Count</label>
          <input
            type="number"
            min="0"
            value={startCountValue}
            onChange={(e) => setStartCountValue(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
          />
          {actionError && <p className="text-sm text-red-600 mb-3">{actionError}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setStartCountOrder(null)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <SaveButton
              loading={actionLoading}
              onClick={() =>
                handlePatch(
                  `${API_ENDPOINTS.ADMIN_ORDERS}/${startCountOrder.id}/start-count`,
                  { value: startCountValue },
                  () => setStartCountOrder(null),
                )
              }
            />
          </div>
        </Modal>
      )}

      {/* Set Remains */}
      {remainsOrder && (
        <Modal title="Set Remains" onClose={() => setRemainsOrder(null)}>
          <p className="text-xs text-gray-500 mb-4">Order {shortId(remainsOrder.id)}</p>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remains</label>
          <input
            type="number"
            min="0"
            value={remainsValue}
            onChange={(e) => setRemainsValue(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
          />
          {actionError && <p className="text-sm text-red-600 mb-3">{actionError}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRemainsOrder(null)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <SaveButton
              loading={actionLoading}
              onClick={() =>
                handlePatch(
                  `${API_ENDPOINTS.ADMIN_ORDERS}/${remainsOrder.id}/remains`,
                  { value: remainsValue },
                  () => setRemainsOrder(null),
                )
              }
            />
          </div>
        </Modal>
      )}

      {/* Set Partial */}
      {partialOrder && (
        <Modal title="Set Partial" onClose={() => setPartialOrder(null)}>
          <p className="text-xs text-gray-500 mb-1">Order {shortId(partialOrder.id)}</p>
          <p className="text-xs text-amber-600 mb-4">
            Sets order status to <strong>Partial</strong> with the given remains count.
          </p>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remains</label>
          <input
            type="number"
            min="0"
            value={partialValue}
            onChange={(e) => setPartialValue(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
          />
          {actionError && <p className="text-sm text-red-600 mb-3">{actionError}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setPartialOrder(null)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <SaveButton
              loading={actionLoading}
              label="Set Partial"
              color="bg-orange-500 hover:bg-orange-600"
              onClick={() =>
                handlePatch(
                  `${API_ENDPOINTS.ADMIN_ORDERS}/${partialOrder.id}/partial`,
                  { remains: partialValue },
                  () => setPartialOrder(null),
                )
              }
            />
          </div>
        </Modal>
      )}

      {/* Change Status */}
      {statusOrder && (
        <Modal title="Change Status" onClose={() => setStatusOrder(null)}>
          <p className="text-xs text-gray-500 mb-4">Order {shortId(statusOrder.id)}</p>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {actionError && <p className="text-sm text-red-600 mb-3">{actionError}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setStatusOrder(null)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <SaveButton
              loading={actionLoading}
              onClick={() =>
                handlePatch(
                  `${API_ENDPOINTS.ADMIN_ORDERS}/${statusOrder.id}/status`,
                  { status: statusValue },
                  () => setStatusOrder(null),
                )
              }
            />
          </div>
        </Modal>
      )}

      {/* Cancel & Refund */}
      {cancelOrder && (
        <Modal title="Cancel & Refund" onClose={() => setCancelOrder(null)}>
          <p className="text-sm text-gray-700 mb-1">
            Order <strong>{shortId(cancelOrder.id)}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-5">
            A cancel request will be sent to the provider. Choose how to mark the order in your
            system.
          </p>
          {actionError && <p className="text-sm text-red-600 mb-3">{actionError}</p>}
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => setCancelOrder(null)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <SaveButton
              loading={actionLoading}
              label="Cancel Order"
              color="bg-red-500 hover:bg-red-600"
              onClick={() =>
                handlePost(
                  `${API_ENDPOINTS.ADMIN_ORDERS}/${cancelOrder.id}/cancel`,
                  () => setCancelOrder(null),
                )
              }
            />
            <SaveButton
              loading={actionLoading}
              label="Refund Order"
              color="bg-purple-500 hover:bg-purple-600"
              onClick={() =>
                handlePost(
                  `${API_ENDPOINTS.ADMIN_ORDERS}/${cancelOrder.id}/refund`,
                  () => setCancelOrder(null),
                )
              }
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminOrdersPage;
