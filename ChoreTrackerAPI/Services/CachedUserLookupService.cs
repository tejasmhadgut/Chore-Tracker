using ChoreTrackerAPI.Models;
using ChoreTrackerAPI.ServiceInterfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace ChoreTrackerAPI.Services
{
    /// <summary>
    /// Cached wrapper around UserManager for user identity lookups
    /// Reduces repeated database queries for frequently accessed user data
    /// </summary>
    public class CachedUserLookupService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ICacheService _cacheService;
        private readonly ILogger<CachedUserLookupService> _logger;

        public CachedUserLookupService(
            UserManager<ApplicationUser> userManager,
            ICacheService cacheService,
            ILogger<CachedUserLookupService> logger)
        {
            _userManager = userManager;
            _cacheService = cacheService;
            _logger = logger;
        }

        /// <summary>
        /// Find user by email with caching
        /// Cache TTL: 60 minutes
        /// </summary>
        public async Task<ApplicationUser?> FindByEmailAsync(string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return null;
            }

            var cacheKey = $"user:email:{email}:identity";

            return await _cacheService.GetOrSetAsync(cacheKey, async () =>
            {
                _logger.LogDebug("Cache miss: Looking up user by email {Email}", email);
                return await _userManager.FindByEmailAsync(email);
            }, TimeSpan.FromHours(1));
        }

        /// <summary>
        /// Invalidate cached user data when user is updated
        /// </summary>
        public async Task InvalidateUserCacheAsync(string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return;
            }

            var cacheKey = $"user:email:{email}:identity";
            await _cacheService.RemoveAsync(cacheKey);
            _logger.LogDebug("Invalidated cache for user {Email}", email);
        }
    }
}
