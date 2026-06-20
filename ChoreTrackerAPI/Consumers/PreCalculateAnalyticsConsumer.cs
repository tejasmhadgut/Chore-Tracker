using MassTransit;
using ChoreTrackerAPI.Messages;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.ServiceInterfaces;
using Microsoft.EntityFrameworkCore;

namespace ChoreTrackerAPI.Consumers
{
    /// <summary>
    /// Consumer that handles PreCalculateAnalyticsCommand messages
    /// Pre-calculates analytics for groups and caches them
    /// Runs on schedule (2 AM daily) so dashboard loads instantly
    /// </summary>
    public class PreCalculateAnalyticsConsumer : IConsumer<PreCalculateAnalyticsCommand>
    {
        private readonly ApplicationDbContext _context;
        private readonly ICacheService _cacheService;
        private readonly ILogger<PreCalculateAnalyticsConsumer> _logger;

        public PreCalculateAnalyticsConsumer(
            ApplicationDbContext context,
            ICacheService cacheService,
            ILogger<PreCalculateAnalyticsConsumer> logger)
        {
            _context = context;
            _cacheService = cacheService;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<PreCalculateAnalyticsCommand> context)
        {
            var command = context.Message;

            try
            {
                _logger.LogInformation(
                    "Pre-calculating analytics for group {GroupId} from {StartDate} to {EndDate}",
                    command.GroupId,
                    command.StartDate,
                    command.EndDate);

                // Check if group exists
                var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == command.GroupId);
                if (group == null)
                {
                    _logger.LogWarning("Group {GroupId} not found for analytics calculation", command.GroupId);
                    return;
                }

                // Calculate completion statistics
                var completions = await _context.ChoreCompletion
                    .Where(cc => cc.GroupId == command.GroupId &&
                                 cc.CompletedOn >= command.StartDate &&
                                 cc.CompletedOn <= command.EndDate)
                    .ToListAsync();

                var completionsByUser = completions
                    .GroupBy(cc => cc.UserId)
                    .Select(g => new { UserId = g.Key, Count = g.Count() })
                    .ToList();

                var totalCompletions = completions.Count;

                // Calculate daily stats
                var dailyStats = completions
                    .GroupBy(cc => cc.CompletedOn.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        Count = g.Count()
                    })
                    .OrderBy(x => x.Date)
                    .ToList();

                // Calculate hourly heatmap
                var hourlyStats = completions
                    .GroupBy(cc => cc.CompletedOn.Hour)
                    .Select(g => new
                    {
                        Hour = g.Key,
                        Count = g.Count()
                    })
                    .OrderBy(x => x.Hour)
                    .ToList();

                // Cache the calculated analytics
                var cacheKey = $"analytics:group:{command.GroupId}:start:{command.StartDate:yyyyMMdd}:end:{command.EndDate:yyyyMMdd}";

                var analyticsData = new
                {
                    GroupId = command.GroupId,
                    TotalCompletions = totalCompletions,
                    CompletionsByUser = completionsByUser,
                    DailyStats = dailyStats,
                    HourlyStats = hourlyStats,
                    CalculatedAt = DateTime.UtcNow
                };

                // Cache for 24 hours
                await _cacheService.SetAsync(cacheKey, analyticsData, TimeSpan.FromHours(24));

                _logger.LogInformation(
                    "Successfully pre-calculated analytics for group {GroupId}: {TotalCompletions} completions",
                    command.GroupId,
                    totalCompletions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to pre-calculate analytics for group {GroupId}",
                    command.GroupId);

                // Don't throw - analytics pre-calculation failure shouldn't block other operations
                // The analytics will be calculated on-demand if not pre-cached
            }
        }
    }
}
