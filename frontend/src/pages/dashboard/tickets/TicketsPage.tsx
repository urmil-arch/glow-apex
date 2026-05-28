import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Ticket, Loader2, ChevronRight, X } from 'lucide-react';
import axios from 'axios';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

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

interface NewTicketForm {
  type: 'order_related' | 'payment_related' | 'other';
  subject: string;
  message: string;
  order_id: string;
}

const TicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewTicketForm>({
    type: 'order_related',
    subject: '',
    message: '',
    order_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.post(API_ENDPOINTS.TICKETS, form);
      setShowModal(false);
      setForm({ type: 'order_related', subject: '', message: '', order_id: '' });
      fetchTickets();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setSubmitError(err.response?.data?.detail ?? 'Failed to create ticket.');
      } else {
        setSubmitError('Failed to create ticket.');
      }
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* Create Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">New Support Ticket</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as NewTicketForm['type'] })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="order_related">Order Related</option>
                  <option value="payment_related">Payment Related</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {(form.type === 'order_related' || form.type === 'payment_related') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order ID <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.order_id}
                    onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                    placeholder="Paste your order ID"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief summary of your issue"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Describe your issue in detail"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                />
              </div>

              {submitError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {submitError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? 'Submitting…' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsPage;
