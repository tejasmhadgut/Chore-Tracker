namespace ChoreTrackerAPI.Messages
{
    /// <summary>
    /// Command to invalidate cache for a group
    /// Published by ChoreController after chore mutations
    /// Consumed by InvalidateCacheConsumer (background worker)
    /// </summary>
    public class InvalidateCacheCommand
    {
        public int GroupId { get; set; }
        public string InvalidationType { get; set; } // "analytics", "chores", "group", "leaderboard", "all"
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    }
}
