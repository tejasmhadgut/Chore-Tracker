using System;

namespace ChoreTrackerAPI.Dtos
{
    public class UserContributionDto
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public int TasksCompleted { get; set; }
        public double Percentage { get; set; }
        public string ProfilePictureUrl { get; set; } = string.Empty;
        public int Rank { get; set; }
    }
}
