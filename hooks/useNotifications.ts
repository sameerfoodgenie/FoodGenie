import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import {
  registerForPushNotifications,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} from '../services/notificationService';

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  actor_user_id?: string;
  post_id?: string;
  actor?: { username: string };
}

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // Register push token
  useEffect(() => {
    if (!userId) return;
    registerForPushNotifications(userId);
  }, [userId]);

  // Listen for incoming notifications
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Refresh notifications when one arrives
      if (userId) {
        loadNotifications();
        loadUnreadCount();
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.postId) {
        router.push({ pathname: '/food-detail', params: { postId: data.postId } });
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [userId]);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await fetchNotifications(userId);
    setNotifications(data);
    setLoading(false);
  }, [userId]);

  const loadUnreadCount = useCallback(async () => {
    if (!userId) return;
    const count = await getUnreadCount(userId);
    setUnreadCount(count);
  }, [userId]);

  const markRead = useCallback(async (notificationId: string) => {
    await markNotificationRead(notificationId);
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await markAllNotificationsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [userId]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!userId) return;
    loadNotifications();
    loadUnreadCount();
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markRead,
    markAllRead,
    refresh: loadNotifications,
  };
}
