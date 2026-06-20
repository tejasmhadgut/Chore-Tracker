using System;

namespace ChoreTrackerAPI.Dtos
{
    public class TaskBreakdownDto
    {
        public int TodoCount { get; set; }
        public int InProgressCount { get; set; }
        public int DoneCount { get; set; }
        public int TotalTasks { get; set; }
        public double TodoPercentage { get; set; }
        public double InProgressPercentage { get; set; }
        public double DonePercentage { get; set; }
    }
}
