using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChoreTrackerAPI.Models
{
    public class ChoreCompletion
    {
        public int Id {get;set;}
        public string UserId {get;set;}
        public ApplicationUser User {get;set;}
        public int ChoreId {get;set;}
        public Chore Chore {get;set;}
        public DateTime CompletedOn {get;set;} = DateTime.UtcNow;
        public int GroupId {get;set;}
        public Group Group {get;set;}
    }
}