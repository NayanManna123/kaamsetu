import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, CheckCheck, Trash2, Inbox } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { timeAgo } from '../utils/helpers';

/**
 * Notification Panel
 * Slide-out panel triggered from Navbar bell icon
 * 
 * Features:
 * - Real-time notification list with unread indicators
 * - Action buttons for hire requests (Accept/Reject inline)
 * - Mark all as read
 * - Delete individual notifications
 * - Paginated loading
 */
const NotificationPanel = () => {
  const {
    notifications,
    unreadCount,
    loading,
    panelOpen,
    setPanelOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications();

  const [page, setPage] = useState(1);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchNotifications(next);
  };

  const typeIcons = {
    hire_request: '📩',
    hire_accepted: '✅',
    hire_rejected: '❌',
    application_status: '🎉',
    job_application: '📋',
    job_update: '📢',
    message: '💬',
    payment: '💰',
    rating: '⭐',
    system: '🔔',
  };

  const typeBgColors = {
    hire_request: 'bg-blue-50 border-blue-100',
    hire_accepted: 'bg-green-50 border-green-100',
    hire_rejected: 'bg-red-50 border-red-100',
    application_status: 'bg-emerald-50 border-emerald-100',
    job_application: 'bg-indigo-50 border-indigo-100',
    message: 'bg-purple-50 border-purple-100',
    payment: 'bg-amber-50 border-amber-100',
    rating: 'bg-yellow-50 border-yellow-100',
    system: 'bg-surface-50 border-surface-100',
  };

  if (!panelOpen) return null;

  return (
    <AnimatePresence>
      {panelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={() => setPanelOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-bold text-surface-900">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-danger-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Read all
                  </button>
                )}
                <button
                  onClick={() => setPanelOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-surface-100 transition-colors"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-surface-400 gap-3">
                  <Inbox className="w-12 h-12 text-surface-300" />
                  <p className="text-sm font-medium">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-50">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`px-5 py-4 hover:bg-surface-50/50 transition-colors cursor-pointer relative group ${
                        !notif.read ? 'bg-primary-50/30' : ''
                      }`}
                      onClick={() => !notif.read && markAsRead(notif._id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Unread indicator */}
                        {!notif.read && (
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-500 rounded-full" />
                        )}

                        {/* Icon */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border ${
                            typeBgColors[notif.type] || typeBgColors.system
                          }`}
                        >
                          {typeIcons[notif.type] || '🔔'}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${!notif.read ? 'font-semibold text-surface-900' : 'text-surface-700'}`}>
                            {notif.message}
                          </p>
                          <p className="text-[11px] text-surface-400 mt-1">
                            {timeAgo(notif.createdAt)}
                          </p>
                        </div>

                        {/* Delete button (on hover) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif._id);
                          }}
                          className="p-1 rounded-lg hover:bg-red-50 text-surface-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {/* Load more */}
                  {notifications.length >= 20 && (
                    <button
                      onClick={loadMore}
                      className="w-full py-3 text-sm text-primary-600 font-semibold hover:bg-primary-50 transition-colors"
                    >
                      Load more
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;
