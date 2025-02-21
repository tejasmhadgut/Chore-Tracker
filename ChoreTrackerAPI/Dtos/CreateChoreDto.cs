using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChoreTrackerAPI.Dtos
{
    public class CreateChoreDto
    {
        public string Name {get; set;}
        public string Description { get; set; }
        public DateTime DueDate { get; set; }
        public int GroupId { get; set; }
    }
}