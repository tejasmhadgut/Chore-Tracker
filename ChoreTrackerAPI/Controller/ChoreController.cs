using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.Dtos;
using ChoreTrackerAPI.Models;
using ChoreTrackerAPI.Services;
using ChoreTrackerAPI.ServiceInterfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using StackExchange.Redis;
using MassTransit;
using ChoreTrackerAPI.Messages;

namespace ChoreTrackerAPI.Controller
{
    [Route("api/chores")]
    [ApiController]
    [Authorize]
    public class ChoreController: ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IHubContext<ChoreHubService> _choreHub;
        private readonly ILogger<ChoreController> _logger;
        private readonly ICacheService _cacheService;
        private readonly INotificationService _notificationService;
        private readonly IPublishEndpoint _publishEndpoint;

        public ChoreController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            IHubContext<ChoreHubService> choreHub,
            ILogger<ChoreController> logger,
            ICacheService cacheService,
            INotificationService notificationService,
            IPublishEndpoint publishEndpoint)
        {
            _context = context;
            _userManager = userManager;
            _choreHub = choreHub;
            _logger = logger;
            _cacheService = cacheService;
            _notificationService = notificationService;
            _publishEndpoint = publishEndpoint;
        }


        [HttpPost("{groupId}/create")]
        public async Task<IActionResult> CreateChore([FromRoute] int groupId, [FromBody] CreateChoreDto choreDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid payload for CreateChore in group {GroupId}", groupId);
                    return BadRequest(new
                    {
                        message = "Invalid payload",
                        errors = ModelState.Values
                            .SelectMany(v => v.Errors)
                            .Select(e => e.ErrorMessage)
                    });
                }

                var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
                if (string.IsNullOrEmpty(userEmail))
                {
                    _logger.LogWarning("User email claim not found during CreateChore");
                    return Unauthorized("User not authenticated");
                }

                var user = await _userManager.FindByEmailAsync(userEmail);
                if (user == null)
                {
                    _logger.LogWarning("User not found for email {Email}", userEmail);
                    return Unauthorized("User not found");
                }

                // Check if group exists
                var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == groupId);
                if (group == null)
                {
                    _logger.LogWarning("Group {GroupId} not found for CreateChore", groupId);
                    return NotFound("Group not found");
                }

                // Check if the user is a member of the group (N+1 fix)
                var isMember = await _context.GroupMember
                    .AnyAsync(gm => gm.GroupId == groupId && gm.UserId == user.Id);

                if (!isMember)
                {
                    _logger.LogWarning("User {UserId} is not a member of group {GroupId}", user.Id, groupId);
                    return Forbid("You are not a member of this group");
                }

                var chore = new Chore
                {
                    Name = choreDto.Name,
                    Description = choreDto.Description,
                    Status = choreDto.Status,
                    Recurrence = choreDto.RecurrenceType,
                    RecurrenceEndDate = choreDto.RecurrenceEndDate,
                    IntervalDays = choreDto.IntervalDays,
                    Difficulty = choreDto.Difficulty,
                    GroupId = groupId
                };

                _logger.LogInformation("Creating chore with recurrence type: {RecurrenceType}", choreDto.RecurrenceType);

                switch (choreDto.RecurrenceType)
                {
                    case RecurrenceType.Daily:
                        chore.NextOccurence = DateTime.UtcNow.AddDays(1);
                        break;
                    case RecurrenceType.Weekly:
                        chore.NextOccurence = DateTime.UtcNow.AddDays(7);
                        break;
                    case RecurrenceType.Monthly:
                        chore.NextOccurence = DateTime.UtcNow.AddMonths(1);
                        break;
                    case RecurrenceType.Custom:
                        chore.NextOccurence = DateTime.UtcNow.AddDays((double)choreDto.IntervalDays);
                        break;
                }

                _context.Chores.Add(chore);
                await _context.SaveChangesAsync();

                // CRITICAL: Invalidate chores cache IMMEDIATELY so next fetch gets fresh data
                var cacheKey = $"chores:group:{groupId}";
                await _cacheService.RemoveAsync(cacheKey);
                _logger.LogDebug("Invalidated chores cache for group {GroupId}", groupId);

                // Invalidate activities cache for all group members since a new chore was created
                var groupMembers = await _context.GroupMember
                    .Where(gm => gm.GroupId == groupId)
                    .Select(gm => gm.UserId)
                    .ToListAsync();

                foreach (var memberId in groupMembers)
                {
                    await _cacheService.RemoveByPatternAsync($"activities:user:{memberId}:*");
                }

                _logger.LogInformation("Chore {ChoreId} created successfully in group {GroupId}", chore.Id, groupId);

                await _publishEndpoint.Publish(new ChoreCreatedEvent
                {
                    ChoreId = chore.Id,
                    ChoreName = chore.Name,
                    GroupId = groupId,
                    GroupName = group.Name,
                    CreatedAt = chore.CreatedAt
                });

                await _choreHub.Clients.Group($"Group-{groupId}").SendAsync("ChoreCreated", chore);

                return Ok(new
                {
                    Id = chore.Id,
                    Name = chore.Name,
                    Description = chore.Description,
                    Status = (int)chore.Status,
                    RecurrenceType = (int)chore.Recurrence,
                    IntervalDays = chore.IntervalDays,
                    RecurrenceEndDate = chore.RecurrenceEndDate,
                    Difficulty = (int)chore.Difficulty
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating chore in group {GroupId}", groupId);
                return StatusCode(500, "An error occurred while creating the chore");
            }
        }
        
        [HttpGet("group/{groupId}")]
        public async Task<IActionResult> GetChoresByGroup(int groupId)
        {
            try
            {
                _logger.LogInformation("GetChoresByGroup called for group {GroupId}", groupId);

                var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
                if (string.IsNullOrEmpty(userEmail))
                {
                    _logger.LogWarning("User email claim not found during GetChoresByGroup");
                    return Unauthorized("User not authenticated");
                }

                var user = await _userManager.FindByEmailAsync(userEmail);
                if (user == null)
                {
                    _logger.LogWarning("User not found for email {Email}", userEmail);
                    return Unauthorized("User not found");
                }

                // Check if group exists
                var groupExists = await _context.Groups.AnyAsync(g => g.Id == groupId);
                if (!groupExists)
                {
                    _logger.LogWarning("Group {GroupId} not found", groupId);
                    return NotFound("Group not found");
                }

                // Check if the user is a member of the group (N+1 fix)
                var isMember = await _context.GroupMember
                    .AnyAsync(gm => gm.GroupId == groupId && gm.UserId == user.Id);

                if (!isMember)
                {
                    _logger.LogWarning("User {UserId} is not a member of group {GroupId}", user.Id, groupId);
                    return Forbid("You are not a member of this group");
                }

                // Cache key for chores - 5 minute TTL
                var cacheKey = $"chores:group:{groupId}";

                var chores = await _cacheService.GetOrSetAsync(cacheKey, async () =>
                {
                    return await _context.Chores.Where(c => c.GroupId == groupId)
                                                .Select(c => new
                                                {
                                                    c.Id,
                                                    c.Name,
                                                    c.Description,
                                                    c.Recurrence,
                                                    c.RecurrenceEndDate,
                                                    c.Status,
                                                    c.Difficulty
                                                }).ToListAsync();
                }, TimeSpan.FromMinutes(5));

                _logger.LogInformation("Retrieved {Count} chores for group {GroupId}", chores.Count, groupId);

                return Ok(chores);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving chores for group {GroupId}", groupId);
                return StatusCode(500, "An error occurred while retrieving chores");
            }
        }

        [HttpGet("{choreId}")]
        public async Task<IActionResult> GetChoreById(int choreId)
        {
            try
            {
                var chore = await _context.Chores
                    .Where(c => c.Id == choreId)
                    .Select(c => new
                    {
                        c.Id,
                        c.Name,
                        c.Description,
                        c.Recurrence,
                        c.IntervalDays,
                        c.Status,
                        c.GroupId
                    })
                    .FirstOrDefaultAsync();

                if (chore == null)
                {
                    _logger.LogWarning("Chore {ChoreId} not found", choreId);
                    return NotFound("Chore not found");
                }

                _logger.LogInformation("Retrieved chore {ChoreId}", choreId);

                return Ok(chore);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving chore {ChoreId}", choreId);
                return StatusCode(500, "An error occurred while retrieving the chore");
            }
        }

        [HttpPut("update/{choreId}")]
        public async Task<IActionResult> UpdateChore(int choreId, [FromBody] UpdateChoreDto choreDto)
        {
            try
            {
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
                if (string.IsNullOrEmpty(userEmail))
                {
                    _logger.LogWarning("User email claim not found during UpdateChore");
                    return Unauthorized("User not authenticated");
                }

                var user = await _userManager.FindByEmailAsync(userEmail);
                if (user == null)
                {
                    _logger.LogWarning("User not found for email {Email}", userEmail);
                    return Unauthorized("User not found");
                }

                var chore = await _context.Chores
                    .FirstOrDefaultAsync(c => c.Id == choreId);

                if (chore == null)
                {
                    _logger.LogWarning("Chore {ChoreId} not found for update", choreId);
                    return NotFound("Chore not found");
                }

                // Check if the user is a member of the group (N+1 fix)
                var isMember = await _context.GroupMember
                    .AnyAsync(gm => gm.GroupId == chore.GroupId && gm.UserId == user.Id);

                if (!isMember)
                {
                    _logger.LogWarning("User {UserId} is not a member of group {GroupId}", user.Id, chore.GroupId);
                    return Forbid("You are not a member of this group");
                }

                chore.Name = choreDto.Name;
                chore.Description = choreDto.Description;
                chore.Status = choreDto.Status;
                chore.Recurrence = (RecurrenceType)choreDto.Recurrence;
                chore.IntervalDays = choreDto.IntervalDays;
                if (choreDto.Difficulty.HasValue)
                {
                    chore.Difficulty = choreDto.Difficulty.Value;
                }

                _context.Chores.Update(chore);
                await _context.SaveChangesAsync();

                // CRITICAL: Invalidate chores cache IMMEDIATELY so next fetch gets fresh data
                var cacheKey = $"chores:group:{chore.GroupId}";
                await _cacheService.RemoveAsync(cacheKey);
                _logger.LogDebug("Invalidated chores cache for group {GroupId}", chore.GroupId);

                _logger.LogInformation("Chore {ChoreId} updated successfully", choreId);

                return Ok("Chore updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating chore {ChoreId}", choreId);
                return StatusCode(500, "An error occurred while updating the chore");
            }
        }

        [HttpDelete("delete/{choreId}")]
        public async Task<IActionResult> DeleteChore(int choreId)
        {
            try
            {
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
                if (string.IsNullOrEmpty(userEmail))
                {
                    _logger.LogWarning("User email claim not found during DeleteChore");
                    return Unauthorized("User not authenticated");
                }

                var user = await _userManager.FindByEmailAsync(userEmail);
                if (user == null)
                {
                    _logger.LogWarning("User not found for email {Email}", userEmail);
                    return Unauthorized("User not found");
                }

                var chore = await _context.Chores
                    .FirstOrDefaultAsync(c => c.Id == choreId);

                if (chore == null)
                {
                    _logger.LogWarning("Chore {ChoreId} not found for deletion", choreId);
                    return NotFound("Chore not found");
                }

                // Check if the user is a member of the group (N+1 fix)
                var isMember = await _context.GroupMember
                    .AnyAsync(gm => gm.GroupId == chore.GroupId && gm.UserId == user.Id);

                if (!isMember)
                {
                    _logger.LogWarning("User {UserId} is not a member of group {GroupId}", user.Id, chore.GroupId);
                    return Forbid("You are not a member of this group");
                }

                var groupId = chore.GroupId;

                _context.Chores.Remove(chore);
                await _context.SaveChangesAsync();

                // CRITICAL: Invalidate chores cache IMMEDIATELY so next fetch gets fresh data
                var cacheKey = $"chores:group:{groupId}";
                await _cacheService.RemoveAsync(cacheKey);
                _logger.LogDebug("Invalidated chores cache for group {GroupId}", groupId);

                // Invalidate activities cache for all group members since a chore was deleted
                var groupMembers = await _context.GroupMember
                    .Where(gm => gm.GroupId == groupId)
                    .Select(gm => gm.UserId)
                    .ToListAsync();

                foreach (var memberId in groupMembers)
                {
                    await _cacheService.RemoveByPatternAsync($"activities:user:{memberId}:*");
                }

                _logger.LogInformation("Chore {ChoreId} deleted successfully", choreId);

                await _choreHub.Clients.Group($"Group-{groupId}").SendAsync("ChoreDeleted", new { choreId = choreId });

                return Ok("Chore deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting chore {ChoreId}", choreId);
                return StatusCode(500, "An error occurred while deleting the chore");
            }
        }

        [HttpPost("complete/{choreId}")]
        public async Task<IActionResult> CompleteChore(int choreId)
        {
            try
            {
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
                if (string.IsNullOrEmpty(userEmail))
                {
                    _logger.LogWarning("User email claim not found during CompleteChore");
                    return Unauthorized("User not authenticated");
                }

                var user = await _userManager.FindByEmailAsync(userEmail);
                if (user == null)
                {
                    _logger.LogWarning("User not found for email {Email}", userEmail);
                    return Unauthorized("User not found");
                }

                var chore = await _context.Chores
                    .FirstOrDefaultAsync(c => c.Id == choreId);

                if (chore == null)
                {
                    _logger.LogWarning("Chore {ChoreId} not found for completion", choreId);
                    return NotFound("Chore not found");
                }

                // Check if the user is a member of the group (N+1 fix)
                var isMember = await _context.GroupMember
                    .AnyAsync(gm => gm.GroupId == chore.GroupId && gm.UserId == user.Id);

                if (!isMember)
                {
                    _logger.LogWarning("User {UserId} is not a member of group {GroupId}", user.Id, chore.GroupId);
                    return Forbid("You are not a member of this group");
                }

                var completion = new ChoreCompletion
                {
                    UserId = user.Id,
                    ChoreId = choreId,
                    CompletedOn = DateTime.UtcNow,
                    GroupId = chore.GroupId
                };

                _context.ChoreCompletion.Add(completion);
                await _context.SaveChangesAsync();

                // CRITICAL: Invalidate chores cache IMMEDIATELY so next fetch gets fresh data
                var cacheKey = $"chores:group:{chore.GroupId}";
                await _cacheService.RemoveAsync(cacheKey);
                _logger.LogDebug("Invalidated chores cache for group {GroupId}", chore.GroupId);

                // Invalidate activities cache for all group members since a chore was completed
                var groupMembers = await _context.GroupMember
                    .Where(gm => gm.GroupId == chore.GroupId)
                    .Select(gm => gm.UserId)
                    .ToListAsync();

                foreach (var memberId in groupMembers)
                {
                    await _cacheService.RemoveByPatternAsync($"activities:user:{memberId}:*");
                }

                // Send notification to group members about the completion
                try
                {
                    await _notificationService.CreateChoreCompletionNotificationAsync(choreId, user.Id, chore.GroupId);
                    _logger.LogDebug("Notification sent for chore completion {ChoreId}", choreId);
                }
                catch (Exception notificationEx)
                {
                    _logger.LogError(notificationEx, "Failed to send completion notification for chore {ChoreId}", choreId);
                    // Don't fail the request if notification fails, just log it
                }

                var completedGroup = await _context.Groups
                    .Where(g => g.Id == chore.GroupId)
                    .Select(g => g.Name)
                    .FirstOrDefaultAsync() ?? string.Empty;

                await _publishEndpoint.Publish(new ChoreCompletedEvent
                {
                    ChoreId = chore.Id,
                    ChoreName = chore.Name,
                    GroupId = chore.GroupId,
                    GroupName = completedGroup,
                    UserId = user.Id,
                    UserName = user.UserName ?? string.Empty,
                    UserFirstName = user.FirstName ?? string.Empty,
                    UserLastName = user.LastName ?? string.Empty,
                    UserProfilePictureUrl = user.ProfilePictureUrl ?? string.Empty,
                    CompletedOn = completion.CompletedOn
                });

                _logger.LogInformation("Chore {ChoreId} marked as completed by user {UserId}", choreId, user.Id);

                return Ok("Chore marked as completed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing chore {ChoreId}", choreId);
                return StatusCode(500, "An error occurred while completing the chore");
            }
        }

        [HttpPut("update-status/{choreId}")]
        public async Task<IActionResult> UpdateChoreStatus(int choreId, [FromBody] int newStatus)
        {
            try
            {
                _logger.LogInformation("UpdateChoreStatus called with newStatus={NewStatus}", newStatus);

                var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
                if (string.IsNullOrEmpty(userEmail))
                {
                    _logger.LogWarning("User email claim not found during UpdateChoreStatus");
                    return Unauthorized("User not authenticated");
                }

                var user = await _userManager.FindByEmailAsync(userEmail);
                if (user == null)
                {
                    _logger.LogWarning("User not found for email {Email}", userEmail);
                    return Unauthorized("User not found");
                }

                var chore = await _context.Chores
                    .FirstOrDefaultAsync(c => c.Id == choreId);

                if (chore == null)
                {
                    _logger.LogWarning("Chore {ChoreId} not found for status update", choreId);
                    return NotFound("Chore not found");
                }

                // Check if the user is a member of the group (N+1 fix)
                var isMember = await _context.GroupMember
                    .AnyAsync(gm => gm.GroupId == chore.GroupId && gm.UserId == user.Id);

                if (!isMember)
                {
                    _logger.LogWarning("User {UserId} is not a member of group {GroupId}", user.Id, chore.GroupId);
                    return Forbid("You are not a member of this group");
                }

                if (!Enum.IsDefined(typeof(ChoreStatus), newStatus))
                {
                    _logger.LogWarning("Invalid status value {Status} for chore {ChoreId}", newStatus, choreId);
                    return BadRequest("Invalid status Value");
                }

                chore.Status = (ChoreStatus)newStatus;

                _context.Chores.Update(chore);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Chore {ChoreId} status updated to {NewStatus}", choreId, newStatus);

                // CRITICAL: Invalidate chores cache IMMEDIATELY so next fetch gets fresh data
                // This must happen synchronously before returning response
                var cacheKey = $"chores:group:{chore.GroupId}";
                await _cacheService.RemoveAsync(cacheKey);
                _logger.LogDebug("Invalidated chores cache for group {GroupId}", chore.GroupId);

                await _choreHub.Clients.Group($"Group-{chore.GroupId}").SendAsync("ChoreUpdated", chore.Id);

                return Ok(new { Message = "Chore status updated successfully", ChoreId = chore.Id, NewStatus = newStatus });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating status for chore {ChoreId}", choreId);
                return StatusCode(500, "An error occurred while updating the chore status");
            }
        }

        [HttpGet("group/{groupId}/status/{status}")]
        public async Task<IActionResult> GetChoresByStatus(int groupId, ChoreStatus status)
        {
            try
            {
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
                if (string.IsNullOrEmpty(userEmail))
                {
                    _logger.LogWarning("User email claim not found during GetChoresByStatus");
                    return Unauthorized("User not authenticated");
                }

                var user = await _userManager.FindByEmailAsync(userEmail);
                if (user == null)
                {
                    _logger.LogWarning("User not found for email {Email}", userEmail);
                    return Unauthorized("User not found");
                }

                // Check if group exists
                var groupExists = await _context.Groups.AnyAsync(g => g.Id == groupId);
                if (!groupExists)
                {
                    _logger.LogWarning("Group {GroupId} not found", groupId);
                    return NotFound("Group not found");
                }

                // Check if the user is a member of the group (N+1 fix)
                var isMember = await _context.GroupMember
                    .AnyAsync(gm => gm.GroupId == groupId && gm.UserId == user.Id);

                if (!isMember)
                {
                    _logger.LogWarning("User {UserId} is not a member of group {GroupId}", user.Id, groupId);
                    return Forbid("You are not a member of this group");
                }

                var chores = await _context.Chores.Where(c => c.GroupId == groupId && c.Status == status)
                                                .Select(c => new
                                                {
                                                    c.Id,
                                                    c.Name,
                                                    c.Description,
                                                    c.Status
                                                }).ToListAsync();

                _logger.LogInformation("Retrieved {Count} chores with status {Status} for group {GroupId}", chores.Count, status, groupId);

                return Ok(chores);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving chores by status for group {GroupId}", groupId);
                return StatusCode(500, "An error occurred while retrieving chores");
            }
        }

        [HttpGet("{groupId}/completed-chores")]
        public async Task<IActionResult> GetCompletedChores(int groupId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                // Validate date range
                if (endDate < startDate)
                {
                    _logger.LogWarning("Invalid date range: endDate {EndDate} < startDate {StartDate}", endDate, startDate);
                    return BadRequest("Invalid date range");
                }

                // Get all chore completions in the given time period for the group
                var completions = await _context.ChoreCompletion
                    .Where(cc => cc.GroupId == groupId && cc.CompletedOn >= startDate && cc.CompletedOn <= endDate)
                    .Include(cc => cc.Chore)
                    .Include(cc => cc.User)
                    .ToListAsync();

                // If no completions found in this range
                if (!completions.Any())
                {
                    _logger.LogInformation("No completed chores found for group {GroupId} between {StartDate} and {EndDate}", groupId, startDate, endDate);
                    return Ok(new { message = "No completed chores in this period" });
                }

                // List of all completed chores
                var completedChores = completions
                    .GroupBy(cc => cc.ChoreId)
                    .Select(g => new
                    {
                        ChoreName = g.First().Chore.Name,
                        ChoreDescription = g.First().Chore.Description,
                        CompletedBy = g.Select(cc => new { cc.User.UserName, cc.CompletedOn }).ToList()
                    })
                    .ToList();

                _logger.LogInformation("Retrieved {Count} completed chores for group {GroupId}", completedChores.Count, groupId);

                return Ok(completedChores);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving completed chores for group {GroupId}", groupId);
                return StatusCode(500, "An error occurred while retrieving completed chores");
            }
        }

    }
}