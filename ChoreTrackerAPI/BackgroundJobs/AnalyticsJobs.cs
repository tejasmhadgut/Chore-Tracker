using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.ServiceInterfaces;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ChoreTrackerAPI.BackgroundJobs
{
    /// <summary>
    /// Background jobs for analytics pre-calculation via Hangfire
    /// Pre-calculates expensive analytics queries and caches results
    /// Runs on schedule (daily at 2 AM) to ensure instant analytics on first request
    /// </summary>
    public class AnalyticsJobs
    {
        private readonly ApplicationDbContext _context;
        private readonly ICacheService _cacheService;
        private readonly ILogger<AnalyticsJobs> _logger;

        public AnalyticsJobs(
            ApplicationDbContext context,
            ICacheService cacheService,
            ILogger<AnalyticsJobs> logger)
        {
            _context = context;
            _cacheService = cacheService;
            _logger = logger;
        }

        /// <summary>
        /// Pre-calculates analytics for a specific group
        /// Runs daily at 2 AM for all groups
        /// Caches results so first request after cache expiry is instant
        /// </summary>
        /// <param name="groupId">Group ID to pre-calculate analytics for</param>
        [AutomaticRetry(Attempts = 3)]
        public async Task PreCalculateGroupAnalyticsJob(int groupId)
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Pre-calculating analytics for group {GroupId}", groupId);

                var endDate = DateTime.UtcNow;
                var startDate = endDate.AddDays(-30);

                // Get all chore completions for the past 30 days
                var completions = await _context.ChoreCompletion
                    .Where(cc => cc.GroupId == groupId && cc.CompletedOn >= startDate && cc.CompletedOn <= endDate)
                    .Include(cc => cc.Chore)
                    .Include(cc => cc.User)
                    .ToListAsync();

                if (completions.Count == 0)
                {
                    _logger.LogInformation("Hangfire Job: No completions found for group {GroupId} in past 30 days",
                        groupId);
                    return;
                }

                // Pre-calculate user rankings
                var userStats = completions
                    .GroupBy(cc => cc.UserId)
                    .Select(g => new
                    {
                        UserId = g.Key,
                        UserName = g.First().User.UserName,
                        CompletionCount = g.Count(),
                        LastCompletion = g.Max(cc => cc.CompletedOn),
                        ContributionPercentage = Math.Round((g.Count() / (double)completions.Count) * 100, 2)
                    })
                    .OrderByDescending(g => g.CompletionCount)
                    .ToList();

                // Pre-calculate chore statistics
                var choreStats = completions
                    .GroupBy(cc => cc.ChoreId)
                    .Select(g => new
                    {
                        ChoreId = g.Key,
                        ChoreName = g.First().Chore.Name,
                        CompletionCount = g.Count(),
                        LastCompleted = g.Max(cc => cc.CompletedOn),
                        Completers = g.Select(cc => cc.User.UserName).Distinct().Count()
                    })
                    .OrderByDescending(g => g.CompletionCount)
                    .ToList();

                // Pre-calculate daily heatmap data
                var dailyStats = completions
                    .GroupBy(cc => cc.CompletedOn.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        CompletionCount = g.Count(),
                        UniqueUsers = g.Select(cc => cc.UserId).Distinct().Count()
                    })
                    .OrderBy(g => g.Date)
                    .ToList();

                // Cache all pre-calculated data
                var analyticsData = new
                {
                    GroupId = groupId,
                    UserStats = userStats,
                    ChoreStats = choreStats,
                    DailyStats = dailyStats,
                    CalculatedAt = DateTime.UtcNow,
                    Period = new { StartDate = startDate, EndDate = endDate }
                };

                var cacheKey = $"analytics:group:{groupId}:precomputed:30day";
                await _cacheService.SetAsync(cacheKey, analyticsData, TimeSpan.FromHours(24));

                _logger.LogInformation(
                    "Hangfire Job: Successfully pre-calculated analytics for group {GroupId} ({UserCount} users, {ChoreCount} chores, {DayCount} days)",
                    groupId, userStats.Count, choreStats.Count, dailyStats.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: Failed to pre-calculate analytics for group {GroupId}", groupId);
                throw;
            }
        }

        /// <summary>
        /// Pre-calculates analytics for all groups in the system
        /// Called daily at 2 AM
        /// Enqueues individual pre-calculation jobs for each group
        /// </summary>
        [AutomaticRetry(Attempts = 2)]
        public async Task PreCalculateAllGroupsAnalyticsJob()
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Starting pre-calculation of analytics for all groups");

                // Get all group IDs
                var groupIds = await _context.Groups
                    .Select(g => g.Id)
                    .ToListAsync();

                _logger.LogInformation("Hangfire Job: Found {GroupCount} groups to pre-calculate", groupIds.Count);

                // Enqueue a job for each group
                foreach (var groupId in groupIds)
                {
                    // Each group gets its own job for parallel processing
                    BackgroundJob.Enqueue<AnalyticsJobs>(
                        job => job.PreCalculateGroupAnalyticsJob(groupId));
                    _logger.LogDebug("Enqueued analytics pre-calculation for group {GroupId}", groupId);
                }

                _logger.LogInformation("Hangfire Job: Successfully enqueued {JobCount} analytics pre-calculation jobs",
                    groupIds.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: Failed to pre-calculate analytics for all groups");
                throw;
            }
        }

        /// <summary>
        /// Calculates activity heatmap data for a group
        /// Shows which hours of the day are most active
        /// Useful for understanding group patterns
        /// </summary>
        /// <param name="groupId">Group ID</param>
        [AutomaticRetry(Attempts = 3)]
        public async Task PreCalculateGroupHeatmapJob(int groupId)
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Pre-calculating heatmap for group {GroupId}", groupId);

                var endDate = DateTime.UtcNow;
                var startDate = endDate.AddDays(-7); // Last 7 days

                // Get hourly completion data
                var hourlyData = await _context.ChoreCompletion
                    .Where(cc => cc.GroupId == groupId && cc.CompletedOn >= startDate && cc.CompletedOn <= endDate)
                    .GroupBy(cc => cc.CompletedOn.Hour)
                    .Select(g => new
                    {
                        Hour = g.Key,
                        CompletionCount = g.Count(),
                        UniqueUsers = g.Select(cc => cc.UserId).Distinct().Count()
                    })
                    .OrderBy(g => g.Hour)
                    .ToListAsync();

                // Get daily completion data
                var dailyData = await _context.ChoreCompletion
                    .Where(cc => cc.GroupId == groupId && cc.CompletedOn >= startDate && cc.CompletedOn <= endDate)
                    .GroupBy(cc => cc.CompletedOn.DayOfWeek)
                    .Select(g => new
                    {
                        DayOfWeek = g.Key,
                        CompletionCount = g.Count(),
                        UniqueUsers = g.Select(cc => cc.UserId).Distinct().Count()
                    })
                    .ToListAsync();

                var heatmapData = new
                {
                    GroupId = groupId,
                    HourlyData = hourlyData,
                    DailyData = dailyData,
                    CalculatedAt = DateTime.UtcNow,
                    Period = new { StartDate = startDate, EndDate = endDate }
                };

                var cacheKey = $"heatmap:group:{groupId}:7day";
                await _cacheService.SetAsync(cacheKey, heatmapData, TimeSpan.FromHours(24));

                _logger.LogInformation("Hangfire Job: Successfully pre-calculated heatmap for group {GroupId}",
                    groupId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: Failed to pre-calculate heatmap for group {GroupId}", groupId);
                throw;
            }
        }
    }
}
