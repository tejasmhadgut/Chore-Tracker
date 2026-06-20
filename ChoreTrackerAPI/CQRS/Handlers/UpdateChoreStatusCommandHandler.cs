using ChoreTrackerAPI.CQRS.Commands;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.ServiceInterfaces;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ChoreTrackerAPI.Services;

namespace ChoreTrackerAPI.CQRS.Handlers
{
    /// <summary>
    /// Handler for UpdateChoreStatusCommand
    /// Demonstrates command handler with real-time notification and cache invalidation
    /// </summary>
    public class UpdateChoreStatusCommandHandler : IRequestHandler<UpdateChoreStatusCommand, bool>
    {
        private readonly ApplicationDbContext _context;
        private readonly ICacheService _cacheService;
        private readonly IHubContext<ChoreHubService> _hubContext;
        private readonly ILogger<UpdateChoreStatusCommandHandler> _logger;

        public UpdateChoreStatusCommandHandler(
            ApplicationDbContext context,
            ICacheService cacheService,
            IHubContext<ChoreHubService> hubContext,
            ILogger<UpdateChoreStatusCommandHandler> logger)
        {
            _context = context;
            _cacheService = cacheService;
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task<bool> Handle(UpdateChoreStatusCommand request, CancellationToken cancellationToken)
        {
            var chore = await _context.Chores
                .FirstOrDefaultAsync(c => c.Id == request.ChoreId, cancellationToken);

            if (chore == null)
            {
                throw new KeyNotFoundException($"Chore {request.ChoreId} not found");
            }

            // Validate user is member of group
            var isMember = await _context.GroupMember
                .AnyAsync(gm => gm.GroupId == chore.GroupId && gm.UserId == request.UserId, cancellationToken);

            if (!isMember)
            {
                throw new UnauthorizedAccessException($"User {request.UserId} is not a member of group {chore.GroupId}");
            }

            // Update status
            chore.Status = request.NewStatus;
            chore.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            // Invalidate cache
            await _cacheService.RemoveByPatternAsync($"analytics:group:{chore.GroupId}:*");

            // Broadcast real-time update via SignalR
            await _hubContext.Clients.Group(chore.GroupId.ToString())
                .SendAsync("ChoreUpdated", chore.Id, cancellationToken);

            _logger.LogInformation("Chore {ChoreId} status updated to {Status} via CQRS", request.ChoreId, request.NewStatus);

            return true;
        }
    }
}
