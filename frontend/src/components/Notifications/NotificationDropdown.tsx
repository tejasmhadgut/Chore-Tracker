import React, { useEffect, useState } from 'react';
import { X, Trash2, CheckCircle, AlertCircle, Award, Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationDto, NotificationType } from '../types/notifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationDropdownProps {
  onClose: () => void;
  isOpen?: boolean;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose, isOpen = true }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead
  } = useNotifications();

  const [displayedNotifications, setDisplayedNotifications] = useState<NotificationDto[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Load notifications and refresh unread count when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(currentPage, pageSize);
      refreshUnreadCount();
    }
  }, [isOpen, currentPage, pageSize, fetchNotifications, refreshUnreadCount]);

  useEffect(() => {
    setDisplayedNotifications(notifications.slice(0, pageSize));
  }, [notifications, pageSize]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ChoreReminder:
        return <Bell size={18} className="text-blue-400" />;
      case NotificationType.ChoreOverdue:
        return <AlertCircle size={18} className="text-red-400" />;
      case NotificationType.ChoreCompleted:
        return <CheckCircle size={18} className="text-green-400" />;
      case NotificationType.ChoreAssigned:
        return <Award size={18} className="text-purple-400" />;
      default:
        return <Bell size={18} className="text-slate-400" />;
    }
  };

  const getNotificationTypeLabel = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.ChoreReminder:
        return 'Reminder';
      case NotificationType.ChoreOverdue:
        return 'Overdue';
      case NotificationType.ChoreCompleted:
        return 'Completed';
      case NotificationType.ChoreAssigned:
        return 'Assigned';
      default:
        return 'Notification';
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-700/30">
        <div>
          <h3 className="text-white font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-slate-400">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-xs px-2 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded transition-colors"
              title="Mark all as read"
            >
              Mark all read
            </button>
          )}
          {displayedNotifications.some(n => n.isRead) && (
            <button
              onClick={() => clearAllRead()}
              className="text-xs px-2 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded transition-colors"
              title="Clear all read notifications"
            >
              Clear read
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && displayedNotifications.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-400">
            <p className="text-sm">{error}</p>
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-slate-400">
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {displayedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-slate-700/30 transition-colors cursor-pointer ${
                  !notification.isRead ? 'bg-slate-700/20' : ''
                }`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-cyan-400">
                            {getNotificationTypeLabel(notification.type)}
                          </span>
                          {!notification.isRead && (
                            <span className="inline-block h-2 w-2 bg-blue-400 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-slate-200 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                        {notification.groupName && (
                          <p className="text-xs text-slate-400 mt-1">
                            in {notification.groupName}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-1 flex-shrink-0">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                            className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-600 rounded transition-colors"
                            title="Mark as read"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(e, notification.id)}
                          className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded transition-colors"
                          title="Delete notification"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with pagination (if needed) */}
      {displayedNotifications.length > 0 && (
        <div className="border-t border-slate-700 p-3 bg-slate-700/30 text-center text-xs text-slate-400">
          Showing {Math.min(currentPage * pageSize, displayedNotifications.length)} notifications
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
