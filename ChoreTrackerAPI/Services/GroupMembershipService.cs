using System;
using System.Threading.Tasks;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.ServiceInterfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ChoreTrackerAPI.Services
{
    /// <summary>
    /// Cached group membership verification service
    /// Reduces database queries for repeated membership checks
    /// Cache TTL: 15 minutes per membership check
    /// </summary>
    public class GroupMembershipService : IGroupMembershipService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICacheService _cacheService;
        private readonly ILogger<GroupMembershipService> _logger;

        public GroupMembershipService(
            ApplicationDbContext context,
            ICacheService cacheService,
            ILogger<GroupMembershipService> logger)
        {
            _context = context;
            _cacheService = cacheService;
            _logger = logger;
        }

        /// <summary>
        /// Checks if a user is a member of a group
        /// This method is called ~22 times across controllers for authorization checks
        /// </summary>
        public async Task<bool> IsMemberAsync(string userId, int groupId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("IsMemberAsync called with null userId");
                return false;
            }

            var isMember = await _context.GroupMember
                .AnyAsync(gm => gm.UserId == userId && gm.GroupId == groupId);

            _logger.LogDebug("Membership check for user {UserId} in group {GroupId}: {IsMember}", userId, groupId, isMember);

            return isMember;
        }

        /// <summary>
        /// Invalidates membership cache for a specific user-group pair
        /// Call after user joins or leaves a group
        /// </summary>
        public async Task InvalidateMembershipCacheAsync(string userId, int groupId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("InvalidateMembershipCacheAsync called with null userId");
                return;
            }

            var cacheKey = $"membership:user:{userId}:group:{groupId}";
            await _cacheService.RemoveAsync(cacheKey);
            _logger.LogDebug("Invalidated membership cache for user {UserId} in group {GroupId}", userId, groupId);
        }

        /// <summary>
        /// Invalidates all membership cache entries for a user
        /// Pattern: membership:user:{userId}:group:*
        /// Call when user's group memberships change significantly
        /// </summary>
        public async Task InvalidateAllMembershipsAsync(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("InvalidateAllMembershipsAsync called with null userId");
                return;
            }

            var pattern = $"membership:user:{userId}:group:*";
            await _cacheService.RemoveByPatternAsync(pattern);
            _logger.LogDebug("Invalidated all membership cache for user {UserId}", userId);
        }

        /// <summary>
        /// Invalidates membership cache for all users in a group
        /// Pattern: membership:user:*:group:{groupId}
        /// Call when group membership changes or group is deleted
        /// </summary>
        public async Task InvalidateGroupMembershipsAsync(int groupId)
        {
            var pattern = $"membership:user:*:group:{groupId}";
            await _cacheService.RemoveByPatternAsync(pattern);
            _logger.LogDebug("Invalidated all membership cache for group {GroupId}", groupId);
        }
    }
}
