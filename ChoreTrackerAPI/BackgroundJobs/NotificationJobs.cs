using System;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.Models;
using ChoreTrackerAPI.ServiceInterfaces;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ChoreTrackerAPI.BackgroundJobs
{
    /// <summary>
    /// Background jobs for notification reminders via Hangfire
    /// Sends chore reminders for upcoming and overdue chores
    /// Includes deduplication logic to prevent duplicate notifications
    /// </summary>
    public class NotificationJobs
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly ILogger<NotificationJobs> _logger;

        public NotificationJobs(
            ApplicationDbContext context,
            INotificationService notificationService,
            ILogger<NotificationJobs> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _logger = logger;
        }

        /// <summary>
        /// Sends chore reminder notifications for chores due in the next 24 hours
        /// Runs every hour to check for upcoming chores
        /// Uses deduplication logic to avoid duplicate reminders
        /// </summary>
        [AutomaticRetry(Attempts = 2)]
        public async Task SendChoreRemindersJob()
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Starting chore reminders check");

                var now = DateTime.UtcNow;
                var tomorrow = now.AddHours(24);

                // Find chores that are:
                // 1. Not completed
                // 2. Due within the next 24 hours
                // 3. Have a valid NextOccurrence date
                var upcomingChores = await _context.Chores
                    .Where(c =>
                        c.Status != ChoreStatus.Done &&
                        c.NextOccurence > now &&
                        c.NextOccurence <= tomorrow &&
                        c.Group != null)
                    .Include(c => c.Group)
                    .ToListAsync();

                if (upcomingChores.Count == 0)
                {
                    _logger.LogDebug("Hangfire Job: No upcoming chores found for reminders");
                    return;
                }

                _logger.LogInformation("Hangfire Job: Found {Count} upcoming chores for reminders", upcomingChores.Count);

                // Create reminder notifications for each chore
                foreach (var chore in upcomingChores)
                {
                    try
                    {
                        await _notificationService.CreateChoreReminderNotificationAsync(
                            chore.Id,
                            chore.NextOccurence,
                            isOverdue: false
                        );

                        _logger.LogDebug("Hangfire Job: Created reminder notification for chore {ChoreId} '{ChoreName}'",
                            chore.Id, chore.Name);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Hangfire Job: Failed to create reminder for chore {ChoreId}",
                            chore.Id);
                        // Continue processing other chores even if one fails
                    }
                }

                _logger.LogInformation("Hangfire Job: Successfully completed chore reminders check");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: Failed to send chore reminders");
                throw; // Re-throw to trigger Hangfire retry mechanism
            }
        }

        /// <summary>
        /// Sends overdue alert notifications for chores that are past their due date
        /// Runs daily at 9 AM UTC to check for overdue chores
        /// Only creates one overdue notification per chore (with deduplication)
        /// </summary>
        [AutomaticRetry(Attempts = 2)]
        public async Task SendOverdueChoreRemindersJob()
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Starting overdue chore alerts check");

                var now = DateTime.UtcNow;

                // Find chores that are:
                // 1. Not completed
                // 2. Past their NextOccurrence date
                // 3. Have a valid group
                var overdueChores = await _context.Chores
                    .Where(c =>
                        c.Status != ChoreStatus.Done &&
                        c.NextOccurence < now &&
                        c.Group != null)
                    .Include(c => c.Group)
                    .ToListAsync();

                if (overdueChores.Count == 0)
                {
                    _logger.LogDebug("Hangfire Job: No overdue chores found for alerts");
                    return;
                }

                _logger.LogInformation("Hangfire Job: Found {Count} overdue chores for alerts", overdueChores.Count);

                // Create overdue alert notifications for each chore
                foreach (var chore in overdueChores)
                {
                    try
                    {
                        await _notificationService.CreateChoreReminderNotificationAsync(
                            chore.Id,
                            chore.NextOccurence,
                            isOverdue: true
                        );

                        _logger.LogDebug("Hangfire Job: Created overdue alert for chore {ChoreId} '{ChoreName}'",
                            chore.Id, chore.Name);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Hangfire Job: Failed to create overdue alert for chore {ChoreId}",
                            chore.Id);
                        // Continue processing other chores even if one fails
                    }
                }

                _logger.LogInformation("Hangfire Job: Successfully completed overdue chore alerts check");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: Failed to send overdue chore alerts");
                throw; // Re-throw to trigger Hangfire retry mechanism
            }
        }
    }
}
