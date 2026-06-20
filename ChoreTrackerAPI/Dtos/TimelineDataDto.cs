using System;
using System.Collections.Generic;

namespace ChoreTrackerAPI.Dtos
{
    public class TimelineDataDto
    {
        public DateTime Date { get; set; }
        public int TotalCompletions { get; set; }
        public Dictionary<string, int> UserBreakdown { get; set; } = new Dictionary<string, int>();
    }
}
