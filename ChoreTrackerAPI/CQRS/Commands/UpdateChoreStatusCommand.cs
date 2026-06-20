using ChoreTrackerAPI.Models;
using MediatR;

namespace ChoreTrackerAPI.CQRS.Commands
{
    /// <summary>
    /// CQRS Command for updating chore status
    /// </summary>
    public record UpdateChoreStatusCommand : IRequest<bool>
    {
        public required int ChoreId { get; init; }
        public required ChoreStatus NewStatus { get; init; }
        public required string UserId { get; init; }
    }
}
