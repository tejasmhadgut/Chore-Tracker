import { createContext, ReactNode, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import { NotificationDto, UnreadCountDto, NotificationListDto } from '../components/types/notifications';
import { axiosInstance } from '../services/axiosConfig';

interface NotificationContextType {
  unreadCount: number;
  notifications: NotificationDto[];
  isLoading: boolean;
  error: string | null;

  // Functions
  fetchNotifications: (page?: number, pageSize?: number) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  clearAllRead: () => Promise<void>;

  // Connection status
  isConnected: boolean;
}

const defaultContextValue: NotificationContextType = {
  unreadCount: 0,
  notifications: [],
  isLoading: false,
  error: null,
  fetchNotifications: async () => {},
  refreshUnreadCount: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  clearAllRead: async () => {},
  isConnected: false,
};

export const NotificationContext = createContext<NotificationContextType>(defaultContextValue);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const { user } = useAuth();
  const hubConnectionRef = useRef<HubConnection | null>(null);

  // Initialize SignalR connection
  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (hubConnectionRef.current?.state === 1) { // Connected state
        hubConnectionRef.current.stop();
      }
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    // Small delay to ensure auth context is fully initialized
    const timer = setTimeout(() => {
      setupSignalR();
    }, 500);

    return () => clearTimeout(timer);
  }, [user]);

  const setupSignalR = async () => {
    try {
      // Don't create new connection if one already exists
      if (hubConnectionRef.current?.state === 1) {
        return;
      }

      if (!user) {
        console.log('[NotificationContext] User not authenticated, skipping SignalR setup');
        return;
      }

        const connection = new HubConnectionBuilder()
          .withUrl(`${import.meta.env.VITE_API_URL}/choreHub`, {
            withCredentials: true,
            accessTokenFactory: () => {
              // Token will be sent via cookies from axiosConfig
              return '';
            }
          })
          .withAutomaticReconnect([0, 1000, 3000, 5000])
          .configureLogging(LogLevel.Warning)
          .build();

        // Handle real-time notifications
        connection.on('ReceiveNotification', (notification: NotificationDto) => {
          console.log('[NotificationContext] Received notification:', notification);
          // Add to beginning of list
          setNotifications(prev => [notification, ...prev]);
          // Increment unread count
          setUnreadCount(prev => prev + 1);
        });

        // Handle unread count updates
        connection.on('UpdateUnreadCount', (count: number) => {
          console.log('[NotificationContext] Updated unread count:', count);
          setUnreadCount(count);
        });

        // Handle connection state changes
        connection.onreconnected(() => {
          console.log('[NotificationContext] SignalR reconnected');
          setIsConnected(true);
          // Refresh data after reconnection
          refreshUnreadCount();
        });

        connection.onreconnecting(() => {
          console.log('[NotificationContext] SignalR reconnecting');
          setIsConnected(false);
        });

        connection.onclose(() => {
          console.log('[NotificationContext] SignalR disconnected');
          setIsConnected(false);
        });

        await connection.start();
        console.log('[NotificationContext] SignalR connected');
        setIsConnected(true);

        hubConnectionRef.current = connection;
    } catch (err) {
      console.error('[NotificationContext] Failed to setup SignalR:', err);
      setError('Failed to connect to notification service');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hubConnectionRef.current?.state === 1) {
        hubConnectionRef.current.stop();
      }
    };
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 1, pageSize = 20) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axiosInstance.get<NotificationListDto>(
        '/api/notifications',
        {
          params: { page, pageSize }
        }
      );

      setNotifications(response.data.notifications);
    } catch (err) {
      console.error('[NotificationContext] Failed to fetch notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await axiosInstance.get<UnreadCountDto>('/api/notifications/unread-count');
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error('[NotificationContext] Failed to fetch unread count:', err);
    }
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await axiosInstance.put(`/api/notifications/${notificationId}/read`);

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );

      // Decrement unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationContext] Failed to mark notification as read:', err);
      setError('Failed to mark notification as read');
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await axiosInstance.put('/api/notifications/mark-all-read');

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationContext] Failed to mark all as read:', err);
      setError('Failed to mark all as read');
    }
  }, []);

  // Delete single notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await axiosInstance.delete(`/api/notifications/${notificationId}`);

      // Update local state
      setNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      );

      // Decrement unread count if it was unread
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('[NotificationContext] Failed to delete notification:', err);
      setError('Failed to delete notification');
    }
  }, [notifications]);

  // Clear all read notifications
  const clearAllRead = useCallback(async () => {
    try {
      await axiosInstance.delete('/api/notifications/clear-all');

      // Update local state - keep only unread notifications
      setNotifications(prev => prev.filter(n => !n.isRead));
    } catch (err) {
      console.error('[NotificationContext] Failed to clear read notifications:', err);
      setError('Failed to clear read notifications');
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        isLoading,
        error,
        fetchNotifications,
        refreshUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllRead,
        isConnected
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
