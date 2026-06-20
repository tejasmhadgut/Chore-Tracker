using Microsoft.AspNetCore.Mvc;
using ChoreTrackerAPI.Services;
using Microsoft.AspNetCore.Authorization;

namespace ChoreTrackerAPI.Controller
{
    [Route("api/diagnostics")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class MigrationDiagnosticsController : ControllerBase
    {
        private readonly DatabaseInitializationService _initializationService;
        private readonly ILogger<MigrationDiagnosticsController> _logger;

        public MigrationDiagnosticsController(
            DatabaseInitializationService initializationService,
            ILogger<MigrationDiagnosticsController> logger)
        {
            _initializationService = initializationService;
            _logger = logger;
        }

        [HttpGet("migrations/status")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<MigrationStatusResponse>> GetMigrationStatus()
        {
            try
            {
                var status = await _initializationService.GetStatusAsync();

                return Ok(new MigrationStatusResponse
                {
                    Success = status.CanConnect && status.PendingMigrationCount == 0,
                    CanConnect = status.CanConnect,
                    AppliedMigrationCount = status.AppliedMigrationCount,
                    PendingMigrationCount = status.PendingMigrationCount,
                    AppliedMigrations = status.AppliedMigrations,
                    PendingMigrations = status.PendingMigrations,
                    Timestamp = status.Timestamp,
                    Message = GenerateStatusMessage(status)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get migration status");
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    message = "Failed to retrieve migration status",
                    error = ex.Message
                });
            }
        }

        [AllowAnonymous]
        [HttpGet("health")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
        public async Task<ActionResult<object>> HealthCheck()
        {
            try
            {
                var status = await _initializationService.GetStatusAsync();

                if (!status.CanConnect || status.PendingMigrationCount > 0)
                {
                    return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                    {
                        status = "unhealthy",
                        reason = !status.CanConnect ? "Cannot connect to database" : "Pending migrations exist",
                        pendingMigrations = status.PendingMigrationCount,
                        timestamp = DateTime.UtcNow
                    });
                }

                return Ok(new
                {
                    status = "healthy",
                    appliedMigrations = status.AppliedMigrationCount,
                    timestamp = DateTime.UtcNow
                });
            }
            catch
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    status = "unhealthy",
                    reason = "Health check failed",
                    timestamp = DateTime.UtcNow
                });
            }
        }

        private string GenerateStatusMessage(Services.MigrationStatus status)
        {
            if (!status.CanConnect)
                return "❌ Cannot connect to database";

            if (status.PendingMigrationCount > 0)
                return $"⏳ {status.PendingMigrationCount} pending migrations";

            if (status.AppliedMigrationCount == 0)
                return "⚠️  No migrations applied (database may be new)";

            return $"✅ All migrations applied ({status.AppliedMigrationCount} total)";
        }
    }

    public class MigrationStatusResponse
    {
        public bool Success { get; set; }
        public bool CanConnect { get; set; }
        public int AppliedMigrationCount { get; set; }
        public int PendingMigrationCount { get; set; }
        public List<string> AppliedMigrations { get; set; } = new();
        public List<string> PendingMigrations { get; set; } = new();
        public DateTime Timestamp { get; set; }
        public string Message { get; set; } = "";
    }
}
