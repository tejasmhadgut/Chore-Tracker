using ChoreTrackerAPI.Models;

namespace ChoreTrackerAPI.Dtos
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public NotificationType Type { get; set; }
        public string Message { get; set; }
        public int? ChoreId { get; set; }
        public string? ChoreName { get; set; }
        public int GroupId { get; set; }
        public string GroupName { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public ActorDto? Actor { get; set; }  // Who triggered it
    }

    public class ActorDto
    {
        public string Id { get; set; }
        public string FirstName { get; set; }
        public string ProfilePictureUrl { get; set; }
    }

    public class UnreadCountDto
    {
        public int UnreadCount { get; set; }
    }

    public class NotificationListDto
    {
        public List<NotificationDto> Notifications { get; set; }
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public bool HasMore { get; set; }
    }
}
