using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace ChoreTrackerAPI.Dtos
{
    public class GetGroupDto
    {
        [Required(ErrorMessage = "Invite code is required")]
        [StringLength(20, ErrorMessage = "Invite code cannot exceed 20 characters")]
        public string InviteCode {get;set;} = string.Empty;
    }
}