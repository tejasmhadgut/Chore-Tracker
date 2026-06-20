using MassTransit;
using ChoreTrackerAPI.Messages;
using ChoreTrackerAPI.ServiceInterfaces;

namespace ChoreTrackerAPI.Consumers
{
    /// <summary>
    /// Consumer that handles InvalidateCacheCommand messages
    /// Runs in background and clears cache patterns asynchronously
    /// Prevents blocking on cache invalidation during mutations
    /// </summary>
    public class InvalidateCacheConsumer : IConsumer<InvalidateCacheCommand>
    {
        private readonly ICacheService _cacheService;
        private readonly ILogger<InvalidateCacheConsumer> _logger;

        public InvalidateCacheConsumer(
            ICacheService cacheService,
            ILogger<InvalidateCacheConsumer> logger)
        {
            _cacheService = cacheService;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<InvalidateCacheCommand> context)
        {
            var command = context.Message;

            try
            {
                _logger.LogInformation(
                    "Invalidating {InvalidationType} cache for group {GroupId}",
                    command.InvalidationType,
                    command.GroupId);

                switch (command.InvalidationType.ToLower())
                {
                    case "analytics":
                        await _cacheService.RemoveByPatternAsync($"analytics:group:{command.GroupId}:*");
                        break;

                    case "chores":
                        await _cacheService.RemoveAsync($"chores:group:{command.GroupId}");
                        break;

                    case "group":
                        await _cacheService.RemoveAsync($"group:{command.GroupId}:details");
                        break;

                    case "leaderboard":
                        await _cacheService.RemoveByPatternAsync($"leaderboard:group:{command.GroupId}:*");
                        break;

                    case "all":
                        // Invalidate all cache for this group
                        await _cacheService.RemoveByPatternAsync($"analytics:group:{command.GroupId}:*");
                        await _cacheService.RemoveAsync($"chores:group:{command.GroupId}");
                        await _cacheService.RemoveAsync($"group:{command.GroupId}:details");
                        await _cacheService.RemoveByPatternAsync($"leaderboard:group:{command.GroupId}:*");
                        break;

                    default:
                        _logger.LogWarning("Unknown invalidation type: {InvalidationType}", command.InvalidationType);
                        return;
                }

                _logger.LogInformation(
                    "Successfully invalidated {InvalidationType} cache for group {GroupId}",
                    command.InvalidationType,
                    command.GroupId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to invalidate cache for group {GroupId}",
                    command.GroupId);

                // Don't throw - cache invalidation failure shouldn't block the operation
                // Log it for monitoring but allow the message to be acknowledged
            }
        }
    }
}
