import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

/**
 * Notification Provider
 * Centralized notification state management with real-time socket updates
 * 
 * Features:
 * - Auto-fetches unread count on mount
 * - Listens to socket `notification` events and updates in real-time
 * - Provides toast rendering for incoming notifications
 * - Exposes markAsRead, markAllAsRead, fetchNotifications
 */
export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const isDemo = localStorage.getItem('kaamsetu_token') === 'demo_token' || !user?._id;

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (page = 1) => {
    if (isDemo) {
      // Demo notifications
      setNotifications([
        {
          _id: 'n1', type: 'hire_request', title: '📩 New Hire Request',
          message: 'BuildRight Construction wants to hire you for "Site Work" — ₹750/day',
          read: false, createdAt: new Date(Date.now() - 300000),
          data: { action: 'hire_request', hireRequestId: 'hr1', offeredPay: 750 },
        },
        {
          _id: 'n2', type: 'application_status', title: '🎉 Application Accepted!',
          message: 'Your application for "Office Cleaning" has been accepted!',
          read: false, createdAt: new Date(Date.now() - 3600000),
          data: {},
        },
        {
          _id: 'n3', type: 'payment', title: '💰 Payment Received',
          message: '₹700 has been credited to your wallet for completed work.',
          read: true, createdAt: new Date(Date.now() - 86400000),
          data: {},
        },
      ]);
      setUnreadCount(2);
      return;
    }

    try {
      setLoading(true);
      const { notificationsAPI } = await import('../api/endpoints');
      const [notifRes, countRes] = await Promise.all([
        notificationsAPI.getAll({ page, limit: 20 }),
        notificationsAPI.getUnreadCount(),
      ]);
      
      if (page === 1) {
        setNotifications(notifRes.data?.data || []);
      } else {
        setNotifications(prev => [...prev, ...(notifRes.data?.data || [])]);
      }
      setUnreadCount(countRes.data?.data?.count || 0);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (isDemo) return;
    try {
      const { notificationsAPI } = await import('../api/endpoints');
      const res = await notificationsAPI.getUnreadCount();
      setUnreadCount(res.data?.data?.count || 0);
    } catch (e) {
      console.error('Failed to fetch unread count:', e);
    }
  }, [isDemo]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id) => {
    if (isDemo) {
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }

    try {
      const { notificationsAPI } = await import('../api/endpoints');
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  }, [isDemo]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (isDemo) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      return;
    }

    try {
      const { notificationsAPI } = await import('../api/endpoints');
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  }, [isDemo]);

  // Delete notification
  const deleteNotification = useCallback(async (id) => {
    const wasUnread = notifications.find(n => n._id === id && !n.read);
    setNotifications(prev => prev.filter(n => n._id !== id));
    if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));

    if (isDemo) return;

    try {
      const { notificationsAPI } = await import('../api/endpoints');
      await notificationsAPI.delete(id);
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  }, [isDemo, notifications]);

  // Fetch on mount
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Listen to real-time socket notifications
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      // Add to notifications list
      const newNotif = {
        _id: `notif_${Date.now()}`,
        type: data.type || 'system',
        title: data.title || 'Notification',
        message: data.message || '',
        data: data.data || {},
        read: false,
        createdAt: new Date(),
      };

      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast with appropriate icon
      const icons = {
        hire_request: '📩',
        hire_accepted: '✅',
        hire_rejected: '❌',
        application_status: '🎉',
        job_application: '📋',
        message: '💬',
        payment: '💰',
        rating: '⭐',
        system: '🔔',
      };

      toast(data.message || 'New notification!', {
        icon: icons[data.type] || '🔔',
        duration: 4000,
        style: {
          borderRadius: '16px',
          padding: '14px 20px',
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '380px',
        },
      });
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        panelOpen,
        setPanelOpen,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export default NotificationContext;
