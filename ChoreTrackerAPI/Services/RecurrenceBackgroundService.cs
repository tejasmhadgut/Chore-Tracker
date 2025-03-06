using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.ServiceInterfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Threading;
using System.Threading.Tasks;

public class RecurrenceBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _serviceScopeFactory;

    public RecurrenceBackgroundService(IServiceScopeFactory serviceScopeFactory)
    {
        _serviceScopeFactory = serviceScopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromDays(1), stoppingToken); // Avoid blocking the service.

            using (var scope = _serviceScopeFactory.CreateScope())
            {
                var choreService = scope.ServiceProvider.GetRequiredService<IChoreService>();

                // Call the chore service within the scope.
                await choreService.UpdateRecurrenceDatesAsync();
            }
        }
    }
}
