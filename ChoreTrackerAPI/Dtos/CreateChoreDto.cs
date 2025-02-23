using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Models;

namespace ChoreTrackerAPI.Dtos
{
    public class CreateChoreDto
    {
        public string Name {get; set;}
        public string Description { get; set; }
        public int GroupId { get; set; }
        public RecurrenceType RecurrenceType {get; set;}
        public int? IntervalDays {get; set;}
        public DateTime RecurrenceEndDate {get; set;}
    }
}