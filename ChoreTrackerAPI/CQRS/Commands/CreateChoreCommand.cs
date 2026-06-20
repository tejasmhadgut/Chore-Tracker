using ChoreTrackerAPI.Dtos;
using ChoreTrackerAPI.Models;
using MediatR;

namespace ChoreTrackerAPI.CQRS.Commands
{
    /// <summary>
    /// CQRS Command for creating a new chore
    /// Demonstrates command/query separation for scalable architecture
    /// </summary>
    public record CreateChoreCommand : IRequest<ChoreDto>
    {
        public required string Name { get; init; }
        public required string Description { get; init; }
        public required ChoreStatus Status { get; init; }
        public required int GroupId { get; init; }
        public required string UserId { get; init; }
        public RecurrenceType? RecurrenceType { get; init; }
        public DateTime? RecurrenceEndDate { get; init; }
        public int? IntervalDays { get; init; }
    }
}
