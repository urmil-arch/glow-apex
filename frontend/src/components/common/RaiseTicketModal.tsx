import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import axios from "axios";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";

type TicketType = "order_related" | "payment_related" | "other";

interface RaiseTicketModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialType?: TicketType;
  initialOrderId?: string;
}

const TYPE_LABELS: Record<TicketType, string> = {
  order_related: "Order Related",
  payment_related: "Payment Related",
  other: "Other",
};

const RaiseTicketModal: React.FC<RaiseTicketModalProps> = ({
  onClose,
  onSuccess,
  initialType,
  initialOrderId,
}) => {
  const locked = initialType !== undefined;
  const [type, setType] = useState<TicketType>(initialType ?? "order_related");
  const [orderId, setOrderId] = useState(initialOrderId ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post(API_ENDPOINTS.TICKETS, { type, subject, message, order_id: orderId });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail ?? "Failed to create ticket.");
      } else {
        setError("Failed to create ticket.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Raise Support Ticket</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            {locked ? (
              <p className="text-sm text-gray-800 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                {TYPE_LABELS[type]}
              </p>
            ) : (
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TicketType)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="order_related">Order Related</option>
                <option value="payment_related">Payment Related</option>
                <option value="other">Other</option>
              </select>
            )}
          </div>

          {(type === "order_related" || type === "payment_related") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
              {locked ? (
                <p className="text-xs font-mono text-gray-700 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg break-all">
                  {orderId}
                </p>
              ) : (
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Paste your order ID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue in detail"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Submitting…" : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RaiseTicketModal;
