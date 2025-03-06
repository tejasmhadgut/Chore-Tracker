using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Models;

namespace ChoreTrackerAPI.Dtos
{
    public class GroupDto
    {
        public int Id {get; set;}
        public string Name {get; set;}
        public string Description {get;set;}
        public DateTime CreatedAt {get;set;} = DateTime.UtcNow;
        public List<string> MemberNames = new List<string>();
    }
}