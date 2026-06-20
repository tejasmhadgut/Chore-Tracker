using System;

namespace ChoreTrackerAPI.Dtos
{
    public class ChoreTypeStatsDto
    {
        public string ChoreName { get; set; } = string.Empty;
        public int CompletionCount { get; set; }
        public double Percentage { get; set; }
        public DateTime LastCompleted { get; set; }
        public string MostFrequentCompleter { get; set; } = string.Empty;
    }
}
