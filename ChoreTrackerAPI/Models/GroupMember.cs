using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChoreTrackerAPI.Models
{
    public class GroupMember
    {
        public int Id {get; set;}
        public string UserId {get;set;}
        public ApplicationUser User {get; set;}
        public int GroupId {get;set;}
        public Group Group {get; set;}
    }
}