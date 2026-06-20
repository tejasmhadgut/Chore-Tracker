using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Models;

namespace ChoreTrackerAPI.Dtos
{
    public class ChoreDto
    {
        [Required(ErrorMessage = "Chore ID is required")]
        public int Id {get; set;}

        [Required(ErrorMessage = "Chore name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name {get; set;} = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Recurrence type is required")]
        public RecurrenceType Recurrence {get; set;}

        [Required(ErrorMessage = "Recurrence end date is required")]
        public DateTime RecurrenceEndDate {get; set;}

        [Required(ErrorMessage = "Status is required")]
        public ChoreStatus Status {get; set;}

        [Required(ErrorMessage = "Group ID is required")]
        public int GroupId {get; set;}

        [Required(ErrorMessage = "Created date is required")]
        public DateTime CreatedAt {get; set;}

        [Required(ErrorMessage = "Updated date is required")]
        public DateTime UpdatedAt {get; set;}



    }
}