using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.ServiceInterfaces;

namespace ChoreTrackerAPI.Services
{
    public class RecurrenceBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;
        public RecurrenceBackgroundService(IServiceScopeFactory serviceScopeFactory,IChoreService choreService)
        {
            _serviceScopeFactory = serviceScopeFactory;
        }
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while(!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(TimeSpan.FromDays(1),stoppingToken);
                using (var scope = _serviceScopeFactory.CreateAsyncScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var ChoreService = scope.ServiceProvider.GetRequiredService<IChoreService>();
                    await ChoreService.UpdateRecurrenceDatesAsync();
                }
            }
        }
    }
}