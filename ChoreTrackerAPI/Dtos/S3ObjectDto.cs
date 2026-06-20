using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace ChoreTrackerAPI.Dtos
{
    public class S3ObjectDto
    {
        [StringLength(255, ErrorMessage = "Name cannot exceed 255 characters")]
        public string? Name {get; set;}

        [StringLength(2048, ErrorMessage = "URL cannot exceed 2048 characters")]
        [Url(ErrorMessage = "Invalid URL format")]
        public string? PresignedUrl {get; set;}
    }
}