namespace ChoreTrackerAPI.Messages
{
    /// <summary>
    /// Event published when a chore is completed
    /// Published by ChoreController.CompleteChore
    /// Consumed by ActivityBroadcastConsumer to send real-time updates via SignalR
    /// </summary>
    public class ChoreCompletedEvent
    {
        public int ChoreId { get; set; }
        public string ChoreName { get; set; }
        public int GroupId { get; set; }
        public string GroupName { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string UserFirstName { get; set; }
        public string UserLastName { get; set; }
        public string UserProfilePictureUrl { get; set; }
        public DateTime CompletedOn { get; set; } = DateTime.UtcNow;
    }
}
