using ChoreTrackerAPI.Dtos;
using MediatR;

namespace ChoreTrackerAPI.CQRS.Queries
{
    /// <summary>
    /// CQRS Query for analytics summary
    /// Demonstrates separation of complex read operations
    /// </summary>
    public record GetAnalyticsSummaryQuery : IRequest<AnalyticsSummaryDto>
    {
        public required int GroupId { get; init; }
        public required string UserId { get; init; }
        public DateTime? StartDate { get; init; }
        public DateTime? EndDate { get; init; }
    }
}
