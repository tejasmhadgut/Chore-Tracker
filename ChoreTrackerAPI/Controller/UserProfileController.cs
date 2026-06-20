using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.Models;
using ChoreTrackerAPI.ServiceInterfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace ChoreTrackerAPI.Controller
{
    public class MemberStatisticsDto
    {
        [JsonProperty("totalChoresCompleted")]
        public int TotalChoresCompleted { get; set; }
        [JsonProperty("completionRate")]
        public double CompletionRate { get; set; }
        [JsonProperty("averageCompletionsPerWeek")]
        public double AverageCompletionsPerWeek { get; set; }
        [JsonProperty("mostActiveGroup")]
        public string MostActiveGroup { get; set; } = "";
        [JsonProperty("totalSharedGroups")]
        public int TotalSharedGroups { get; set; }
        [JsonProperty("recentStreak")]
        public int RecentStreak { get; set; }
    }

    [Route("api/users")]
    [ApiController]
    [Authorize]
    public class UserProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ICacheService _cacheService;
        private readonly ILogger<UserProfileController> _logger;

        public UserProfileController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ICacheService cacheService,
            ILogger<UserProfileController> logger)
        {
            _context = context;
            _userManager = userManager;
            _cacheService = cacheService;
            _logger = logger;
        }

        /// <summary>
        /// Verify if current user and target user are chore buddies (share at least one group)
        /// </summary>
        private async Task<bool> AreChorebuddiesAsync(string currentUserId, string targetUserId)
        {
            var currentUserGroups = await _context.GroupMember
                .Where(gm => gm.UserId == currentUserId)
                .Select(gm => gm.GroupId)
                .ToListAsync();

            var targetUserGroups = await _context.GroupMember
                .Where(gm => gm.UserId == targetUserId)
                .Select(gm => gm.GroupId)
                .ToListAsync();

            return currentUserGroups.Intersect(targetUserGroups).Any();
        }

        /// <summary>
        /// Get basic profile information for a user
        /// Only accessible to chore buddies (users who share at least one group)
        /// </summary>
        [HttpGet("{userId}/profile")]
        public async Task<IActionResult> GetProfile([FromRoute] string userId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(currentUserId))
                {
                    _logger.LogWarning("GetProfile: Current user not found");
                    return Unauthorized("User not authenticated");
                }

                // Verify target user exists
                var targetUser = await _userManager.FindByIdAsync(userId);
                if (targetUser == null)
                {
                    _logger.LogWarning("GetProfile: Target user {UserId} not found", userId);
                    return NotFound("User not found");
                }

                // Verify they are chore buddies
                var areChorebuddies = await AreChorebuddiesAsync(currentUserId, userId);
                if (!areChorebuddies)
                {
                    _logger.LogWarning("GetProfile: Access denied - {CurrentUserId} and {TargetUserId} are not chore buddies",
                        currentUserId, userId);
                    return StatusCode(403, "You can only view profiles of members you share groups with");
                }

                var profileDto = new
                {
                    userId = targetUser.Id,
                    firstName = targetUser.FirstName,
                    lastName = targetUser.LastName,
                    username = targetUser.UserName,
                    email = targetUser.Email,
                    profilePictureUrl = targetUser.ProfilePictureUrl
                };

                _logger.LogDebug("GetProfile: Retrieved profile for user {UserId}", userId);
                return Ok(profileDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetProfile: Error retrieving profile for user {UserId}", userId);
                return StatusCode(500, "An error occurred while retrieving the profile");
            }
        }

        /// <summary>
        /// Get all groups shared between current user and target user
        /// </summary>
        [HttpGet("{userId}/shared-groups")]
        public async Task<IActionResult> GetSharedGroups([FromRoute] string userId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(currentUserId))
                {
                    _logger.LogWarning("GetSharedGroups: Current user not found");
                    return Unauthorized("User not authenticated");
                }

                // Verify target user exists
                if (!await _userManager.Users.AnyAsync(u => u.Id == userId))
                {
                    _logger.LogWarning("GetSharedGroups: Target user {UserId} not found", userId);
                    return NotFound("User not found");
                }

                // Verify they are chore buddies
                var areChorebuddies = await AreChorebuddiesAsync(currentUserId, userId);
                if (!areChorebuddies)
                {
                    _logger.LogWarning("GetSharedGroups: Access denied - {CurrentUserId} and {TargetUserId} are not chore buddies",
                        currentUserId, userId);
                    return StatusCode(403, "You can only view profiles of members you share groups with");
                }

                // Get groups where both users are members
                var currentUserGroupIds = await _context.GroupMember
                    .Where(gm => gm.UserId == currentUserId)
                    .Select(gm => gm.GroupId)
                    .ToListAsync();

                var sharedGroups = await _context.Groups
                    .Where(g => currentUserGroupIds.Contains(g.Id) &&
                                g.Members.Any(m => m.UserId == userId))
                    .AsNoTracking()
                    .Select(g => new
                    {
                        id = g.Id,
                        name = g.Name,
                        description = g.Description,
                        memberCount = g.Members.Count,
                        createdAt = g.createdAt
                    })
                    .ToListAsync();

                _logger.LogDebug("GetSharedGroups: Retrieved {Count} shared groups for user {UserId}",
                    sharedGroups.Count, userId);
                return Ok(sharedGroups);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetSharedGroups: Error retrieving shared groups for user {UserId}", userId);
                return StatusCode(500, "An error occurred while retrieving shared groups");
            }
        }

        /// <summary>
        /// Get recent activities from a user (only from shared groups)
        /// </summary>
        [HttpGet("{userId}/activities")]
        public async Task<IActionResult> GetActivities([FromRoute] string userId, [FromQuery] int limit = 15)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(currentUserId))
                {
                    _logger.LogWarning("GetActivities: Current user not found");
                    return Unauthorized("User not authenticated");
                }

                // Verify target user exists
                if (!await _userManager.Users.AnyAsync(u => u.Id == userId))
                {
                    _logger.LogWarning("GetActivities: Target user {UserId} not found", userId);
                    return NotFound("User not found");
                }

                // Verify they are chore buddies
                var areChorebuddies = await AreChorebuddiesAsync(currentUserId, userId);
                if (!areChorebuddies)
                {
                    _logger.LogWarning("GetActivities: Access denied - {CurrentUserId} and {TargetUserId} are not chore buddies",
                        currentUserId, userId);
                    return StatusCode(403, "You can only view activities of members you share groups with");
                }

                // Get shared group IDs
                var currentUserGroupIds = await _context.GroupMember
                    .Where(gm => gm.UserId == currentUserId)
                    .Select(gm => gm.GroupId)
                    .ToListAsync();

                // Get recent activities from shared groups
                var activities = await _context.ChoreCompletion
                    .Where(cc => cc.UserId == userId && currentUserGroupIds.Contains(cc.GroupId))
                    .AsNoTracking()
                    .OrderByDescending(cc => cc.CompletedOn)
                    .Take(limit)
                    .Select(cc => new
                    {
                        type = "completion",
                        timestamp = cc.CompletedOn,
                        actor = cc.User.FirstName + " " + cc.User.LastName,
                        actorUsername = cc.User.UserName,
                        actorUserId = cc.User.Id,
                        groupName = cc.Group.Name,
                        groupId = cc.GroupId,
                        details = cc.Chore.Name,
                        actorProfilePictureUrl = cc.User.ProfilePictureUrl
                    })
                    .ToListAsync();

                _logger.LogDebug("GetActivities: Retrieved {Count} activities for user {UserId}",
                    activities.Count, userId);
                return Ok(activities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetActivities: Error retrieving activities for user {UserId}", userId);
                return StatusCode(500, "An error occurred while retrieving activities");
            }
        }

        /// <summary>
        /// Get statistics for a user (calculated from shared groups only)
        /// </summary>
        [HttpGet("{userId}/statistics")]
        public async Task<IActionResult> GetStatistics([FromRoute] string userId)
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(currentUserId))
                {
                    _logger.LogWarning("GetStatistics: Current user not found");
                    return Unauthorized("User not authenticated");
                }

                // Check cache first
                var cacheKey = $"member-stats:{userId}:{currentUserId}";
                var cachedStats = await _cacheService.GetAsync<MemberStatisticsDto>(cacheKey);
                if (cachedStats != null)
                {
                    _logger.LogDebug("GetStatistics: Cache hit for user {UserId}", userId);
                    return Ok(cachedStats);
                }

                // Verify target user exists
                if (!await _userManager.Users.AnyAsync(u => u.Id == userId))
                {
                    _logger.LogWarning("GetStatistics: Target user {UserId} not found", userId);
                    return NotFound("User not found");
                }

                // Verify they are chore buddies
                var areChorebuddies = await AreChorebuddiesAsync(currentUserId, userId);
                if (!areChorebuddies)
                {
                    _logger.LogWarning("GetStatistics: Access denied - {CurrentUserId} and {TargetUserId} are not chore buddies",
                        currentUserId, userId);
                    return StatusCode(403, "You can only view statistics of members you share groups with");
                }

                // Get shared group IDs
                var currentUserGroupIds = await _context.GroupMember
                    .Where(gm => gm.UserId == currentUserId)
                    .Select(gm => gm.GroupId)
                    .ToListAsync();

                // Calculate statistics from shared groups only
                var completions = await _context.ChoreCompletion
                    .Where(cc => cc.UserId == userId && currentUserGroupIds.Contains(cc.GroupId))
                    .AsNoTracking()
                    .ToListAsync();

                var totalChoresCompleted = completions.Count;

                // Calculate completion rate (chores completed vs total chores in shared groups)
                var totalChoresInSharedGroups = await _context.Chores
                    .Where(c => currentUserGroupIds.Contains(c.GroupId))
                    .AsNoTracking()
                    .CountAsync();

                var completionRate = totalChoresInSharedGroups > 0
                    ? Math.Round((double)totalChoresCompleted / totalChoresInSharedGroups * 100, 2)
                    : 0.0;

                // Calculate average completions per week
                var oldestCompletion = completions.OrderBy(c => c.CompletedOn).FirstOrDefault();
                var weeksActive = oldestCompletion != null
                    ? Math.Max(1, (int)Math.Ceiling((DateTime.UtcNow - oldestCompletion.CompletedOn).TotalDays / 7.0))
                    : 1;
                var averageCompletionsPerWeek = Math.Round((double)totalChoresCompleted / weeksActive, 2);

                // Find most active group
                var mostActiveGroupQuery = await _context.ChoreCompletion
                    .Where(cc => cc.UserId == userId && currentUserGroupIds.Contains(cc.GroupId))
                    .Include(cc => cc.Group)
                    .AsNoTracking()
                    .ToListAsync();

                var mostActiveGroup = mostActiveGroupQuery
                    .GroupBy(cc => new { cc.GroupId, cc.Group.Name })
                    .OrderByDescending(g => g.Count())
                    .FirstOrDefault();

                var mostActiveGroupName = mostActiveGroup?.Key.Name ?? "";

                // Calculate recent streak (consecutive days with completions)
                var recentStreak = CalculateStreak(completions);

                var statistics = new MemberStatisticsDto
                {
                    TotalChoresCompleted = totalChoresCompleted,
                    CompletionRate = completionRate,
                    AverageCompletionsPerWeek = averageCompletionsPerWeek,
                    MostActiveGroup = mostActiveGroupName,
                    TotalSharedGroups = currentUserGroupIds.Count,
                    RecentStreak = recentStreak
                };

                // Cache for 15 minutes
                await _cacheService.SetAsync(cacheKey, statistics, TimeSpan.FromMinutes(15));

                _logger.LogDebug("GetStatistics: Retrieved statistics for user {UserId}", userId);
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetStatistics: Error retrieving statistics for user {UserId}", userId);
                return StatusCode(500, "An error occurred while retrieving statistics");
            }
        }

        /// <summary>
        /// Calculate the number of consecutive days with chore completions (recent streak)
        /// </summary>
        private int CalculateStreak(List<ChoreCompletion> completions)
        {
            if (completions.Count == 0) return 0;

            var sortedDates = completions
                .Select(c => c.CompletedOn.Date)
                .Distinct()
                .OrderByDescending(d => d)
                .ToList();

            if (sortedDates.Count == 0) return 0;

            int streak = 1;
            for (int i = 0; i < sortedDates.Count - 1; i++)
            {
                if ((sortedDates[i] - sortedDates[i + 1]).TotalDays == 1)
                {
                    streak++;
                }
                else
                {
                    break;
                }
            }

            return streak;
        }
    }
}
