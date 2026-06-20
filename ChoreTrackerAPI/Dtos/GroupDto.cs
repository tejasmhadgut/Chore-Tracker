using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Models;

namespace ChoreTrackerAPI.Dtos
{
    public class GroupDto
    {
        [Required(ErrorMessage = "Group ID is required")]
        public int Id {get; set;}

        [Required(ErrorMessage = "Group name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name {get; set;} = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description {get;set;}

        [Required(ErrorMessage = "Invite code is required")]
        public string InviteCode {get; set;} = string.Empty;

        [Required(ErrorMessage = "Created date is required")]
        public DateTime CreatedAt {get;set;} = DateTime.UtcNow;

        //public List<string> MemberNames = new List<string>();
        [Required(ErrorMessage = "Members list is required")]
        public List<GroupMember> Members {get; set;} = new();
    }
}