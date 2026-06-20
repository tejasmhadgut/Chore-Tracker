using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace ChoreTrackerAPI.Dtos
{
    public class GroupJoinRequest
    {
        [Required(ErrorMessage = "Group ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Group ID must be a positive number")]
        public int groupId {get;set;}
    }
}