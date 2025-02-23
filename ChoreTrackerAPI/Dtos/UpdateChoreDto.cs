using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Models;

namespace ChoreTrackerAPI.Dtos
{
    public class UpdateChoreDto
    {
        public string Name {get; set;}
        public string Description { get; set; }
        public DateTime DueDate { get; set; }
        public ChoreStatus status {get; set;} = ChoreStatus.ToDo;
    }
}