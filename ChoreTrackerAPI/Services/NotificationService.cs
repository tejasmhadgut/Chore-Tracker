using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.Models;
using ChoreTrackerAPI.ServiceInterfaces;
using ChoreTrackerAPI.Dtos;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using System;

namespace ChoreTrackerAPI.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ChoreHubService> _hubContext;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            ApplicationDbContext context,
            IHubContext<ChoreHubService> hubContext,
            ILogger<NotificationService> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task CreateChoreCompletionNotificationAsync(int choreId, string actorUserId, int groupId)
        {
            try
            {
                // Get chore and actor details
                var chore = await _context.Chores.FindAsync(choreId);
                var actor = await _context.Users.FindAsync(actorUserId);

                if (chore == null || actor == null)
                {
                    _logger.LogWarning("Chore or actor not found: ChoreId={ChoreId}, ActorId={ActorUserId}", choreId, actorUserId);
                    return;
                }

                // Get all group members except the actor
                var groupMembers = await _context.GroupMember
                    .Where(gm => gm.GroupId == groupId && gm.UserId != actorUserId)
                    .Select(gm => gm.UserId)
                    .ToListAsync();

                // Create notification for each group member
                var notifications = new List<Notification>();
                foreach (var memberId in groupMembers)
                {
                    var notification = new Notification
                    {
                        UserId = memberId,
                        Type = NotificationType.ChoreCompleted,
                        Message = $"{actor.FirstName} completed '{chore.Name}'",
                        ChoreId = choreId,
                        GroupId = groupId,
                        ActorUserId = actorUserId,
                        CreatedAt = DateTime.UtcNow
                    };
                    notifications.Add(notification);
                }

                _context.Notifications.AddRange(notifications);
                await _context.SaveChangesAsync();

                // Send real-time notifications via SignalR
                foreach (var notification in notifications)
                {
                    var notificationDto = MapToDto(notification, chore, actor);
                    await SendRealtimeNotificationAsync(notification.UserId, notificationDto);
                }

                _logger.LogInformation("Chore completion notifications created for chore {ChoreId} in group {GroupId}", choreId, groupId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating chore completion notification for chore {ChoreId}", choreId);
            }
        }

        public async Task CreateChoreReminderNotificationAsync(int choreId, DateTime dueDate, bool isOverdue = false)
        {
            try
            {
                // Get chore and group
                var chore = await _context.Chores.Include(c => c.Group).FirstOrDefaultAsync(c => c.Id == choreId);
                if (chore == null)
                {
                    _logger.LogWarning("Chore not found: ChoreId={ChoreId}", choreId);
                    return;
                }

                // Get all group members
                var groupMembers = await _context.GroupMember
                    .Where(gm => gm.GroupId == chore.GroupId)
                    .Select(gm => gm.UserId)
                    .ToListAsync();

                var notificationType = isOverdue ? NotificationType.ChoreOverdue : NotificationType.ChoreReminder;
                var message = isOverdue
                    ? $"'{chore.Name}' is overdue (was due on {dueDate:MMM dd})"
                    : $"'{chore.Name}' is due on {dueDate:MMM dd}";

                // Create notification for each group member
                var notifications = new List<Notification>();
                foreach (var memberId in groupMembers)
                {
                    // Check if notification already exists for this chore and user
                    var exists = await _context.Notifications
                        .AnyAsync(n => n.UserId == memberId &&
                                      n.ChoreId == choreId &&
                                      n.Type == notificationType &&
                                      n.CreatedAt > DateTime.UtcNow.AddHours(-1));  // Within last hour

                    if (!exists)
                    {
                        var notification = new Notification
                        {
                            UserId = memberId,
                            Type = notificationType,
                            Message = message,
                            ChoreId = choreId,
                            GroupId = chore.GroupId,
                            CreatedAt = DateTime.UtcNow
                        };
                        notifications.Add(notification);
                    }
                }

                if (notifications.Any())
                {
                    _context.Notifications.AddRange(notifications);
                    await _context.SaveChangesAsync();

                    // Send real-time notifications via SignalR
                    foreach (var notification in notifications)
                    {
                        var notificationDto = MapToDto(notification, chore, null);
                        await SendRealtimeNotificationAsync(notification.UserId, notificationDto);
                    }

                    _logger.LogInformation("Chore reminder notifications created for chore {ChoreId}", choreId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating chore reminder notification for chore {ChoreId}", choreId);
            }
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            try
            {
                // Query unread count directly from database
                // (Value types can't be cached with ICacheService generic constraint)
                var unreadCount = await _context.Notifications
                    .CountAsync(n => n.UserId == userId && !n.IsRead);

                return unreadCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting unread count for user {UserId}", userId);
                return 0;
            }
        }

        public async Task SendRealtimeNotificationAsync(string userId, NotificationDto notification)
        {
            try
            {
                // Send notification to user
                await _hubContext.Clients.User(userId).SendAsync("ReceiveNotification", notification);

                // Update unread count
                var unreadCount = await GetUnreadCountAsync(userId);
                await _hubContext.Clients.User(userId).SendAsync("UpdateUnreadCount", unreadCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending real-time notification to user {UserId}", userId);
            }
        }

        private NotificationDto MapToDto(Notification notification, Chore? chore, ApplicationUser? actor)
        {
            return new NotificationDto
            {
                Id = notification.Id,
                Type = notification.Type,
                Message = notification.Message,
                ChoreId = notification.ChoreId,
                ChoreName = chore?.Name,
                GroupId = notification.GroupId,
                GroupName = "", // Will be populated by caller if needed
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt,
                Actor = actor != null ? new ActorDto
                {
                    Id = actor.Id,
                    FirstName = actor.FirstName,
                    ProfilePictureUrl = actor.ProfilePictureUrl ?? ""
                } : null
            };
        }
    }
}
