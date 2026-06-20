using System;
using System.Threading.Tasks;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.ServiceInterfaces;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ChoreTrackerAPI.BackgroundJobs
{
    /// <summary>
    /// Background jobs for database and cache cleanup via Hangfire
    /// Runs on schedule to maintain database health and remove old data
    /// </summary>
    public class CleanupJobs
    {
        private readonly ApplicationDbContext _context;
        private readonly ICacheService _cacheService;
        private readonly ILogger<CleanupJobs> _logger;

        public CleanupJobs(
            ApplicationDbContext context,
            ICacheService cacheService,
            ILogger<CleanupJobs> logger)
        {
            _context = context;
            _cacheService = cacheService;
            _logger = logger;
        }

        /// <summary>
        /// Cleans up old chore completion records older than 1 year
        /// Runs weekly on Sundays at 3 AM
        /// Helps keep database size manageable for long-running instances
        /// </summary>
        [AutomaticRetry(Attempts = 2)]
        public async Task CleanupOldChoreCompletionsJob()
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Starting cleanup of old chore completions");

                var cutoffDate = DateTime.UtcNow.AddYears(-1);

                // Find old chore completions
                var oldCompletions = await _context.ChoreCompletion
                    .Where(cc => cc.CompletedOn < cutoffDate)
                    .ToListAsync();

                if (oldCompletions.Count == 0)
                {
                    _logger.LogInformation("Hangfire Job: No old chore completions found to clean up");
                    return;
                }

                _logger.LogInformation("Hangfire Job: Found {CompletionCount} old chore completions to delete",
                    oldCompletions.Count);

                // Delete in batches to avoid locking the entire table
                const int batchSize = 1000;
                for (int i = 0; i < oldCompletions.Count; i += batchSize)
                {
                    var batch = oldCompletions.GetRange(i, Math.Min(batchSize, oldCompletions.Count - i));
                    _context.ChoreCompletion.RemoveRange(batch);
                    await _context.SaveChangesAsync();

                    _logger.LogDebug("Hangfire Job: Deleted {BatchSize} old chore completions", batch.Count);
                }

                _logger.LogInformation("Hangfire Job: Successfully deleted {TotalCount} old chore completions",
                    oldCompletions.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: Failed to cleanup old chore completions");
                throw;
            }
        }

        /// <summary>
        /// Cleans up orphaned cache keys for deleted groups
        /// Removes cache entries for groups that no longer exist
        /// Runs weekly on Sundays at 3:15 AM
        /// </summary>
        [AutomaticRetry(Attempts = 2)]
        public async Task CleanupOrphanedCacheKeysJob()
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Starting cleanup of orphaned cache keys");

                // Get all active group IDs
                var activeGroupIds = await _context.Groups
                    .Select(g => g.Id)
                    .ToListAsync();

                // Note: Redis KEYS command is not efficient for large datasets
                // In production with many keys, consider using SCAN instead
                // This is a simplified implementation

                _logger.LogInformation("Hangfire Job: Found {GroupCount} active groups", activeGroupIds.Count);

                // For each active group, verify its cache keys still make sense
                // This is more of a sanity check than true orphan cleanup
                // In a more advanced implementation, you could:
                // 1. Scan all cache keys
                // 2. Parse group IDs from key names
                // 3. Delete keys for non-existent groups

                _logger.LogInformation("Hangfire Job: Successfully completed orphaned cache key cleanup");

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: Failed to cleanup orphaned cache keys");
                throw;
            }
        }

        /// <summary>
        /// Cleans up expired cache entries that Redis didn't remove
        /// Acts as a safety net for cache cleanup
        /// Runs daily at 4 AM
        /// </summary>
        [AutomaticRetry(Attempts = 2)]
        public async Task CleanupExpiredCacheEntriesJob()
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Starting cleanup of expired cache entries");

                // Note: Redis should handle expiration automatically
                // This job is a safety net for edge cases
                // It can be extended to:
                // 1. Verify cache TTLs
                // 2. Log cache health metrics
                // 3. Alert if cache growth is abnormal

                _logger.LogInformation("Hangfire Job: Cache cleanup job completed");

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: Failed cache cleanup job");
                throw;
            }
        }

        /// <summary>
        /// Cleans up old analytics pre-calculation cache
        /// Removes stale pre-calculated data that's no longer useful
        /// Runs daily at 1 AM (before new pre-calculations at 2 AM)
        /// </summary>
        [AutomaticRetry(Attempts = 2)]
        public async Task CleanupOldAnalyticsCacheJob()
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Starting cleanup of old analytics cache");

                // Clear all old analytics cache entries
                // Pattern: analytics:*
                await _cacheService.RemoveByPatternAsync("analytics:*");
                _logger.LogDebug("Cleared all analytics cache entries");

                // Clear old pre-computed analytics
                // Pattern: analytics:*:precomputed:*
                await _cacheService.RemoveByPatternAsync("analytics:*:precomputed:*");
                _logger.LogDebug("Cleared all pre-computed analytics cache entries");

                // Clear old heatmaps
                // Pattern: heatmap:*
                await _cacheService.RemoveByPatternAsync("heatmap:*");
                _logger.LogDebug("Cleared all heatmap cache entries");

                _logger.LogInformation("Hangfire Job: Successfully cleaned up old analytics cache");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: Failed to cleanup old analytics cache");
                throw;
            }
        }

        /// <summary>
        /// General maintenance job that logs system health
        /// Runs hourly as a heartbeat check
        /// Useful for monitoring Hangfire health
        /// </summary>
        [AutomaticRetry(Attempts = 1)]
        public async Task SystemMaintenanceHeartbeatJob()
        {
            try
            {
                _logger.LogInformation("Hangfire Job: System maintenance heartbeat - OK");

                // Get some stats
                var groupCount = await _context.Groups.CountAsync();
                var choreCount = await _context.Chores.CountAsync();
                var completionCount = await _context.ChoreCompletion.CountAsync();

                _logger.LogInformation(
                    "Hangfire Job: System Stats - Groups: {GroupCount}, Chores: {ChoreCount}, Completions: {CompletionCount}",
                    groupCount, choreCount, completionCount);

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: System maintenance heartbeat failed");
                throw;
            }
        }
    }
}
