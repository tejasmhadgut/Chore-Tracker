using Microsoft.EntityFrameworkCore;

namespace ChoreTrackerAPI.Data
{
    /// <summary>
    /// Routes read-only queries to the PostgreSQL streaming replica.
    /// Registered in DI with the replica connection string alongside the primary ApplicationDbContext.
    /// SaveChanges is blocked — all writes must go through ApplicationDbContext.
    /// </summary>
    public class ReadOnlyDbContext : ApplicationDbContext
    {
        public ReadOnlyDbContext(DbContextOptions<ReadOnlyDbContext> options) : base((DbContextOptions)options)
        {
        }

        public override int SaveChanges(bool acceptAllChangesOnSuccess) =>
            throw new InvalidOperationException("ReadOnlyDbContext is read-only. Use ApplicationDbContext for writes.");

        public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken ct = default) =>
            throw new InvalidOperationException("ReadOnlyDbContext is read-only. Use ApplicationDbContext for writes.");
    }
}
