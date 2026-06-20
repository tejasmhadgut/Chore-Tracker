using Microsoft.EntityFrameworkCore;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.Models;
using Microsoft.AspNetCore.Identity;
using StackExchange.Redis;

namespace ChoreTrackerAPI.Services
{
    public class DatabaseInitializationService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IConnectionMultiplexer _redis;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<DatabaseInitializationService> _logger;
        private const string MIGRATION_LOCK_KEY = "choretrack:migration:lock";
        private const int LOCK_TIMEOUT_SECONDS = 300;
        private const int LOCK_RETRY_INTERVAL_MS = 500;
        private const int LOCK_MAX_WAIT_MS = 60000;

        public DatabaseInitializationService(
            ApplicationDbContext dbContext,
            IConnectionMultiplexer redis,
            UserManager<ApplicationUser> userManager,
            ILogger<DatabaseInitializationService> logger)
        {
            _dbContext = dbContext;
            _redis = redis;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task InitializeAsync()
        {
            _logger.LogInformation("🔍 Starting database initialization...");

            try
            {
                bool lockAcquired = await AcquireMigrationLockAsync();

                if (lockAcquired)
                {
                    try
                    {
                        await RunMigrationsAsync();
                        await SeedDataAsync();
                    }
                    finally
                    {
                        await ReleaseMigrationLockAsync();
                    }
                }
                else
                {
                    _logger.LogInformation("⏳ Another instance is running migrations, waiting for completion...");
                    await WaitForMigrationCompletionAsync();
                }

                _logger.LogInformation("✅ Database initialization completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Database initialization failed: {Message}", ex.Message);
                throw;
            }
        }

        private async Task<bool> AcquireMigrationLockAsync()
        {
            var db = _redis.GetDatabase();
            var lockId = $"{Environment.MachineName}:{Environment.ProcessId}";
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            while (stopwatch.ElapsedMilliseconds < LOCK_MAX_WAIT_MS)
            {
                bool lockSet = await db.StringSetAsync(
                    MIGRATION_LOCK_KEY,
                    lockId,
                    TimeSpan.FromSeconds(LOCK_TIMEOUT_SECONDS),
                    When.NotExists);

                if (lockSet)
                {
                    _logger.LogInformation("🔐 Acquired migration lock (lock_id: {LockId})", lockId);
                    return true;
                }

                await Task.Delay(LOCK_RETRY_INTERVAL_MS);
            }

            _logger.LogWarning("⏱️  Could not acquire migration lock after {Ms}ms", LOCK_MAX_WAIT_MS);
            return false;
        }

        private async Task ReleaseMigrationLockAsync()
        {
            var db = _redis.GetDatabase();
            await db.KeyDeleteAsync(MIGRATION_LOCK_KEY);
            _logger.LogInformation("🔓 Released migration lock");
        }

        private async Task WaitForMigrationCompletionAsync()
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            const int maxWaitMs = 120000;

            while (stopwatch.ElapsedMilliseconds < maxWaitMs)
            {
                try
                {
                    await _dbContext.Database.ExecuteSqlRawAsync("SELECT 1");
                    _logger.LogInformation("✅ Detected migrations complete, continuing initialization");
                    return;
                }
                catch
                {
                    await Task.Delay(1000);
                }
            }

            throw new TimeoutException(
                $"Waited {maxWaitMs}ms for migrations to complete from another instance");
        }

        private async Task RunMigrationsAsync()
        {
            try
            {
                _logger.LogInformation("🔄 Running EF Core migrations...");

                // Always call MigrateAsync - it handles creating __EFMigrationsHistory
                // table and applying any pending migrations automatically
                await _dbContext.Database.MigrateAsync();
                _logger.LogInformation("✅ Migrations applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Migration failed: {Message}", ex.Message);
                throw;
            }
        }

        private async Task SeedDataAsync()
        {
            if (await _dbContext.Users.AnyAsync())
            {
                _logger.LogInformation("ℹ️  Database already contains users, skipping seed data");
                return;
            }

            try
            {
                _logger.LogInformation("🌱 Seeding database with demo data...");
                await SeedData.InitializeAsync(_dbContext, _userManager);
                _logger.LogInformation("✅ Database seeded successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "⚠️  Seed data failed (non-critical): {Message}", ex.Message);
            }
        }

        public async Task<MigrationStatus> GetStatusAsync()
        {
            try
            {
                var appliedMigrations = await _dbContext.Database.GetAppliedMigrationsAsync();
                var pendingMigrations = await _dbContext.Database.GetPendingMigrationsAsync();
                var canConnect = await CanConnectAsync();

                return new MigrationStatus
                {
                    CanConnect = canConnect,
                    AppliedMigrationCount = appliedMigrations.Count(),
                    PendingMigrationCount = pendingMigrations.Count(),
                    AppliedMigrations = appliedMigrations.ToList(),
                    PendingMigrations = pendingMigrations.ToList(),
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get migration status");
                return new MigrationStatus { CanConnect = false, Error = ex.Message };
            }
        }

        private async Task<bool> CanConnectAsync()
        {
            try
            {
                await _dbContext.Database.ExecuteSqlRawAsync("SELECT 1");
                return true;
            }
            catch
            {
                return false;
            }
        }
    }

    public class MigrationStatus
    {
        public bool CanConnect { get; set; }
        public int AppliedMigrationCount { get; set; }
        public int PendingMigrationCount { get; set; }
        public List<string> AppliedMigrations { get; set; } = new();
        public List<string> PendingMigrations { get; set; } = new();
        public DateTime Timestamp { get; set; }
        public string? Error { get; set; }
    }
}
