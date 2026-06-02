import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Ticket, Loader2, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';
import RaiseTicketModal from '@/components/common/RaiseTicketModal';

interface TicketSummary {
  id: string;
  type: 'order_related' | 'payment_related' | 'other';
  subject: string;
  order_id: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  user_has_unread: boolean;
  messages: { sender: string; text: string; created_at: string }[];
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

const TicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchTickets = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get(API_ENDPOINTS.TICKETS);
      setTickets(res.data.tickets ?? []);
    } catch {
      setError('Failed to load tickets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const lastMessage = (t: TicketSummary) => t.messages[t.messages.length - 1];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Support Tickets</h2>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage your support requests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">{error}</div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20 text-center">
          <Ticket className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No tickets yet</p>
          <p className="text-gray-400 text-sm mt-1">Create a ticket if you need help with an order or payment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const last = lastMessage(t);
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (t.user_has_unread) {
                    setTickets((prev) =>
                      prev.map((x) => x.id === t.id ? { ...x, user_has_unread: false } : x)
                    );
                  }
                  navigate(`/dashboard/tickets/${t.id}`);
                }}
                className={`w-full rounded-xl border hover:border-teal-300 hover:shadow-sm transition-all p-4 text-left flex items-center gap-4 ${
                  t.user_has_unread ? 'bg-teal-50 border-teal-200' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {t.user_has_unread && (
                      <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                    <span className="text-xs text-gray-400">{TYPE_LABEL[t.type]}</span>
                    {t.order_id && (
                      <span className="text-xs text-gray-400 font-mono">#{t.order_id.slice(-8)}</span>
                    )}
                  </div>
                  <p className={`text-sm truncate ${t.user_has_unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                    {t.subject}
                  </p>
                  {last && (
                    <p className={`text-xs truncate mt-0.5 ${t.user_has_unread && last.sender === 'admin' ? 'text-teal-600 font-medium' : 'text-gray-400'}`}>
                      {last.sender === 'admin' ? 'Support: ' : 'You: '}{last.text}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {showModal && (
        <RaiseTicketModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchTickets}
        />
      )}
    </div>
  );
};

export default TicketsPage;
