namespace ChoreTrackerAPI.Messages
{
    /// <summary>
    /// Command to send an invite email to a new group member
    /// Published by GroupController.CreateGroup
    /// Consumed by SendInviteEmailConsumer (background worker)
    /// </summary>
    public class SendInviteEmailCommand
    {
        public string CreatorId { get; set; }
        public string CreatorName { get; set; }
        public string RecipientEmail { get; set; }
        public string GroupName { get; set; }
        public string InviteCode { get; set; }
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }
}
