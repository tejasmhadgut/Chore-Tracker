using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChoreTrackerAPI.ServiceInterfaces
{
    public interface IChoreService
    {
         Task UpdateRecurrenceDatesAsync();
    }
}