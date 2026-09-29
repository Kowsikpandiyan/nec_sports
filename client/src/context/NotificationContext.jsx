import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import api from '../lib/axios';
import { socket } from '../lib/socket';
import toast from 'react-hot-toast';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications?limit=20');
      if (response.data && response.data.data) {
        setNotifications(response.data.data);
        const unread = response.data.data.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to load user notifications: ', err.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      const handleNotificationPush = (notif) => {
        // Add to state if relevant to user (either public broadcast (user=null) or matching user id)
        if (!notif.user || notif.user === user._id) {
          setNotifications((prev) => [notif, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast.success(`🔔 ${notif.title}: ${notif.message}`, { duration: 4000 });
        }
      };

      socket.on('notification:push', handleNotificationPush);

      return () => {
        socket.off('notification:push', handleNotificationPush);
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
