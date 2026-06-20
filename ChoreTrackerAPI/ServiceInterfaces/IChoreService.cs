using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Models;

namespace ChoreTrackerAPI.ServiceInterfaces
{
    public interface IChoreService
    {
         Task<List<Chore>> UpdateRecurrenceDatesAsync();
    }
}