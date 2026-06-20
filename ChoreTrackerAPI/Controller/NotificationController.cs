using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.Models;
using ChoreTrackerAPI.Dtos;
using Microsoft.AspNetCore.Identity;

namespace ChoreTrackerAPI.Controller
{
    [Route("api/notifications")]
    [ApiController]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<NotificationController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        private async Task<ApplicationUser?> GetCurrentUserAsync()
        {
            var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
            if (string.IsNullOrEmpty(userEmail))
            {
                return null;
            }
            return await _userManager.FindByEmailAsync(userEmail);
        }

        [HttpGet]
        public async Task<ActionResult<NotificationListDto>> GetNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var user = await GetCurrentUserAsync();
                if (user == null)
                {
                    return Unauthorized();
                }

                // Validate pagination
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;

                var skip = (page - 1) * pageSize;

                var totalCount = await _context.Notifications
                    .CountAsync(n => n.UserId == user.Id);

                var notifications = await _context.Notifications
                    .Where(n => n.UserId == user.Id)
                    .Include(n => n.Actor)
                    .Include(n => n.Chore)
                    .Include(n => n.Group)
                    .OrderByDescending(n => n.CreatedAt)
                    .Skip(skip)
                    .Take(pageSize)
                    .Select(n => new NotificationDto
                    {
                        Id = n.Id,
                        Type = n.Type,
                        Message = n.Message,
                        ChoreId = n.ChoreId,
                        ChoreName = n.Chore != null ? n.Chore.Name : null,
                        GroupId = n.GroupId,
                        GroupName = n.Group != null ? n.Group.Name : "",
                        IsRead = n.IsRead,
                        CreatedAt = n.CreatedAt,
                        Actor = n.Actor != null ? new ActorDto
                        {
                            Id = n.Actor.Id,
                            FirstName = n.Actor.FirstName,
                            ProfilePictureUrl = n.Actor.ProfilePictureUrl ?? ""
                        } : null
                    })
                    .ToListAsync();

                var response = new NotificationListDto
                {
                    Notifications = notifications,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    HasMore = skip + pageSize < totalCount
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notifications");
                return StatusCode(500, "An error occurred while retrieving notifications");
            }
        }

        [HttpGet("unread-count")]
        public async Task<ActionResult<UnreadCountDto>> GetUnreadCount()
        {
            try
            {
                var user = await GetCurrentUserAsync();
                if (user == null)
                {
                    return Unauthorized();
                }

                var unreadCount = await _context.Notifications
                    .CountAsync(n => n.UserId == user.Id && !n.IsRead);

                return Ok(new UnreadCountDto { UnreadCount = unreadCount });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving unread count");
                return StatusCode(500, "An error occurred while retrieving unread count");
            }
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var user = await GetCurrentUserAsync();
                if (user == null)
                {
                    return Unauthorized();
                }

                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == id && n.UserId == user.Id);

                if (notification == null)
                {
                    return NotFound("Notification not found");
                }

                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;

                _context.Notifications.Update(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Notification {NotificationId} marked as read", id);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification as read");
                return StatusCode(500, "An error occurred while marking notification as read");
            }
        }

        [HttpPut("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var user = await GetCurrentUserAsync();
                if (user == null)
                {
                    return Unauthorized();
                }

                var unreadNotifications = await _context.Notifications
                    .Where(n => n.UserId == user.Id && !n.IsRead)
                    .ToListAsync();

                foreach (var notification in unreadNotifications)
                {
                    notification.IsRead = true;
                    notification.ReadAt = DateTime.UtcNow;
                }

                _context.Notifications.UpdateRange(unreadNotifications);
                await _context.SaveChangesAsync();

                _logger.LogInformation("All notifications marked as read for user {UserId}", user.Id);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read");
                return StatusCode(500, "An error occurred while marking notifications as read");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            try
            {
                var user = await GetCurrentUserAsync();
                if (user == null)
                {
                    return Unauthorized();
                }

                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == id && n.UserId == user.Id);

                if (notification == null)
                {
                    return NotFound("Notification not found");
                }

                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Notification {NotificationId} deleted", id);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification");
                return StatusCode(500, "An error occurred while deleting notification");
            }
        }

        [HttpDelete("clear-all")]
        public async Task<IActionResult> ClearAllRead()
        {
            try
            {
                var user = await GetCurrentUserAsync();
                if (user == null)
                {
                    return Unauthorized();
                }

                var readNotifications = await _context.Notifications
                    .Where(n => n.UserId == user.Id && n.IsRead)
                    .ToListAsync();

                _context.Notifications.RemoveRange(readNotifications);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Read notifications cleared for user {UserId}", user.Id);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing read notifications");
                return StatusCode(500, "An error occurred while clearing notifications");
            }
        }
    }
}
