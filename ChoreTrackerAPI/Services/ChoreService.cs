using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.Models;
using ChoreTrackerAPI.ServiceInterfaces;

namespace ChoreTrackerAPI.Services
{
    public class ChoreService : IChoreService
    {
        private readonly ApplicationDbContext _context;
        public ChoreService(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task UpdateRecurrenceDatesAsync(){
            var today = DateTime.Now;
            var ChoresToUpdate = _context.Chores
            .Where(c=> c.NextOccurence <= DateTime.Now && c.Recurrence != RecurrenceType.None).ToList();
            foreach(var chore in ChoresToUpdate)
            {
                if(chore.RecurrenceEndDate.HasValue && chore.NextOccurence > chore.RecurrenceEndDate.Value)
                {
                    continue;
                }
                switch(chore.Recurrence)
                {
                    case RecurrenceType.Daily:
                        chore.NextOccurence = chore.NextOccurence.AddDays(1);
                        chore.status = ChoreStatus.ToDo;
                        break;
                    case RecurrenceType.Weekly:
                        chore.NextOccurence = chore.NextOccurence.AddDays(7);
                        chore.status = ChoreStatus.ToDo;
                        break;
                    case RecurrenceType.Monthly:
                        chore.NextOccurence = chore.NextOccurence.AddMonths(1);
                        chore.status = ChoreStatus.ToDo;
                        break;
                    case RecurrenceType.Custom:
                        if(chore.IntervalDays.HasValue)
                        {
                            chore.NextOccurence = chore.NextOccurence.AddDays(chore.IntervalDays.Value);
                            chore.status = ChoreStatus.ToDo;
                        }
                        break;
                }
                _context.Chores.Update(chore);
                await _context.SaveChangesAsync();
            }
        }
    }
}