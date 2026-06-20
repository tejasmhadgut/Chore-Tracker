using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.Dtos;
using ChoreTrackerAPI.Models;
using ChoreTrackerAPI.ServiceInterfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using StackExchange.Redis;

namespace ChoreTrackerAPI.Services
{
    public class ChoreService : IChoreService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ChoreService> _logger;

        public ChoreService(ApplicationDbContext context, ILogger<ChoreService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Chore>> UpdateRecurrenceDatesAsync()
        {
            var now = DateTime.UtcNow;
            var today = now.Date;

            try
            {
                // Use a transaction with serializable isolation to prevent race conditions
                using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

                try
                {
                    var choresToUpdate = await _context.Chores
                        .Where(c => c.Recurrence != RecurrenceType.None &&
                                    c.NextOccurence.Date <= today &&
                                    (!c.RecurrenceEndDate.HasValue || c.RecurrenceEndDate.Value.Date >= today))
                        .ToListAsync();

                    if (!choresToUpdate.Any())
                    {
                        await transaction.CommitAsync();
                        return new List<Chore>();
                    }

                    _logger.LogInformation("Updating {Count} recurring chores", choresToUpdate.Count);

                    var updatedChores = new List<Chore>();

                    foreach (var chore in choresToUpdate)
                    {
                        if (chore.RecurrenceEndDate.HasValue && chore.NextOccurence > chore.RecurrenceEndDate.Value)
                        {
                            continue;
                        }

                        DateTime newDate = chore.NextOccurence;
                        while (newDate <= now)
                        {
                            newDate = chore.Recurrence switch
                            {
                                RecurrenceType.Daily => newDate.AddDays(1),
                                RecurrenceType.Weekly => newDate.AddDays(7),
                                RecurrenceType.Monthly => newDate.AddMonths(1),
                                RecurrenceType.Custom when chore.IntervalDays.HasValue =>
                                    newDate.AddDays(chore.IntervalDays.Value),
                                _ => newDate
                            };
                        }

                        chore.NextOccurence = newDate;
                        chore.Status = ChoreStatus.Todo;
                        updatedChores.Add(chore);

                        _logger.LogDebug("Updated chore {ChoreId}: Next occurrence set to {NextDate}", chore.Id, newDate);
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogInformation("Successfully updated {Count} chores", updatedChores.Count);
                    return updatedChores;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error updating recurrence dates, transaction rolled back");
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in UpdateRecurrenceDatesAsync");
                return new List<Chore>();
            }
        }
    }
}
