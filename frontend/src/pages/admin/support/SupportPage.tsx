import React, { useEffect, useRef, useState } from 'react';
import {
  Loader2,
  MessageSquare,
  Ticket,
  Send,
  ChevronDown,
  Mail,
  X,
  ShieldCheck,
  User,
} from 'lucide-react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

interface AdminOutletContext {
  clearUnreadDot: () => void;
}

// ---- Shared types ----

interface TicketMessage {
  sender: 'user' | 'admin';
  text: string;
  created_at: string;
}

interface TicketItem {
  id: string;
  type: 'order_related' | 'payment_related' | 'other';
  subject: string;
  order_id: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  user_email: string;
  user_username: string;
  admin_has_unread: boolean;
  messages: TicketMessage[];
  created_at: string;
  updated_at: string;
}

interface ContactMsg {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

// ---- Helpers ----

const TICKET_STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const TICKET_STATUS_CLASS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

const TYPE_LABEL: Record<string, string> = {
  order_related: 'Order Related',
  payment_related: 'Payment Related',
  other: 'Other',
  support: 'Support',
  business: 'Business',
};

// ---- Ticket thread panel ----

interface TicketPanelProps {
  ticket: TicketItem;
  onClose: () => void;
  onUpdate: (updated: TicketItem) => void;
}

const TicketPanel: React.FC<TicketPanelProps> = ({ ticket, onClose, onUpdate }) => {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [statusChanging, setStatusChanging] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statusOpen) return;
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusOpen]);

  // Fetch the ticket on open — this clears admin_has_unread on the server
  // and propagates the updated state back to the parent list.
  useEffect(() => {
    api.get(`${API_ENDPOINTS.ADMIN_SUPPORT_TICKETS}/${ticket.id}`)
      .then((res) => onUpdate(res.data))
      .catch(() => {/* non-critical — panel still works with prop data */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket.messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setSendError('');
    try {
      const res = await api.post(`${API_ENDPOINTS.ADMIN_SUPPORT_TICKETS}/${ticket.id}/reply`, {
        text: reply.trim(),
      });
      onUpdate(res.data);
      setReply('');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setSendError(err.response?.data?.detail ?? 'Failed to send reply.');
      } else {
        setSendError('Failed to send reply.');
      }
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (newStatus: string) => {
    setStatusChanging(true);
    try {
      await api.patch(`${API_ENDPOINTS.ADMIN_SUPPORT_TICKETS}/${ticket.id}/status`, {
        status: newStatus,
      });
      onUpdate({ ...ticket, status: newStatus as TicketItem['status'] });
      setStatusOpen(false);
    } catch {
      // silent — status badge stays as-is
    } finally {
      setStatusChanging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30" onClick={onClose}>
      <div className="w-full max-w-lg h-full bg-white flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200">
          <div className="min-w-0 flex-1 pr-3">
            <p className="font-semibold text-gray-900 truncate">{ticket.subject}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
              <span>{ticket.user_email}</span>
              <span>·</span>
              <span>{TYPE_LABEL[ticket.type]}</span>
              {ticket.order_id && <span className="font-mono">#{ticket.order_id.slice(-8)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status dropdown */}
            <div className="relative" ref={statusRef}>
              <button
                disabled={statusChanging}
                onClick={() => setStatusOpen(o => !o)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer ${TICKET_STATUS_CLASS[ticket.status]}`}
              >
                {TICKET_STATUS_LABEL[ticket.status]}
                <ChevronDown className={`w-3 h-3 transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
              </button>
              {statusOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-10">
                  {(['open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStatus(s)}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                        ticket.status === s
                          ? 'font-semibold text-teal-700 bg-teal-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {TICKET_STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {ticket.messages.map((msg, i) => {
            const isAdmin = msg.sender === 'admin';
            const date = new Date(msg.created_at).toLocaleString(undefined, {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            });
            return (
              <div key={i} className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isAdmin ? 'bg-gradient-to-br from-teal-500 to-emerald-500' : 'bg-gray-200'
                    }`}
                  >
                    {isAdmin ? <ShieldCheck className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-gray-500" />}
                  </div>
                  <span className="text-[10px] text-gray-400 leading-none whitespace-nowrap">
                    {isAdmin ? 'Admin' : ticket.user_username}
                  </span>
                </div>
                <div className={`max-w-[75%] ${isAdmin ? 'items-end flex flex-col' : ''}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      isAdmin
                        ? 'bg-teal-600 text-white rounded-tr-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 px-1">{date}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply box */}
        <div className="px-5 pb-5 pt-3 border-t border-gray-200">
          {sendError && <p className="text-xs text-red-500 mb-2">{sendError}</p>}
          <form onSubmit={handleReply} className="flex gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
            <textarea
              rows={2}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply to user…"
              className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 outline-none border-0 bg-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReply(e as unknown as React.FormEvent);
                }
              }}
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="self-end w-9 h-9 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white flex items-center justify-center transition-colors flex-shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ---- Contact message detail modal ----

interface ContactMsgModalProps {
  msg: ContactMsg;
  onClose: () => void;
  onRead: (id: string) => void;
}

const ContactMsgModal: React.FC<ContactMsgModalProps> = ({ msg, onClose, onRead }) => {
  useEffect(() => {
    if (!msg.is_read) {
      api.post(`${API_ENDPOINTS.ADMIN_SUPPORT_MESSAGES}/${msg.id}/read`).then(() => {
        onRead(msg.id);
      }).catch(() => {/* silent */});
    }
  }, [msg.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">{msg.subject}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{msg.name} · {msg.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{msg.type}</span>
            <span className="text-xs text-gray-400">
              {new Date(msg.created_at).toLocaleString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
        </div>
        <div className="px-6 pb-5">
          <a
            href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Mail className="w-4 h-4" />
            Reply via Email
          </a>
        </div>
      </div>
    </div>
  );
};

// ---- Main page ----

const SupportPage: React.FC = () => {
  const [tab, setTab] = useState<'tickets' | 'messages'>('tickets');

  // Tickets state
  const { clearUnreadDot } = useOutletContext<AdminOutletContext>();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [ticketStatusFilter, setTicketStatusFilter] = useState('');

  // Contact messages state
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(true);
  const [msgsError, setMsgsError] = useState('');
  const [selectedMsg, setSelectedMsg] = useState<ContactMsg | null>(null);
  const [msgReadFilter, setMsgReadFilter] = useState('');

  const fetchTickets = async () => {
    setTicketsLoading(true);
    setTicketsError('');
    try {
      const params = new URLSearchParams();
      if (ticketStatusFilter) params.set('status_filter', ticketStatusFilter);
      const res = await api.get(`${API_ENDPOINTS.ADMIN_SUPPORT_TICKETS}?${params}`);
      setTickets(res.data.tickets ?? []);
    } catch {
      setTicketsError('Failed to load tickets.');
    } finally {
      setTicketsLoading(false);
    }
  };

  const fetchMessages = async () => {
    setMsgsLoading(true);
    setMsgsError('');
    try {
      const params = new URLSearchParams();
      if (msgReadFilter) params.set('is_read', msgReadFilter);
      const res = await api.get(`${API_ENDPOINTS.ADMIN_SUPPORT_MESSAGES}?${params}`);
      setMessages(res.data.messages ?? []);
    } catch {
      setMsgsError('Failed to load messages.');
    } finally {
      setMsgsLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [ticketStatusFilter]);
  useEffect(() => { fetchMessages(); }, [msgReadFilter]);

  const unreadCount = messages.filter((m) => !m.is_read).length;
  const openTicketCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const unreadTicketCount = tickets.filter((t) => t.admin_has_unread).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support</h1>
        <p className="text-gray-500 text-sm mt-1">Manage user tickets and contact form messages</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'tickets' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Ticket className="w-4 h-4" />
          Tickets
          {unreadTicketCount > 0 ? (
            <span className="ml-1 bg-teal-100 text-teal-700 text-xs px-1.5 py-0.5 rounded-full font-medium">
              {unreadTicketCount} new
            </span>
          ) : openTicketCount > 0 ? (
            <span className="ml-1 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full font-medium">
              {openTicketCount}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setTab('messages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'messages' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Contact Messages
          {unreadCount > 0 && (
            <span className="ml-1 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full font-medium">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* --- Tickets tab --- */}
      {tab === 'tickets' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={ticketStatusFilter}
              onChange={(e) => setTicketStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {ticketsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-7 h-7 text-teal-500 animate-spin" />
            </div>
          ) : ticketsError ? (
            <div className="text-center py-20 text-red-500">{ticketsError}</div>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center py-16 text-center">
              <Ticket className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-gray-500">No tickets found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Subject</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">User</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`border-b border-gray-50 cursor-pointer transition-colors ${
                        t.admin_has_unread ? 'bg-teal-50 hover:bg-teal-100/60' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {t.admin_has_unread && (
                            <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className={`truncate max-w-[200px] ${t.admin_has_unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                              {t.subject}
                            </p>
                            {t.order_id && (
                              <p className="text-xs text-gray-400 font-mono">#{t.order_id.slice(-8)}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 py-3 hidden md:table-cell truncate max-w-[160px] ${t.admin_has_unread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                        {t.user_email}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                        {TYPE_LABEL[t.type]}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TICKET_STATUS_CLASS[t.status]}`}>
                          {TICKET_STATUS_LABEL[t.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                        {new Date(t.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- Messages tab --- */}
      {tab === 'messages' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={msgReadFilter}
              onChange={(e) => setMsgReadFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>

          {msgsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-7 h-7 text-teal-500 animate-spin" />
            </div>
          ) : msgsError ? (
            <div className="text-center py-20 text-red-500">{msgsError}</div>
          ) : messages.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center py-16 text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-gray-500">No messages found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-2"></th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">From</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Subject</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedMsg(m)}
                      className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !m.is_read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        {!m.is_read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className={`truncate max-w-[140px] ${!m.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                          {m.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-[140px]">{m.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`truncate max-w-[200px] ${!m.is_read ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                          {m.subject}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 capitalize hidden sm:table-cell">{m.type}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Ticket slide-over panel */}
      {selectedTicket && (
        <TicketPanel
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={(updated) => {
            setSelectedTicket(updated);
            setTickets((prev) => {
              const next = prev.map((t) => (t.id === updated.id ? updated : t));
              if (!next.some((t) => t.admin_has_unread)) clearUnreadDot();
              return next;
            });
          }}
        />
      )}

      {/* Contact message modal */}
      {selectedMsg && (
        <ContactMsgModal
          msg={selectedMsg}
          onClose={() => setSelectedMsg(null)}
          onRead={(id) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
            );
            setSelectedMsg((prev) => (prev && prev.id === id ? { ...prev, is_read: true } : prev));
          }}
        />
      )}
    </div>
  );
};

export default SupportPage;
