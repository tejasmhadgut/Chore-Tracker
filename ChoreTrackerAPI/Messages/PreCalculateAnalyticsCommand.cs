namespace ChoreTrackerAPI.Messages
{
    /// <summary>
    /// Command to pre-calculate analytics for a group
    /// Published by scheduled recurring job (2 AM daily)
    /// Consumed by PreCalculateAnalyticsConsumer (background worker)
    /// </summary>
    public class PreCalculateAnalyticsCommand
    {
        public int GroupId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime ScheduledAt { get; set; } = DateTime.UtcNow;
    }
}
