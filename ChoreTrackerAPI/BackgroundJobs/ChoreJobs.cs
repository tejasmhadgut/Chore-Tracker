using System;
using System.Threading.Tasks;
using ChoreTrackerAPI.ServiceInterfaces;
using ChoreTrackerAPI.Services;
using Hangfire;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace ChoreTrackerAPI.BackgroundJobs
{
    /// <summary>
    /// Background jobs for chore management via Hangfire
    /// Replaces RecurrenceBackgroundService with distributed job execution
    /// Ensures only ONE instance executes recurring chore updates across multi-instance deployment
    /// </summary>
    public class ChoreJobs
    {
        private readonly IChoreService _choreService;
        private readonly IHubContext<ChoreHubService> _hubContext;
        private readonly ILogger<ChoreJobs> _logger;

        public ChoreJobs(
            IChoreService choreService,
            IHubContext<ChoreHubService> hubContext,
            ILogger<ChoreJobs> logger)
        {
            _choreService = choreService;
            _hubContext = hubContext;
            _logger = logger;
        }

        /// <summary>
        /// Updates recurring chores that need new NextOccurrence dates
        /// Runs every 5 minutes to check for chores due for recurrence
        /// Broadcasts ChoreUpdated events via SignalR for real-time UI updates
        /// Only executes on the designated background job instance (api1 in production)
        /// </summary>
        [AutomaticRetry(Attempts = 2)]
        public async Task UpdateRecurringChoresJob()
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Starting recurring chore update check");

                // Call existing ChoreService method
                var updatedChores = await _choreService.UpdateRecurrenceDatesAsync();

                if (updatedChores.Count == 0)
                {
                    _logger.LogDebug("Hangfire Job: No recurring chores needed updates");
                    return;
                }

                _logger.LogInformation("Hangfire Job: Updated {Count} recurring chores", updatedChores.Count);

                // Broadcast SignalR events to each affected group
                foreach (var chore in updatedChores)
                {
                    await _hubContext.Clients.Group($"Group-{chore.GroupId}")
                        .SendAsync("ChoreUpdated", chore.Id);

                    _logger.LogDebug("Hangfire Job: Sent ChoreUpdated event for chore {ChoreId} in group {GroupId}",
                        chore.Id, chore.GroupId);
                }

                _logger.LogInformation("Hangfire Job: Successfully completed recurring chore update");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: Failed to update recurring chores");
                throw; // Re-throw to trigger Hangfire retry mechanism
            }
        }
    }
}
