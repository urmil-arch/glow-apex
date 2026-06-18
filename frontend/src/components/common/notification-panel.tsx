import { Bell, X, MessageSquare, Ticket, Mail, CheckCircle, ListTodo, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface NotifItem {
  id: string;
  type: 'new_ticket' | 'ticket_reply' | 'new_message' | 'new_task' | 'admin_notification';
  title: string;
  body: string;
  href: string;
  created_at: string;
  backend_id?: string;
}

interface NotificationPanelProps {
  items: NotifItem[];
  onClose: () => void;
  onClearAll: () => void;
  onRemove: (id: string) => void;
}

const toUtc = (dt: string): string =>
  /[Zz]|[+\-]\d{2}:\d{2}$/.test(dt) ? dt : dt + 'Z';

const timeAgo = (dt: string): string => {
  const diff = Date.now() - new Date(toUtc(dt)).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const formatIST = (dt: string): string =>
  new Date(toUtc(dt)).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const TYPE_ICON: Record<string, { bg: string; icon: React.ReactNode }> = {
  new_ticket:         { bg: 'bg-teal-100',    icon: <Ticket        className="w-4 h-4 text-teal-600"    /> },
  ticket_reply:       { bg: 'bg-blue-100',    icon: <MessageSquare className="w-4 h-4 text-blue-600"    /> },
  new_message:        { bg: 'bg-orange-100',  icon: <Mail          className="w-4 h-4 text-orange-500"  /> },
  new_task:           { bg: 'bg-violet-100',  icon: <ListTodo      className="w-4 h-4 text-violet-600"  /> },
  admin_notification: { bg: 'bg-emerald-100', icon: <Megaphone     className="w-4 h-4 text-emerald-600" /> },
};
const DEFAULT_TYPE = { bg: 'bg-gray-100', icon: <Bell className="w-4 h-4 text-gray-500" /> };

const NotificationPanel = ({ items, onClose, onClearAll, onRemove }: NotificationPanelProps) => {
  const navigate = useNavigate();

  const handleClick = (item: NotifItem) => {
    navigate(item.href);
    onRemove(item.id);
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-700" />
          <p className="font-semibold text-sm text-gray-900">Notifications</p>
          {items.length > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
              {items.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear all
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <CheckCircle className="w-9 h-9 text-gray-300" />
            <p className="text-sm text-gray-400">All caught up!</p>
          </div>
        ) : (
          items.map(item => {
            const { bg, icon } = TYPE_ICON[item.type] ?? DEFAULT_TYPE;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item)}
                className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left border-l-2 border-emerald-400 bg-emerald-50/30"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${bg}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{item.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatIST(item.created_at)} IST &middot; {timeAgo(item.created_at)}</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100">
        <button
          onClick={() => { navigate('/dashboard/notifications'); onClose(); }}
          className="w-full text-center text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationPanel;
