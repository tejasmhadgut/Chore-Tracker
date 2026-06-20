using System;

namespace ChoreTrackerAPI.Dtos
{
    public class AnalyticsSummaryDto
    {
        public int TotalTasksCompleted { get; set; }
        public int ActiveMembers { get; set; }
        public double CompletionRate { get; set; }
        public string TopPerformer { get; set; } = string.Empty;
        public string TopPerformerProfileUrl { get; set; } = string.Empty;
        public int TopPerformerCount { get; set; }
        public int TotalTasks { get; set; }
        public int PendingTasks { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public double AverageTasksPerMember { get; set; }
    }
}
