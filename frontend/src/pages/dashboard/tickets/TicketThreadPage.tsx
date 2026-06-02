import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, Info, Loader2, Send, ShieldCheck, User } from 'lucide-react';
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

type ChatItem =
  | { kind: 'message'; msg: TicketMessage; idx: number }
  | { kind: 'system'; text: string; id: string };

function buildChatItems(messages: TicketMessage[]): ChatItem[] {
  const items: ChatItem[] = [];
  let agentJoinInserted = false;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (msg.sender === 'admin' && !agentJoinInserted) {
      items.push({
        kind: 'system',
        text: 'A support executive has joined the conversation and will assist you shortly.',
        id: 'agent-join',
      });
      agentJoinInserted = true;
    }

    items.push({ kind: 'message', msg, idx: i });

    if (i === 0 && msg.sender === 'user') {
      items.push({
        kind: 'system',
        text: 'Your request has been received. Please wait while our support executive reviews your message.',
        id: 'waiting',
      });
    }
  }

  return items;
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

function fmtTime(iso: string) {
  const utc = iso && !iso.endsWith('Z') && !iso.includes('+') ? `${iso}Z` : iso;
  return new Date(utc).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

  const submitReply = async () => {
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

  const chatItems = buildChatItems(ticket.messages);

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Back link */}
      <button
        onClick={() => navigate('/dashboard/tickets')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tickets
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-3 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">{ticket.subject}</h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-gray-400">{TYPE_LABEL[ticket.type]}</span>
              {ticket.order_id && (
                <span className="text-xs text-gray-400 font-mono">#{ticket.order_id.slice(-8)}</span>
              )}
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${STATUS_CLASS[ticket.status]}`}>
            {STATUS_LABEL[ticket.status]}
          </span>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl border border-gray-200 px-4 py-4 space-y-2 min-h-0">
        {chatItems.map((item) => {
          if (item.kind === 'system') {
            return (
              <div key={item.id} className="flex justify-center my-3">
                <div className="flex items-center gap-1.5 bg-gray-200/70 text-gray-500 text-xs rounded-full px-4 py-1.5 max-w-xs text-center leading-snug">
                  <Info className="w-3 h-3 flex-shrink-0" />
                  {item.text}
                </div>
              </div>
            );
          }

          const { msg, idx } = item;
          const isAdmin = msg.sender === 'admin';

          return (
            <div
              key={idx}
              className={`flex items-end gap-2 ${isAdmin ? 'justify-start' : 'justify-end'}`}
            >
              {/* Admin avatar — left side */}
              {isAdmin && (
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-500 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              <div className={`flex flex-col max-w-[72%] ${isAdmin ? 'items-start' : 'items-end'}`}>
                {/* Sender label */}
                <span className="text-[10px] text-gray-400 mb-1 px-1">
                  {isAdmin ? 'Support' : 'You'}
                </span>

                {/* Bubble */}
                <div
                  className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    isAdmin
                      ? 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-none'
                      : 'bg-teal-600 text-white rounded-2xl rounded-br-none'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {fmtTime(msg.created_at)}
                </span>
              </div>

              {/* User avatar — right side */}
              {!isAdmin && (
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-200 mb-1">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      <div className="mt-3 flex-shrink-0">
        {isClosed ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 text-center">
            This ticket is {ticket.status}. You cannot reply to it.
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); submitReply(); }} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-end gap-3 shadow-sm">
            <textarea
              rows={2}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply…"
              className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitReply();
                }
              }}
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="w-9 h-9 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white flex items-center justify-center transition-colors flex-shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        )}
        {sendError && (
          <p className="text-xs text-red-500 mt-2 px-1">{sendError}</p>
        )}
      </div>
    </div>
  );
};

export default TicketThreadPage;
