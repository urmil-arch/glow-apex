import { Bell, X, MessageSquare, Ticket, Mail, CheckCircle, ListTodo, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface NotifItem {
  id: string;
  type: 'new_ticket' | 'ticket_reply' | 'new_message' | 'new_task' | 'admin_notification';
  title: string;
  body: string;
  href: string;
  created_at: string;
  is_read?: boolean;
  backend_id?: string;
}

interface NotificationPanelProps {
  items: NotifItem[];
  onClose: () => void;
  onClearAll: () => void;
  onRemove: (id: string) => void;
  onRead?: (backendId: string) => void;
}

const timeAgo = (dt: string): string => {
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const NotificationPanel = ({ items, onClose, onClearAll, onRemove, onRead }: NotificationPanelProps) => {
  const navigate = useNavigate();

  const handleClick = (item: NotifItem) => {
    if (item.type === 'admin_notification' && item.backend_id) {
      onRead?.(item.backend_id);
    }
    navigate(item.href);
    onRemove(item.id);
    onClose();
  };

  const isUnread = (item: NotifItem) =>
    item.type === 'admin_notification' ? item.is_read === false : true;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-700" />
          <p className="font-semibold text-sm text-gray-900">Notifications</p>
          {items.filter(isUnread).length > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
              {items.filter(isUnread).length}
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
            const unread = isUnread(item);
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left ${
                  unread && item.type === 'admin_notification' ? 'bg-emerald-50/40 border-l-2 border-emerald-400' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    item.type === 'new_ticket'         ? 'bg-teal-100'    :
                    item.type === 'new_message'        ? 'bg-orange-100'  :
                    item.type === 'new_task'           ? 'bg-violet-100'  :
                    item.type === 'admin_notification' ? 'bg-emerald-100' :
                    'bg-blue-100'
                  }`}
                >
                  {item.type === 'new_ticket'         ? <Ticket        className="w-4 h-4 text-teal-600"    /> :
                   item.type === 'new_message'        ? <Mail          className="w-4 h-4 text-orange-500"  /> :
                   item.type === 'new_task'           ? <ListTodo      className="w-4 h-4 text-violet-600"  /> :
                   item.type === 'admin_notification' ? <Megaphone     className="w-4 h-4 text-emerald-600" /> :
                                                       <MessageSquare className="w-4 h-4 text-blue-600"    />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{item.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(item.created_at)}</p>
                </div>
                {unread && item.type === 'admin_notification' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer — view all */}
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
