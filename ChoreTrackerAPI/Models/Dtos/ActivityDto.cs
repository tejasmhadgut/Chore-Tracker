namespace ChoreTrackerAPI.Models.Dtos
{
    public class ActivityDto
    {
        public string Type { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Actor { get; set; } = string.Empty;
        public string ActorUsername { get; set; } = string.Empty;
        public string ActorUserId { get; set; } = string.Empty;
        public string GroupName { get; set; } = string.Empty;
        public int GroupId { get; set; }
        public string Details { get; set; } = string.Empty;
        public string ActorProfilePictureUrl { get; set; } = string.Empty;
    }
}
