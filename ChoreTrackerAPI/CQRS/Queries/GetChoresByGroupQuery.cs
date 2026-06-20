using ChoreTrackerAPI.Dtos;
using MediatR;

namespace ChoreTrackerAPI.CQRS.Queries
{
    /// <summary>
    /// CQRS Query for retrieving chores by group
    /// Read operations are separated from write operations for independent scaling
    /// </summary>
    public record GetChoresByGroupQuery : IRequest<IEnumerable<ChoreDto>>
    {
        public required int GroupId { get; init; }
        public required string UserId { get; init; }
    }
}
