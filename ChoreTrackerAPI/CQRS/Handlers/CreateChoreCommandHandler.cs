using ChoreTrackerAPI.CQRS.Commands;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.Dtos;
using ChoreTrackerAPI.Models;
using ChoreTrackerAPI.ServiceInterfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChoreTrackerAPI.CQRS.Handlers
{
    /// <summary>
    /// Handler for CreateChoreCommand
    /// Demonstrates CQRS pattern - command handlers modify state and invalidate cache
    /// </summary>
    public class CreateChoreCommandHandler : IRequestHandler<CreateChoreCommand, ChoreDto>
    {
        private readonly ApplicationDbContext _context;
        private readonly ICacheService _cacheService;
        private readonly ILogger<CreateChoreCommandHandler> _logger;

        public CreateChoreCommandHandler(
            ApplicationDbContext context,
            ICacheService cacheService,
            ILogger<CreateChoreCommandHandler> logger)
        {
            _context = context;
            _cacheService = cacheService;
            _logger = logger;
        }

        public async Task<ChoreDto> Handle(CreateChoreCommand request, CancellationToken cancellationToken)
        {
            // Validate user is member of group
            var isMember = await _context.GroupMember
                .AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId, cancellationToken);

            if (!isMember)
            {
                throw new UnauthorizedAccessException($"User {request.UserId} is not a member of group {request.GroupId}");
            }

            // Create chore entity
            var chore = new Chore
            {
                Name = request.Name,
                Description = request.Description,
                Status = request.Status,
                GroupId = request.GroupId,
                Recurrence = request.RecurrenceType ?? RecurrenceType.None,
                RecurrenceEndDate = request.RecurrenceEndDate,
                IntervalDays = request.IntervalDays
            };

            // Calculate next occurrence based on recurrence type
            if (request.RecurrenceType.HasValue)
            {
                chore.NextOccurence = request.RecurrenceType.Value switch
                {
                    RecurrenceType.Daily => DateTime.UtcNow.AddDays(1),
                    RecurrenceType.Weekly => DateTime.UtcNow.AddDays(7),
                    RecurrenceType.Monthly => DateTime.UtcNow.AddMonths(1),
                    RecurrenceType.Custom => DateTime.UtcNow.AddDays(request.IntervalDays ?? 1),
                    _ => DateTime.UtcNow
                };
            }

            _context.Chores.Add(chore);
            await _context.SaveChangesAsync(cancellationToken);

            // Invalidate analytics cache for this group
            await _cacheService.RemoveByPatternAsync($"analytics:group:{request.GroupId}:*");

            _logger.LogInformation("Chore {ChoreId} created via CQRS in group {GroupId}", chore.Id, request.GroupId);

            // Map to DTO
            return new ChoreDto
            {
                Id = chore.Id,
                Name = chore.Name,
                Description = chore.Description,
                Status = chore.Status,
                GroupId = chore.GroupId,
                Recurrence = chore.Recurrence,
                CreatedAt = chore.CreatedAt,
                UpdatedAt = chore.UpdatedAt
            };
        }
    }
}
