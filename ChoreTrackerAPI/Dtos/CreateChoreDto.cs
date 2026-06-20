using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Models;

namespace ChoreTrackerAPI.Dtos
{
    public class CreateChoreDto
    {
        [Required(ErrorMessage = "Chore name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name {get; set;} = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Recurrence type is required")]
        public RecurrenceType RecurrenceType {get; set;}

        [Range(1, 365, ErrorMessage = "Interval must be between 1 and 365 days")]
        public int? IntervalDays {get; set;}

        [Required(ErrorMessage = "Recurrence end date is required")]
        public DateTime RecurrenceEndDate {get; set;}

        [Required(ErrorMessage = "Status is required")]
        public ChoreStatus Status {get; set;}

        [Required(ErrorMessage = "Difficulty is required")]
        public ChoreDifficulty Difficulty { get; set; } = ChoreDifficulty.Medium;
    }
}