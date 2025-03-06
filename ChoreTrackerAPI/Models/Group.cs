using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Models;

namespace ChoreTrackerAPI.Models
{
    public class Group
    {
        public int Id {get; set;}
        public string Name {get; set;} = string.Empty;
        public string InviteCode {get;set;} = Guid.NewGuid().ToString("N");
        public string Description {get; set;} = string.Empty;
        public DateTime createdAt {get; set;} = DateTime.UtcNow;
        public List<GroupMember> Members {get; set;} = new List<GroupMember>();
        // One-to-Many relationship: A group has many chores
        public List<Chore> Chores { get; set; } = new List<Chore>();
    }
}