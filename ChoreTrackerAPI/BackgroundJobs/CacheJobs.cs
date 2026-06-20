using System;
using System.Threading.Tasks;
using ChoreTrackerAPI.ServiceInterfaces;
using Microsoft.Extensions.Logging;

namespace ChoreTrackerAPI.BackgroundJobs
{
    /// <summary>
    /// Background jobs for cache invalidation via Hangfire
    /// Moves cache clearing to background to prevent blocking API responses
    /// </summary>
    public class CacheJobs
    {
        private readonly ICacheService _cacheService;
        private readonly ILogger<CacheJobs> _logger;

        public CacheJobs(
            ICacheService cacheService,
            ILogger<CacheJobs> logger)
        {
            _cacheService = cacheService;
            _logger = logger;
        }

        /// <summary>
        /// Invalidates all cache entries related to a group
        /// Clears: analytics, leaderboard, chores, group details
        /// </summary>
        /// <param name="groupId">Group ID to invalidate cache for</param>
        public async Task InvalidateGroupCacheJob(int groupId)
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Invalidating cache for group {GroupId}", groupId);

                // Invalidate analytics cache (pattern: analytics:group:{groupId}:*)
                await _cacheService.RemoveByPatternAsync($"analytics:group:{groupId}:*");
                _logger.LogDebug("Invalidated analytics cache for group {GroupId}", groupId);

                // Invalidate leaderboard cache (pattern: leaderboard:group:{groupId}:*)
                await _cacheService.RemoveByPatternAsync($"leaderboard:group:{groupId}:*");
                _logger.LogDebug("Invalidated leaderboard cache for group {GroupId}", groupId);

                // Invalidate chores list cache
                await _cacheService.RemoveAsync($"chores:group:{groupId}");
                _logger.LogDebug("Invalidated chores cache for group {GroupId}", groupId);

                // Invalidate group details cache
                await _cacheService.RemoveAsync($"group:{groupId}:details");
                _logger.LogDebug("Invalidated group details cache for group {GroupId}", groupId);

                _logger.LogInformation("Hangfire Job: Successfully invalidated all cache for group {GroupId}", groupId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: Failed to invalidate cache for group {GroupId}", groupId);
                throw;
            }
        }

        /// <summary>
        /// Invalidates all activities cache for a specific user
        /// Called when new chore completion or group member join happens
        /// </summary>
        /// <param name="userId">User ID to invalidate activities cache for</param>
        public async Task InvalidateUserActivitiesCacheJob(string userId)
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Invalidating activities cache for user {UserId}", userId);

                // Invalidate all activities cache entries for this user (pattern: activities:user:{userId}:*)
                await _cacheService.RemoveByPatternAsync($"activities:user:{userId}:*");

                _logger.LogInformation("Hangfire Job: Successfully invalidated activities cache for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: Failed to invalidate activities cache for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Invalidates membership cache for a user in a group
        /// Called when user joins or leaves a group
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="groupId">Group ID</param>
        public async Task InvalidateMembershipCacheJob(string userId, int groupId)
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Invalidating membership cache for user {UserId} in group {GroupId}",
                    userId, groupId);

                // Invalidate membership check cache
                var cacheKey = $"membership:user:{userId}:group:{groupId}";
                await _cacheService.RemoveAsync(cacheKey);

                _logger.LogInformation(
                    "Hangfire Job: Successfully invalidated membership cache for user {UserId} in group {GroupId}",
                    userId, groupId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Hangfire Job: Failed to invalidate membership cache for user {UserId} in group {GroupId}",
                    userId, groupId);
                throw;
            }
        }

        /// <summary>
        /// Invalidates all membership cache for a group
        /// Pattern-based deletion of membership:user:*:group:{groupId}
        /// Called when group is deleted or significant changes occur
        /// </summary>
        /// <param name="groupId">Group ID</param>
        public async Task InvalidateGroupMembershipsCacheJob(int groupId)
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Invalidating all membership cache for group {GroupId}", groupId);

                // Invalidate all membership entries for users in this group
                var pattern = $"membership:user:*:group:{groupId}";
                await _cacheService.RemoveByPatternAsync(pattern);

                _logger.LogInformation(
                    "Hangfire Job: Successfully invalidated all membership cache for group {GroupId}", groupId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Hangfire Job: Failed to invalidate membership cache for group {GroupId}", groupId);
                throw;
            }
        }

        /// <summary>
        /// Clears all cache keys matching a custom pattern
        /// Used for complex invalidation scenarios
        /// </summary>
        /// <param name="pattern">Cache key pattern to match (e.g., "analytics:*", "chores:group:5:*")</param>
        public async Task InvalidateByPatternJob(string pattern)
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Invalidating cache by pattern {Pattern}", pattern);

                await _cacheService.RemoveByPatternAsync(pattern);

                _logger.LogInformation("Hangfire Job: Successfully invalidated cache matching pattern {Pattern}",
                    pattern);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: Failed to invalidate cache by pattern {Pattern}", pattern);
                throw;
            }
        }
    }
}
