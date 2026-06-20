using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
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
        public RecurrenceType Recurrence {get; set;}
        public int? IntervalDays {get; set;}
        [Column(TypeName = "timestamp with time zone")]
        public DateTime NextOccurence { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "timestamp with time zone")]
        public DateTime? RecurrenceEndDate { get; set; }
        public int GroupId {get; set;}

        [ForeignKey("GroupId")]
        public virtual Group Group { get; set; }
        public ChoreStatus Status {get; set;} = ChoreStatus.Todo;
        public ChoreDifficulty Difficulty { get; set; } = ChoreDifficulty.Medium;

        [Column(TypeName = "timestamp with time zone")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "timestamp with time zone")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}