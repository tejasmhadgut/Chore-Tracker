using System;
using System.Collections.Generic;

namespace ChoreTrackerAPI.Dtos
{
    public class ActivityHeatmapDto
    {
        public int DayOfWeek { get; set; } // 0-6 (Sunday-Saturday)
        public string DayName { get; set; } = string.Empty;
        public int Hour { get; set; } // 0-23
        public int CompletionCount { get; set; }
    }

    public class DayOfWeekStatsDto
    {
        public int DayOfWeek { get; set; }
        public string DayName { get; set; } = string.Empty;
        public int CompletionCount { get; set; }
        public double Percentage { get; set; }
    }

    public class HourOfDayStatsDto
    {
        public int Hour { get; set; }
        public string TimeRange { get; set; } = string.Empty; // "9 AM - 10 AM"
        public int CompletionCount { get; set; }
        public double Percentage { get; set; }
    }
}
