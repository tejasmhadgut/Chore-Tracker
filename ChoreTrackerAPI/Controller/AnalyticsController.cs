using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.Dtos;
using ChoreTrackerAPI.Models;
using ChoreTrackerAPI.ServiceInterfaces;
using System.Globalization;

namespace ChoreTrackerAPI.Controller
{
    [ApiController]
    [Route("api/groups/{groupId}/analytics")]
    [Authorize]
    public class AnalyticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<AnalyticsController> _logger;
        private readonly ICacheService _cacheService;

        public AnalyticsController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<AnalyticsController> logger,
            ICacheService cacheService)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
            _cacheService = cacheService;
        }

        private async Task<ApplicationUser?> GetCurrentUserAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                _logger.LogWarning("Failed to get current user from claims");
            }
            return user;
        }

        private async Task<bool> IsUserGroupMemberAsync(int groupId, string userId)
        {
            return await _context.GroupMember
                .AnyAsync(gm => gm.GroupId == groupId && gm.UserId == userId);
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetAnalyticsSummary(
            int groupId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            try
            {
                var user = await GetCurrentUserAsync();
                if (user == null) return Unauthorized();

                var isMember = await IsUserGroupMemberAsync(groupId, user.Id);
                if (!isMember)
                {
                    _logger.LogWarning("User {UserId} attempted to access analytics for group {GroupId} without membership", user.Id, groupId);
                    return Forbid();
                }

                var start = startDate ?? DateTime.UtcNow.AddDays(-30);
                var end = endDate ?? DateTime.UtcNow;

                // Ensure dates are treated as UTC for PostgreSQL compatibility
                start = DateTime.SpecifyKind(start, DateTimeKind.Utc);
                end = DateTime.SpecifyKind(end, DateTimeKind.Utc);

                // Query ChoreCompletion records (like leaderboard does) for accurate completion tracking
                var completions = await _context.ChoreCompletion
                    .Where(cc => cc.GroupId == groupId && cc.CompletedOn >= start && cc.CompletedOn <= end)
                    .Include(cc => cc.Chore)
                    .Include(cc => cc.User)
                    .ToListAsync();

                var totalCompletions = completions.Count;
                int totalPoints = completions.Sum(cc => (int)cc.Chore.Difficulty);

                var totalTasks = await _context.Chores
                    .CountAsync(c => c.GroupId == groupId);

                var activeMembers = await _context.GroupMember
                    .CountAsync(gm => gm.GroupId == groupId);

                // Calculate top performer by points (not just count)
                var topPerformerUser = completions
                    .GroupBy(cc => cc.User)
                    .Select(g => new
                    {
                        User = g.Key,
                        Points = g.Sum(cc => (int)cc.Chore.Difficulty)
                    })
                    .OrderByDescending(x => x.Points)
                    .FirstOrDefault();

                var topPerformerName = topPerformerUser?.User != null
                    ? $"{topPerformerUser.User.FirstName} {topPerformerUser.User.LastName}".Trim()
                    : string.Empty;

                var averagePointsPerMember = activeMembers > 0
                    ? (double)totalPoints / activeMembers
                    : 0;

                var summary = new AnalyticsSummaryDto
                {
                    TotalTasksCompleted = totalCompletions,
                    ActiveMembers = activeMembers,
                    CompletionRate = totalTasks > 0 ? Math.Round((double)totalCompletions / totalTasks * 100, 2) : 0,
                    TopPerformer = topPerformerName,
                    TotalTasks = totalTasks,
                    StartDate = start,
                    EndDate = end,
                    AverageTasksPerMember = Math.Round(averagePointsPerMember, 2)
                };

                _logger.LogInformation("Analytics summary generated for group {GroupId} from {StartDate} to {EndDate}",
                    groupId, start, end);

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating analytics summary for group {GroupId}", groupId);
                return StatusCode(500, "An error occurred while generating analytics summary");
            }
        }

        [HttpGet("user-contributions")]
        public async Task<IActionResult> GetUserContributions(
            int groupId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            try
            {
                var user = await GetCurrentUserAsync();
                if (user == null) return Unauthorized();

                var isMember = await IsUserGroupMemberAsync(groupId, user.Id);
                if (!isMember)
                {
                    _logger.LogWarning("User {UserId} attempted to access user contributions for group {GroupId}", user.Id, groupId);
                    return Forbid();
                }

                var start = startDate ?? DateTime.UtcNow.AddDays(-30);
                var end = endDate ?? DateTime.UtcNow;

                // Ensure dates are treated as UTC for PostgreSQL compatibility
                start = DateTime.SpecifyKind(start, DateTimeKind.Utc);
                end = DateTime.SpecifyKind(end, DateTimeKind.Utc);

                // Get all group members
                var allMembers = await _context.GroupMember
                    .Where(gm => gm.GroupId == groupId)
                    .Include(gm => gm.User)
                    .Select(gm => gm.User)
                    .ToListAsync();

                // Query ChoreCompletion records with difficulty-weighted points
                var completions = await _context.ChoreCompletion
                    .Where(cc => cc.GroupId == groupId && cc.CompletedOn >= start && cc.CompletedOn <= end)
                    .Include(cc => cc.Chore)
                    .Include(cc => cc.User)
                    .ToListAsync();

                var totalPoints = completions.Sum(cc => (int)cc.Chore.Difficulty);

                // Create a dictionary of user contributions
                var completionsByUser = completions
                    .GroupBy(cc => cc.User)
                    .ToDictionary(
                        g => g.Key.Id,
                        g => new
                        {
                            CompletionCount = g.Count(),
                            TotalPoints = g.Sum(cc => (int)cc.Chore.Difficulty)
                        }
                    );

                // Build contributions list for all members (including those with 0 completions)
                var contributions = new List<UserContributionDto>();

                foreach (var member in allMembers)
                {
                    var hasCompletions = completionsByUser.TryGetValue(member.Id, out var stats);
                    var completionCount = hasCompletions ? stats.CompletionCount : 0;
                    var memberPoints = hasCompletions ? stats.TotalPoints : 0;

                    var percentage = totalPoints > 0
                        ? (double)memberPoints / totalPoints * 100
                        : 0;

                    contributions.Add(new UserContributionDto
                    {
                        UserId = member.Id,
                        UserName = member.UserName ?? "",
                        FirstName = member.FirstName,
                        LastName = member.LastName,
                        TasksCompleted = completionCount,
                        Percentage = Math.Round(percentage, 2),
                        ProfilePictureUrl = member.ProfilePictureUrl ?? "",
                        Rank = 0 // Will be set after sorting
                    });
                }

                // Sort by total points (descending), then by completion count (descending)
                contributions = contributions
                    .OrderByDescending(c => c.Percentage)
                    .ThenByDescending(c => c.TasksCompleted)
                    .Select((c, index) => { c.Rank = index + 1; return c; })
                    .ToList();

                _logger.LogInformation("User contributions generated for group {GroupId}, {Count} contributors found",
                    groupId, contributions.Count);

                return Ok(contributions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating user contributions for group {GroupId}", groupId);
                return StatusCode(500, "An error occurred while generating user contributions");
            }
        }

        [HttpGet("timeline")]
        public async Task<IActionResult> GetTimelineData(
            int groupId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            try
            {
                var user = await GetCurrentUserAsync();
                if (user == null) return Unauthorized();

                var isMember = await IsUserGroupMemberAsync(groupId, user.Id);
                if (!isMember)
                {
                    _logger.LogWarning("User {UserId} attempted to access timeline for group {GroupId}", user.Id, groupId);
                    return Forbid();
                }

                var start = startDate ?? DateTime.UtcNow.AddDays(-30);
                var end = endDate ?? DateTime.UtcNow;

                // TODO: Uncomment after adding AssignedUserId property to Chore model
                // var completedChores = await _context.Chores
                //     .Where(c => c.GroupId == groupId &&
                //            c.Status == ChoreStatus.Done &&
                //            c.UpdatedAt >= start &&
                //            c.UpdatedAt <= end)
                //     .Select(c => new { c.UpdatedAt, c.AssignedUserId })
                //     .ToListAsync();
                var completedChores = new List<dynamic>();

                var timelineData = completedChores
                    .GroupBy(c => c.UpdatedAt.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        Chores = g.ToList()
                    })
                    .OrderBy(g => g.Date)
                    .ToList();

                var timeline = new List<TimelineDataDto>();

                foreach (var day in timelineData)
                {
                    var userBreakdown = new Dictionary<string, int>();

                    var userGroups = day.Chores.GroupBy(c => c.AssignedUserId);
                    foreach (var userGroup in userGroups)
                    {
                        var userId = userGroup.Key;
                        var choreUser = await _userManager.FindByIdAsync(userId);
                        var userName = choreUser != null
                            ? $"{choreUser.FirstName} {choreUser.LastName}".Trim()
                            : "Unknown";
                        userBreakdown[userName] = userGroup.Count();
                    }

                    timeline.Add(new TimelineDataDto
                    {
                        Date = day.Date,
                        TotalCompletions = day.Chores.Count,
                        UserBreakdown = userBreakdown
                    });
                }

                _logger.LogInformation("Timeline data generated for group {GroupId}, {Days} days of data",
                    groupId, timeline.Count);

                return Ok(timeline);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating timeline data for group {GroupId}", groupId);
                return StatusCode(500, "An error occurred while generating timeline data");
            }
        }

        [HttpGet("task-breakdown")]
        public async Task<IActionResult> GetTaskBreakdown(
            int groupId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            try
            {
                var user = await GetCurrentUserAsync();
                if (user == null) return Unauthorized();

                var isMember = await IsUserGroupMemberAsync(groupId, user.Id);
                if (!isMember)
                {
                    _logger.LogWarning("User {UserId} attempted to access task breakdown for group {GroupId}", user.Id, groupId);
                    return Forbid();
                }

                var start = startDate ?? DateTime.UtcNow.AddDays(-30);
                var end = endDate ?? DateTime.UtcNow;

                var chores = await _context.Chores
                    .Where(c => c.GroupId == groupId)
                    .ToListAsync();

                var todoCount = chores.Count(c => c.Status == ChoreStatus.Todo);
                var inProgressCount = chores.Count(c => c.Status == ChoreStatus.InProgress);
                var doneCount = chores.Count(c => c.Status == ChoreStatus.Done);
                var totalTasks = chores.Count;

                var breakdown = new TaskBreakdownDto
                {
                    TodoCount = todoCount,
                    InProgressCount = inProgressCount,
                    DoneCount = doneCount,
                    TotalTasks = totalTasks,
                    TodoPercentage = totalTasks > 0 ? Math.Round((double)todoCount / totalTasks * 100, 2) : 0,
                    InProgressPercentage = totalTasks > 0 ? Math.Round((double)inProgressCount / totalTasks * 100, 2) : 0,
                    DonePercentage = totalTasks > 0 ? Math.Round((double)doneCount / totalTasks * 100, 2) : 0
                };

                _logger.LogInformation("Task breakdown generated for group {GroupId}", groupId);

                return Ok(breakdown);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating task breakdown for group {GroupId}", groupId);
                return StatusCode(500, "An error occurred while generating task breakdown");
            }
        }

        [HttpGet("activity-heatmap")]
        public async Task<IActionResult> GetActivityHeatmap(
            int groupId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            try
            {
                var user = await GetCurrentUserAsync();
                if (user == null) return Unauthorized();

                var isMember = await IsUserGroupMemberAsync(groupId, user.Id);
                if (!isMember)
                {
                    _logger.LogWarning("User {UserId} attempted to access activity heatmap for group {GroupId}", user.Id, groupId);
                    return Forbid();
                }

                var start = startDate ?? DateTime.UtcNow.AddDays(-30);
                var end = endDate ?? DateTime.UtcNow;

                start = DateTime.SpecifyKind(start, DateTimeKind.Utc);
                end = DateTime.SpecifyKind(end, DateTimeKind.Utc);

                var completedChores = await _context.ChoreCompletion
                    .Where(cc => cc.GroupId == groupId &&
                           cc.CompletedOn >= start &&
                           cc.CompletedOn <= end)
                    .Select(cc => cc.CompletedOn)
                    .ToListAsync();

                var heatmapData = completedChores
                    .GroupBy(dt => new { DayOfWeek = (int)dt.DayOfWeek, Hour = dt.Hour })
                    .Select(g => new ActivityHeatmapDto
                    {
                        DayOfWeek = g.Key.DayOfWeek,
                        DayName = ((DayOfWeek)g.Key.DayOfWeek).ToString(),
                        Hour = g.Key.Hour,
                        CompletionCount = g.Count()
                    })
                    .OrderBy(h => h.DayOfWeek)
                    .ThenBy(h => h.Hour)
                    .ToList();

                _logger.LogInformation("Activity heatmap generated for group {GroupId}, {DataPoints} data points",
                    groupId, heatmapData.Count);

                return Ok(heatmapData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating activity heatmap for group {GroupId}", groupId);
                return StatusCode(500, "An error occurred while generating activity heatmap");
            }
        }

        [HttpGet("day-of-week-stats")]
        public async Task<IActionResult> GetDayOfWeekStats(
            int groupId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            try
            {
                var user = await GetCurrentUserAsync();
                if (user == null) return Unauthorized();

                var isMember = await IsUserGroupMemberAsync(groupId, user.Id);
                if (!isMember)
                {
                    _logger.LogWarning("User {UserId} attempted to access day stats for group {GroupId}", user.Id, groupId);
                    return Forbid();
                }

                var start = startDate ?? DateTime.UtcNow.AddDays(-30);
                var end = endDate ?? DateTime.UtcNow;

                start = DateTime.SpecifyKind(start, DateTimeKind.Utc);
                end = DateTime.SpecifyKind(end, DateTimeKind.Utc);

                var completedChores = await _context.ChoreCompletion
                    .Where(cc => cc.GroupId == groupId &&
                           cc.CompletedOn >= start &&
                           cc.CompletedOn <= end)
                    .Select(cc => cc.CompletedOn)
                    .ToListAsync();

                var totalCompletions = completedChores.Count;

                var dayStats = completedChores
                    .GroupBy(dt => dt.DayOfWeek)
                    .Select(g => new DayOfWeekStatsDto
                    {
                        DayOfWeek = (int)g.Key,
                        DayName = g.Key.ToString(),
                        CompletionCount = g.Count(),
                        Percentage = totalCompletions > 0
                            ? Math.Round((double)g.Count() / totalCompletions * 100, 2)
                            : 0
                    })
                    .OrderBy(d => d.DayOfWeek)
                    .ToList();

                _logger.LogInformation("Day of week stats generated for group {GroupId}", groupId);

                return Ok(dayStats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating day of week stats for group {GroupId}", groupId);
                return StatusCode(500, "An error occurred while generating day of week stats");
            }
        }

        [HttpGet("hour-of-day-stats")]
        public async Task<IActionResult> GetHourOfDayStats(
            int groupId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            try
            {
                var user = await GetCurrentUserAsync();
                if (user == null) return Unauthorized();

                var isMember = await IsUserGroupMemberAsync(groupId, user.Id);
                if (!isMember)
                {
                    _logger.LogWarning("User {UserId} attempted to access hour stats for group {GroupId}", user.Id, groupId);
                    return Forbid();
                }

                var start = startDate ?? DateTime.UtcNow.AddDays(-30);
                var end = endDate ?? DateTime.UtcNow;

                start = DateTime.SpecifyKind(start, DateTimeKind.Utc);
                end = DateTime.SpecifyKind(end, DateTimeKind.Utc);

                var completedChores = await _context.ChoreCompletion
                    .Where(cc => cc.GroupId == groupId &&
                           cc.CompletedOn >= start &&
                           cc.CompletedOn <= end)
                    .Select(cc => cc.CompletedOn)
                    .ToListAsync();

                var totalCompletions = completedChores.Count;

                var hourStats = completedChores
                    .GroupBy(dt => dt.Hour)
                    .Select(g => new HourOfDayStatsDto
                    {
                        Hour = g.Key,
                        TimeRange = FormatTimeRange(g.Key),
                        CompletionCount = g.Count(),
                        Percentage = totalCompletions > 0
                            ? Math.Round((double)g.Count() / totalCompletions * 100, 2)
                            : 0
                    })
                    .OrderBy(h => h.Hour)
                    .ToList();

                _logger.LogInformation("Hour of day stats generated for group {GroupId}", groupId);

                return Ok(hourStats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating hour of day stats for group {GroupId}", groupId);
                return StatusCode(500, "An error occurred while generating hour of day stats");
            }
        }

        [HttpGet("chore-types")]
        public async Task<IActionResult> GetChoreTypeStats(
            int groupId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            try
            {
                var user = await GetCurrentUserAsync();
                if (user == null) return Unauthorized();

                var isMember = await IsUserGroupMemberAsync(groupId, user.Id);
                if (!isMember)
                {
                    _logger.LogWarning("User {UserId} attempted to access chore type stats for group {GroupId}", user.Id, groupId);
                    return Forbid();
                }

                var start = startDate ?? DateTime.UtcNow.AddDays(-30);
                var end = endDate ?? DateTime.UtcNow;

                start = DateTime.SpecifyKind(start, DateTimeKind.Utc);
                end = DateTime.SpecifyKind(end, DateTimeKind.Utc);

                var completions = await _context.ChoreCompletion
                    .Where(cc => cc.GroupId == groupId &&
                           cc.CompletedOn >= start &&
                           cc.CompletedOn <= end)
                    .Include(cc => cc.Chore)
                    .Include(cc => cc.User)
                    .ToListAsync();

                var totalCompletions = completions.Count;

                var choreTypeGroups = completions
                    .GroupBy(cc => new { cc.ChoreId, ChoreName = cc.Chore.Name })
                    .OrderByDescending(g => g.Count())
                    .ToList();

                var stats = new List<ChoreTypeStatsDto>();

                foreach (var choreType in choreTypeGroups)
                {
                    var lastCompletion = choreType
                        .OrderByDescending(cc => cc.CompletedOn)
                        .First();

                    var mostFrequentCompleter = choreType
                        .GroupBy(cc => cc.User)
                        .OrderByDescending(g => g.Count())
                        .Select(g => $"{g.Key.FirstName} {g.Key.LastName}".Trim())
                        .FirstOrDefault() ?? "Unknown";

                    var percentage = totalCompletions > 0
                        ? (double)choreType.Count() / totalCompletions * 100
                        : 0;

                    stats.Add(new ChoreTypeStatsDto
                    {
                        ChoreName = choreType.Key.ChoreName,
                        CompletionCount = choreType.Count(),
                        Percentage = Math.Round(percentage, 2),
                        LastCompleted = lastCompletion.CompletedOn,
                        MostFrequentCompleter = mostFrequentCompleter
                    });
                }

                _logger.LogInformation("Chore type stats generated for group {GroupId}, {Types} chore types found",
                    groupId, stats.Count);

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating chore type stats for group {GroupId}", groupId);
                return StatusCode(500, "An error occurred while generating chore type stats");
            }
        }

        private string FormatTimeRange(int hour)
        {
            var nextHour = (hour + 1) % 24;
            var startTime = DateTime.Today.AddHours(hour).ToString("h tt", CultureInfo.InvariantCulture);
            var endTime = DateTime.Today.AddHours(nextHour).ToString("h tt", CultureInfo.InvariantCulture);
            return $"{startTime} - {endTime}";
        }
    }
}
