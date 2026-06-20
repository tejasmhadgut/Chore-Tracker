using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace ChoreTrackerAPI.Dtos
{
    public class UpdateProfilePictureModel
    {
        [Required(ErrorMessage = "Profile picture URL is required")]
        [StringLength(2048, ErrorMessage = "URL cannot exceed 2048 characters")]
        [Url(ErrorMessage = "Invalid URL format")]
        public string ProfilePictureUrl {get; set;} = string.Empty;
    }
}