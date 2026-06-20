/**
 * Notification types for the real-time notification system
 * Synced with backend NotificationType enum
 */

export enum NotificationType {
  ChoreReminder = 0,
  ChoreOverdue = 1,
  ChoreCompleted = 2,
  ChoreAssigned = 3
}

/**
 * Actor DTO - Information about who triggered the notification
 */
export interface ActorDto {
  id: string;
  firstName: string;
  profilePictureUrl: string;
}

/**
 * Main Notification DTO - Represents a single notification
 */
export interface NotificationDto {
  id: number;
  type: NotificationType;
  message: string;
  choreId?: number;
  choreName?: string;
  groupId: number;
  groupName: string;
  isRead: boolean;
  createdAt: string;
  actor?: ActorDto;
}

/**
 * Unread count DTO - Simple response with count
 */
export interface UnreadCountDto {
  unreadCount: number;
}

/**
 * Paginated notification list response
 */
export interface NotificationListDto {
  notifications: NotificationDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Real-time notification payload received via SignalR
 */
export interface RealtimeNotificationPayload {
  notification: NotificationDto;
  timestamp: string;
}
