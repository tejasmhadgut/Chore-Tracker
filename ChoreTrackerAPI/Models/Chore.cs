using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Models;

namespace ChoreTrackerAPI.Models
{
    public class Chore
    {
        public int Id {get; set;}
        public string Name {get; set;} = string.Empty;
        public string Description {get; set;} = string.Empty;
        public RecurrenceType? Recurrence {get; set;}
        public int? IntervalDays {get; set;}
        public DateTime NextOccurence {get; set;}
        public DateTime? RecurrenceEndDate {get; set;}
        public int GroupId {get; set;}
        public Group Group {get; set;}
        public ChoreStatus status {get; set;} = ChoreStatus.ToDo;
    }
}