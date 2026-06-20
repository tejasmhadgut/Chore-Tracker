using ChoreTrackerAPI.CQRS.Queries;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.Dtos;
using ChoreTrackerAPI.ServiceInterfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChoreTrackerAPI.CQRS.Handlers
{
    /// <summary>
    /// Handler for GetChoresByGroupQuery
    /// Demonstrates CQRS pattern - query handlers can be optimized independently from commands
    /// Uses caching for improved read performance
    /// </summary>
    public class GetChoresByGroupQueryHandler : IRequestHandler<GetChoresByGroupQuery, IEnumerable<ChoreDto>>
    {
        private readonly ApplicationDbContext _context;
        private readonly ICacheService _cacheService;
        private readonly ILogger<GetChoresByGroupQueryHandler> _logger;

        public GetChoresByGroupQueryHandler(
            ApplicationDbContext context,
            ICacheService cacheService,
            ILogger<GetChoresByGroupQueryHandler> logger)
        {
            _context = context;
            _cacheService = cacheService;
            _logger = logger;
        }

        public async Task<IEnumerable<ChoreDto>> Handle(GetChoresByGroupQuery request, CancellationToken cancellationToken)
        {
            // Validate user is member of group
            var isMember = await _context.GroupMember
                .AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId, cancellationToken);

            if (!isMember)
            {
                throw new UnauthorizedAccessException($"User {request.UserId} is not a member of group {request.GroupId}");
            }

            var cacheKey = $"chores:group:{request.GroupId}";

            // Try to get from cache first (read optimization)
            var chores = await _cacheService.GetOrSetAsync(cacheKey, async () =>
            {
                var choreList = await _context.Chores
                    .Where(c => c.GroupId == request.GroupId)
                    .OrderByDescending(c => c.CreatedAt)
                    .Select(c => new ChoreDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Description = c.Description,
                        Status = c.Status,
                        GroupId = c.GroupId,
                        Recurrence = c.Recurrence,
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt
                    })
                    .ToListAsync(cancellationToken);

                return choreList;
            }, TimeSpan.FromMinutes(5));

            _logger.LogInformation("Retrieved {Count} chores for group {GroupId} via CQRS query", chores.Count(), request.GroupId);

            return chores;
        }
    }
}
