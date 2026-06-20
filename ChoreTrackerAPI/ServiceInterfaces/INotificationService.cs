using ChoreTrackerAPI.Models;
using ChoreTrackerAPI.Dtos;
using System.Threading.Tasks;

namespace ChoreTrackerAPI.ServiceInterfaces
{
    public interface INotificationService
    {
        /// <summary>
        /// Creates notifications when a chore is completed and sends real-time updates
        /// </summary>
        Task CreateChoreCompletionNotificationAsync(int choreId, string actorUserId, int groupId);

        /// <summary>
        /// Creates reminder notifications for chores due soon or overdue
        /// </summary>
        Task CreateChoreReminderNotificationAsync(int choreId, DateTime dueDate, bool isOverdue = false);

        /// <summary>
        /// Gets unread notification count for a user
        /// </summary>
        Task<int> GetUnreadCountAsync(string userId);

        /// <summary>
        /// Sends real-time notification via SignalR
        /// </summary>
        Task SendRealtimeNotificationAsync(string userId, NotificationDto notification);
    }
}
