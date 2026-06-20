namespace ChoreTrackerAPI.Messages
{
    /// <summary>
    /// Event published when a new member joins a group
    /// Published by GroupController.JoinGroup
    /// Consumed by ActivityBroadcastConsumer to send real-time updates via SignalR
    /// </summary>
    public class MemberJoinedEvent
    {
        public int GroupId { get; set; }
        public string GroupName { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string UserFirstName { get; set; }
        public string UserLastName { get; set; }
        public string UserProfilePictureUrl { get; set; }
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}
