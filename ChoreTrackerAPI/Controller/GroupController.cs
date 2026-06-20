using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.Dtos;
using ChoreTrackerAPI.Models;
using ChoreTrackerAPI.Models.Dtos;
using ChoreTrackerAPI.ServiceInterfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SendGrid;
using Hangfire;
using ChoreTrackerAPI.BackgroundJobs;
using MassTransit;
using ChoreTrackerAPI.Messages;

namespace ChoreTrackerAPI.Controller
{
    [Route("api/groups")]
    [ApiController]
    public class GroupController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ReadOnlyDbContext _readContext;
        private readonly  IEmailService _emailService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<GroupController> _logger;
        private readonly ICacheService _cacheService;
        private readonly IPublishEndpoint _publishEndpoint;

        public GroupController(ApplicationDbContext context, ReadOnlyDbContext readContext, IEmailService emailService, UserManager<ApplicationUser> userManager, ILogger<GroupController> logger, ICacheService cacheService, IPublishEndpoint publishEndpoint)
        {
            _context = context;
            _readContext = readContext;
            _emailService = emailService;
            _userManager = userManager;
            _logger = logger;
            _cacheService = cacheService;
            _publishEndpoint = publishEndpoint;
        }
        
        [Authorize]
        [HttpPost("create")]
        public async Task<IActionResult> CreateGroup([FromBody] GroupCreateRequest request)
        {
            var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
            _logger.LogInformation("CreateGroup request received. User email: {UserEmail}, Request: {Request}", userEmail, JsonConvert.SerializeObject(request));

            if(string.IsNullOrEmpty(userEmail))
            {
                _logger.LogWarning("CreateGroup failed: User email not found in claims");
                return Unauthorized("User not authenticated");
            }

            var creator = await _userManager.FindByEmailAsync(userEmail);
            if(creator == null)
            {
                _logger.LogWarning("CreateGroup failed: User not found for email {UserEmail}", userEmail);
                return Unauthorized("User not found");
            }

            var group = new Group{
                Name = request.Name,
                Description = request.Description,
                InviteCode = Guid.NewGuid().ToString("N"),
                createdAt = DateTime.UtcNow,
                CreatorId = creator.Id
            };

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
               _context.Groups.Add(group);

                var groupMember = new GroupMember
                {
                    User = creator,
                    Group = group
                };

                _context.GroupMember.Add(groupMember);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Group created successfully. GroupId: {GroupId}, CreatorId: {CreatorId}", group.Id, creator.Id);

                // Invalidate creator's groups cache
                await _cacheService.RemoveAsync($"user:{creator.Id}:groups");

                // Queue email invitations asynchronously via Hangfire
                // API returns immediately in <500ms; emails are sent in background
                if (request.MemberEmails != null && request.MemberEmails.Any())
                {
                    // Enqueue background job to send all invites
                    BackgroundJob.Enqueue<EmailJobs>(job =>
                        job.SendBulkInviteEmailsJob(
                            creator.Id,
                            creator.UserName,
                            request.MemberEmails.ToList(),
                            group.InviteCode));

                    _logger.LogInformation("Hangfire: Enqueued {EmailCount} invite emails for group {GroupId}",
                        request.MemberEmails.Count(), group.Id);

                    // Enqueue individual email jobs for each recipient
                    foreach (var email in request.MemberEmails)
                    {
                        BackgroundJob.Enqueue<EmailJobs>(job =>
                            job.SendInviteEmailJob(
                                creator.Id,
                                creator.UserName,
                                email,
                                group.InviteCode));

                        _logger.LogDebug("Hangfire: Enqueued individual invite email to {Email}", email);
                    }
                }

                return Ok(new {GroupId = group.Id, InviteCode = group.InviteCode});
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to create group. User: {UserEmail}, GroupName: {GroupName}", userEmail, request.Name);
                return StatusCode(500, "Failed to create group.");
            }

        }
        
        [Authorize]
        [HttpPost("get-group")]
        public async Task<IActionResult> GetGroupByInviteCode([FromBody] GetGroupDto request)
        {
            _logger.LogInformation("GetGroupByInviteCode request received. InviteCode: {InviteCode}", request.InviteCode);

            var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
            if (string.IsNullOrEmpty(userEmail))
            {
                _logger.LogWarning("GetGroupByInviteCode failed: User email not found in claims");
                return Unauthorized("User not authenticated");
            }

            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user == null)
            {
                _logger.LogWarning("GetGroupByInviteCode failed: User not found for email {UserEmail}", userEmail);
                return Unauthorized("User not found");
            }

            var group = await _context.Groups
                .Include(g => g.Members)
                .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(g => g.InviteCode == request.InviteCode);

            if (group == null)
            {
                _logger.LogWarning("GetGroupByInviteCode failed: Group not found for InviteCode {InviteCode}", request.InviteCode);
                return NotFound("Group not found");
            }

            var existingUser = await _context.GroupMember
                .FirstOrDefaultAsync(gm => gm.UserId == user.Id && gm.GroupId == group.Id);

            if (existingUser != null)
            {
                _logger.LogInformation("User {UserId} is already a member of group {GroupId}", user.Id, group.Id);
                return BadRequest("User is already a member of this group");
            }

            var memberNames = group.Members
            .Where(m => m.User != null)
            .Select(m => $"{m.User.FirstName} {m.User.LastName}")
            .ToList();

            _logger.LogInformation("GetGroupByInviteCode successful. GroupId: {GroupId}, User: {UserEmail}", group.Id, userEmail);

            return Ok(new
            {
                group.Id,
                group.Name,
                group.Description,
                group.createdAt,
                MemberNames = memberNames
            });
        }

        [Authorize]
        [HttpPost("join")]
        public async Task<IActionResult> JoinGroup([FromBody] GroupJoinRequest request)
        {
            var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
            _logger.LogInformation("JoinGroup request received. GroupId: {GroupId}, User: {UserEmail}", request.groupId, userEmail);

            if(string.IsNullOrEmpty(userEmail))
            {
                _logger.LogWarning("JoinGroup failed: User email not found in claims");
                return Unauthorized("User not authenticated");
            }

            var user = await _userManager.FindByEmailAsync(userEmail);
            if(user == null)
            {
                _logger.LogWarning("JoinGroup failed: User not found for email {UserEmail}", userEmail);
                return Unauthorized("User not found");
            }

            var group = await _context.Groups.Include(g => g.Members).FirstOrDefaultAsync(g => g.Id == request.groupId);
            if(group == null)
            {
                _logger.LogWarning("JoinGroup failed: Group not found for GroupId {GroupId}", request.groupId);
                return NotFound("Group not found");
            }

            var existingUser = await _context.GroupMember.FirstOrDefaultAsync(gm => gm.UserId == user.Id && gm.GroupId == group.Id);
            if(existingUser != null)
            {
                _logger.LogInformation("JoinGroup skipped: User {UserId} is already a member of group {GroupId}", user.Id, group.Id);
                return BadRequest("User is already a member of this group");
            }

            var groupMember = new GroupMember {User = user, Group = group};
            _context.GroupMember.Add(groupMember);
            await _context.SaveChangesAsync();

            // Invalidate user's groups cache when they join a new group
            await _cacheService.RemoveAsync($"user:{user.Id}:groups");

            // Invalidate activities cache for all group members since new member joined
            var groupMembers = await _context.GroupMember
                .Where(gm => gm.GroupId == group.Id)
                .Select(gm => gm.UserId)
                .ToListAsync();

            foreach (var memberId in groupMembers)
            {
                await _cacheService.RemoveByPatternAsync($"activities:user:{memberId}:*");
            }

            await _publishEndpoint.Publish(new MemberJoinedEvent
            {
                GroupId = group.Id,
                GroupName = group.Name,
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                UserFirstName = user.FirstName ?? string.Empty,
                UserLastName = user.LastName ?? string.Empty,
                UserProfilePictureUrl = user.ProfilePictureUrl ?? string.Empty,
                JoinedAt = DateTime.UtcNow
            });

            _logger.LogInformation("User {UserId} successfully joined group {GroupId}", user.Id, group.Id);

            return Ok(new {GroupId = group.Id});
        }
        
        [Authorize]
        [HttpGet("my-groups")]
        public async Task<IActionResult> GetUserGroups()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("GetUserGroups failed: User ID not found in claims");
                return Unauthorized("User not authenticated");
            }

            // Cache key for user's groups - 10 minute TTL
            var cacheKey = $"user:{userId}:groups";

            var groups = await _cacheService.GetOrSetAsync(cacheKey, async () =>
            {
                return await _readContext.GroupMember
                    .Where(gm => gm.UserId == userId)
                    .Include(gm => gm.Group)
                    .ThenInclude(g => g.Members)
                    .AsSplitQuery()
                    .AsNoTracking()
                    .Select(gm => new GroupDto
                    {
                        Id = gm.Group.Id,
                        Name = gm.Group.Name,
                        Description = gm.Group.Description,
                        InviteCode = gm.Group.InviteCode,
                        CreatedAt = gm.Group.createdAt,
                        Members = gm.Group.Members.Select(m => new GroupMember
                        {
                            Id = m.Id,
                            GroupId = m.GroupId,
                            UserId = m.UserId,
                            User = new ApplicationUser
                            {
                                Id = m.User.Id,
                                FirstName = m.User.FirstName,
                                LastName = m.User.LastName,
                                Email = m.User.Email,
                                UserName = m.User.UserName,
                                ProfilePictureUrl = m.User.ProfilePictureUrl
                            }
                        }).ToList()
                    })
                    .ToListAsync();
            }, TimeSpan.FromMinutes(10));

            _logger.LogInformation("GetUserGroups successful. User: {UserId}, GroupCount: {GroupCount}", userId, groups.Count);

            return Ok(groups);
        }

        [Authorize]
        [HttpGet("recent-activities")]
        public async Task<IActionResult> GetRecentActivities([FromQuery] int limit = 20)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("GetRecentActivities failed: User ID not found in claims");
                return Unauthorized("User not authenticated");
            }

            // Cache key for activities - includes user and limit - 5 minute TTL
            var cacheKey = $"activities:user:{userId}:limit:{limit}";

            var recentActivities = await _cacheService.GetOrSetAsync(cacheKey, async () =>
            {
                // Get all group IDs for the current user
                var userGroupIds = await _readContext.GroupMember
                    .Where(gm => gm.UserId == userId)
                    .Select(gm => gm.GroupId)
                    .ToListAsync();

                if (!userGroupIds.Any())
                {
                    return new List<ActivityDto>();
                }

                // Fetch recent activities: chore completions, chore creations, and group memberships
                // Each sub-query is capped at `limit` rows before the union to avoid loading all history
                var choreCompletions = await _readContext.ChoreCompletion
                    .Where(cc => userGroupIds.Contains(cc.GroupId))
                    .OrderByDescending(cc => cc.CompletedOn)
                    .Take(limit)
                    .AsNoTracking()
                    .Select(cc => new ActivityDto
                    {
                        Type = "completion",
                        Timestamp = cc.CompletedOn,
                        Actor = cc.User.FirstName + " " + cc.User.LastName,
                        ActorUsername = cc.User.UserName,
                        ActorUserId = cc.User.Id,
                        GroupName = cc.Group.Name,
                        GroupId = cc.Group.Id,
                        Details = cc.Chore.Name,
                        ActorProfilePictureUrl = cc.User.ProfilePictureUrl
                    })
                    .ToListAsync();

                var choreCreations = await _readContext.Chores
                    .Where(c => userGroupIds.Contains(c.GroupId))
                    .OrderByDescending(c => c.CreatedAt)
                    .Take(limit)
                    .AsNoTracking()
                    .Select(c => new ActivityDto
                    {
                        Type = "chore_created",
                        Timestamp = c.CreatedAt,
                        Actor = "",
                        ActorUsername = "",
                        ActorUserId = "",
                        GroupName = c.Group.Name,
                        GroupId = c.Group.Id,
                        Details = c.Name,
                        ActorProfilePictureUrl = ""
                    })
                    .ToListAsync();

                var groupMemberships = await _readContext.GroupMember
                    .Where(gm => userGroupIds.Contains(gm.GroupId))
                    .OrderByDescending(gm => gm.JoinedAt)
                    .Take(limit)
                    .AsNoTracking()
                    .Select(gm => new ActivityDto
                    {
                        Type = "member_joined",
                        Timestamp = gm.JoinedAt,
                        Actor = gm.User.FirstName + " " + gm.User.LastName,
                        ActorUsername = gm.User.UserName,
                        ActorUserId = gm.User.Id,
                        GroupName = gm.Group.Name,
                        GroupId = gm.Group.Id,
                        Details = "joined the group",
                        ActorProfilePictureUrl = gm.User.ProfilePictureUrl
                    })
                    .ToListAsync();

                // Combine and sort by timestamp (most recent first)
                var allActivities = new List<ActivityDto>();
                allActivities.AddRange(choreCompletions);
                allActivities.AddRange(choreCreations);
                allActivities.AddRange(groupMemberships);

                return allActivities
                    .OrderByDescending(a => a.Timestamp)
                    .Take(limit)
                    .ToList();
            }, TimeSpan.FromMinutes(5));

            _logger.LogInformation("GetRecentActivities successful. User: {UserId}, ActivityCount: {ActivityCount}", userId, recentActivities.Count);

            return Ok(recentActivities);
        }

        [Authorize]
        [HttpGet("group-details/{groupId}")]
        public async Task<IActionResult> GetGroupDetails(int groupId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("GetGroupDetails failed: User ID not found in claims");
                return Unauthorized("User not authenticated");
            }

            // Cache key for group details - 15 minute TTL
            var cacheKey = $"group:{groupId}:details";

            var group = await _cacheService.GetOrSetAsync(cacheKey, async () =>
            {
                return await _readContext.Groups
                    .Include(g => g.Members).ThenInclude(gm => gm.User)
                    .Include(g => g.Chores)
                    .AsSplitQuery()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(g => g.Id == groupId);
            }, TimeSpan.FromMinutes(15));

            if (group == null)
            {
                _logger.LogWarning("GetGroupDetails failed: Group not found for GroupId {GroupId}", groupId);
                return NotFound("Group not found");
            }

            var isMember = group.Members.Any(m => m.UserId == userId);
            if (!isMember)
            {
                _logger.LogWarning("GetGroupDetails forbidden: User {UserId} is not a member of group {GroupId}", userId, groupId);
                return StatusCode(403, "User is not a member of this group");
            }

            var response = new
            {
                GroupId = group.Id,
                Name = group.Name,
                InviteCode = group.InviteCode,
                Description = group.Description,
                Members = group.Members.Select(m => new
                {
                    UserId = m.User.Id,
                    Email = m.User.Email,
                    Name = m.User.UserName,
                    FirstName = m.User.FirstName,
                    LastName = m.User.LastName,
                    ProfilePictureUrl = m.User.ProfilePictureUrl
                }),
                createdAt = group.createdAt
            };

            _logger.LogInformation("GetGroupDetails successful. GroupId: {GroupId}, User: {UserId}", groupId, userId);

            return Ok(response);
        }

        [Authorize]
        [HttpPost("leave/{groupId}")]
        public async Task<IActionResult> LeaveGroup(int groupId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("LeaveGroup failed: User ID not found in claims");
                return Unauthorized("User not authenticated");
            }

            var groupMember = await _context.GroupMember.FirstOrDefaultAsync(gm => gm.UserId == userId && gm.GroupId == groupId);
            if (groupMember == null)
            {
                _logger.LogWarning("LeaveGroup failed: User {UserId} is not a member of group {GroupId}", userId, groupId);
                return NotFound("You are not a member of this group");
            }

            _context.GroupMember.Remove(groupMember);
            await _context.SaveChangesAsync();

            // Invalidate user's groups cache and group details cache
            await _cacheService.RemoveAsync($"user:{userId}:groups");
            await _cacheService.RemoveAsync($"group:{groupId}:details");

            // Invalidate activities cache for all remaining group members
            var groupMembers = await _context.GroupMember
                .Where(gm => gm.GroupId == groupId)
                .Select(gm => gm.UserId)
                .ToListAsync();

            foreach (var memberId in groupMembers)
            {
                await _cacheService.RemoveByPatternAsync($"activities:user:{memberId}:*");
            }

            _logger.LogInformation("User {UserId} successfully left group {GroupId}", userId, groupId);

            return Ok("Successfully left the group");
        }
        [Authorize]
        [HttpDelete("delete/{groupId}")]
        public async Task<IActionResult> DeleteGroup(int groupId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("DeleteGroup failed: User ID not found in claims");
                return Unauthorized("User not authenticated");
            }

            var group = await _context.Groups.Include(g=>g.Members).Include(g=>g.Chores).FirstOrDefaultAsync(g=>g.Id==groupId);
            if(group==null)
            {
                _logger.LogWarning("DeleteGroup failed: Group not found for GroupId {GroupId}", groupId);
                return NotFound("Group not found");
            }

            if(group.CreatorId != userId)
            {
                _logger.LogWarning("DeleteGroup forbidden: User {UserId} is not the creator of group {GroupId}", userId, groupId);
                return Unauthorized("Only the creator can delete this group");
            }

            _context.Groups.Remove(group);
            await _context.SaveChangesAsync();

            // Invalidate cache for all group members
            foreach (var member in group.Members)
            {
                await _cacheService.RemoveAsync($"user:{member.UserId}:groups");
            }
            // Invalidate group details cache
            await _cacheService.RemoveAsync($"group:{groupId}:details");

            _logger.LogInformation("Group {GroupId} successfully deleted by user {UserId}", groupId, userId);

            return Ok("Group deleted successfully");
        }

        [Authorize]
        [HttpGet("{groupId}/leaderboard")]
        public async Task<IActionResult> GetLeaderboard(int groupId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            // Ensure dates are treated as UTC for PostgreSQL compatibility
            startDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
            endDate = DateTime.SpecifyKind(endDate, DateTimeKind.Utc);

            var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
            _logger.LogInformation("GetLeaderboard request received. GroupId: {GroupId}, StartDate: {StartDate}, EndDate: {EndDate}, User: {UserEmail}",
                groupId, startDate, endDate, userEmail);

            if (endDate < startDate)
            {
                _logger.LogWarning("GetLeaderboard failed: Invalid date range. StartDate: {StartDate}, EndDate: {EndDate}", startDate, endDate);
                return BadRequest("Invalid date range");
            }

            try
            {
                var completions = await _readContext.ChoreCompletion
                    .Where(cc => cc.GroupId == groupId && cc.CompletedOn >= startDate && cc.CompletedOn <= endDate)
                    .Include(cc => cc.Chore)
                    .Include(cc => cc.User)
                    .AsNoTracking()
                    .ToListAsync();

                int totalCompletions = completions.Count;
                int totalPoints = completions.Sum(cc => (int)cc.Chore.Difficulty);

                if (totalCompletions == 0)
                {
                    return Ok(new
                    {
                        leaderboard = new List<object>(),
                        completedChores = new List<object>(),
                        summary = new { totalCompletions = 0, totalPoints = 0, topPerformer = "" }
                    });
                }

                var userStats = completions
                    .GroupBy(cc => cc.UserId)
                    .Select(g => new
                    {
                        UserId = g.Key,
                        UserName = g.First().User.UserName,
                        FirstName = g.First().User.FirstName,
                        LastName = g.First().User.LastName,
                        ProfilePictureUrl = g.First().User.ProfilePictureUrl,
                        CompletionCount = g.Count(),
                        TotalPoints = g.Sum(cc => (int)cc.Chore.Difficulty),
                        PointsPercentage = totalPoints > 0 ? Math.Round((g.Sum(cc => (int)cc.Chore.Difficulty) / (double)totalPoints) * 100, 2) : 0,
                        ConsecutiveDays = CalculateStreak(g.Select(cc => cc.CompletedOn).ToList())
                    })
                    .OrderByDescending(g => g.TotalPoints)
                    .ThenByDescending(g => g.CompletionCount)
                    .Select((g, index) => new
                    {
                        Rank = index + 1,
                        g.UserId,
                        g.UserName,
                        g.FirstName,
                        g.LastName,
                        g.ProfilePictureUrl,
                        g.CompletionCount,
                        g.TotalPoints,
                        g.PointsPercentage,
                        g.ConsecutiveDays
                    })
                    .ToList();

                var topPerformer = userStats.FirstOrDefault()?.UserName ?? "";

                var completedChores = completions
                    .GroupBy(cc => cc.ChoreId)
                    .Select(g => new
                    {
                        ChoreName = g.First().Chore.Name,
                        ChoreDescription = g.First().Chore.Description,
                        Difficulty = (int)g.First().Chore.Difficulty,
                        CompletedBy = g.Select(cc => new { cc.User.UserName, cc.CompletedOn }).ToList()
                    })
                    .ToList();

                var result = new
                {
                    leaderboard = userStats,
                    completedChores = completedChores,
                    summary = new
                    {
                        totalCompletions = totalCompletions,
                        totalPoints = totalPoints,
                        topPerformer = topPerformer
                    }
                };

                _logger.LogInformation("GetLeaderboard successful. GroupId: {GroupId}", groupId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting leaderboard for group {GroupId}", groupId);
                return StatusCode(500, "Failed to retrieve leaderboard");
            }
        }

        [Authorize]
        [HttpGet("buddy-recommendations")]
        public async Task<IActionResult> GetBuddyRecommendations()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("GetBuddyRecommendations failed: User ID not found in claims");
                return Unauthorized("User not authenticated");
            }

            // Get all group IDs where the current user is a member
            var userGroupIds = await _readContext.GroupMember
                .Where(gm => gm.UserId == userId)
                .Select(gm => gm.GroupId)
                .ToListAsync();

            if (!userGroupIds.Any())
            {
                _logger.LogInformation("GetBuddyRecommendations: User {UserId} has no groups", userId);
                return Ok(new List<object>());
            }

            // Get all users in those groups (excluding current user) and remove duplicates
            var buddyIds = await _readContext.GroupMember
                .Where(gm => userGroupIds.Contains(gm.GroupId))
                .Where(gm => gm.UserId != userId)  // Exclude self
                .Select(gm => gm.UserId)
                .Distinct()
                .ToListAsync();

            if (!buddyIds.Any())
            {
                _logger.LogInformation("GetBuddyRecommendations: No buddies found for user {UserId}", userId);
                return Ok(new List<object>());
            }

            // Get buddy details and sort alphabetically
            var buddies = await _userManager.Users
                .Where(u => buddyIds.Contains(u.Id))
                .Select(u => new
                {
                    u.Id,
                    u.UserName,
                    u.Email,
                    u.FirstName,
                    u.LastName,
                    u.ProfilePictureUrl
                })
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .ToListAsync();

            _logger.LogInformation("GetBuddyRecommendations successful. User: {UserId}, BuddyCount: {BuddyCount}", userId, buddies.Count);

            return Ok(buddies);
        }

        private int CalculateStreak(List<DateTime> completionDates)
        {
            if (completionDates.Count == 0) return 0;

            var sortedDates = completionDates
                .Select(d => d.Date)
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