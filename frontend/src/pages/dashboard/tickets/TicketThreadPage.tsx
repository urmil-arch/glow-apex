import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Send, ShieldCheck, User } from 'lucide-react';
import axios from 'axios';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

interface TicketMessage {
  sender: 'user' | 'admin';
  text: string;
  created_at: string;
}

interface Ticket {
  id: string;
  type: 'order_related' | 'payment_related' | 'other';
  subject: string;
  order_id: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: TicketMessage[];
  created_at: string;
  updated_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_CLASS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

const TYPE_LABEL: Record<string, string> = {
  order_related: 'Order Related',
  payment_related: 'Payment Related',
  other: 'Other',
};

const TicketThreadPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { clearUnreadDot } = useOutletContext<{ clearUnreadDot: () => void }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    if (!ticketId) return;
    try {
      const res = await api.get(`${API_ENDPOINTS.TICKETS}/${ticketId}`);
      setTicket(res.data);
      clearUnreadDot();
    } catch {
      setError('Failed to load ticket.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !ticketId) return;
    setSending(true);
    setSendError('');
    try {
      const res = await api.post(`${API_ENDPOINTS.TICKETS}/${ticketId}/reply`, { text: reply.trim() });
      setTicket(res.data);
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

  const isClosed = ticket?.status === 'resolved' || ticket?.status === 'closed';

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (error || !ticket) {
    return <div className="text-center py-20 text-red-500">{error || 'Ticket not found.'}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/dashboard/tickets')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">{ticket.subject}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-gray-400">{TYPE_LABEL[ticket.type]}</span>
                {ticket.order_id && (
                  <span className="text-xs text-gray-400 font-mono">#{ticket.order_id.slice(-8)}</span>
                )}
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_CLASS[ticket.status]}`}>
              {STATUS_LABEL[ticket.status]}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
        {ticket.messages.map((msg, i) => {
          const isAdmin = msg.sender === 'admin';
          const date = new Date(msg.created_at).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          return (
            <div key={i} className={`flex gap-3 ${isAdmin ? '' : 'flex-row-reverse'}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isAdmin
                    ? 'bg-gradient-to-br from-teal-500 to-emerald-500'
                    : 'bg-gray-200'
                }`}
              >
                {isAdmin ? (
                  <ShieldCheck className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <div className={`max-w-[75%] ${isAdmin ? '' : 'items-end flex flex-col'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    isAdmin
                      ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                      : 'bg-teal-600 text-white rounded-tr-sm'
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
      {isClosed ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 text-center">
          This ticket is {ticket.status}. You cannot reply to it.
        </div>
      ) : (
        <form onSubmit={handleReply} className="bg-white border border-gray-200 rounded-xl p-3 flex gap-2">
          <textarea
            rows={2}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply…"
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
      )}
      {sendError && (
        <p className="text-xs text-red-500 mt-2">{sendError}</p>
      )}
    </div>
  );
};

export default TicketThreadPage;
