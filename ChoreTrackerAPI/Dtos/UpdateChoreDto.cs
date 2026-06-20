using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Models;

namespace ChoreTrackerAPI.Dtos
{
    public class UpdateChoreDto
    {
        [Required(ErrorMessage = "Chore name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name {get; set;} = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Due date is required")]
        public DateTime DueDate { get; set; }

        [Required(ErrorMessage = "Status is required")]
        public ChoreStatus Status {get; set;} = ChoreStatus.Todo;

        public RecurrenceType? Recurrence {get; set;}

        [Range(1, 365, ErrorMessage = "Interval must be between 1 and 365 days")]
        public int? IntervalDays {get; set;}

        public ChoreDifficulty? Difficulty { get; set; }
    }
}