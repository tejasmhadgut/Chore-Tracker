namespace ChoreTrackerAPI.Messages
{
    /// <summary>
    /// Event published when a new chore is created
    /// Published by ChoreController.CreateChore
    /// Consumed by ActivityBroadcastConsumer to send real-time updates via SignalR
    /// </summary>
    public class ChoreCreatedEvent
    {
        public int ChoreId { get; set; }
        public string ChoreName { get; set; }
        public int GroupId { get; set; }
        public string GroupName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
