using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ChoreTrackerAPI.Data
{
    public class ApplicationDbContext: IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        // Allows derived contexts (e.g. ReadOnlyDbContext) to pass their own typed options up the chain
        protected ApplicationDbContext(DbContextOptions options) : base(options) { }

        public DbSet<Chore> Chores {get;set;}
        public DbSet<ChoreCompletion> ChoreCompletion {get;set;}
        public DbSet<Group> Groups {get;set;}
        public DbSet<GroupMember> GroupMember {get;set;}
        public DbSet<Notification> Notifications {get;set;}

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Add indexes for performance optimization

            // Chore indexes
            modelBuilder.Entity<Chore>()
                .HasIndex(c => c.GroupId)
                .HasDatabaseName("IX_Chore_GroupId");

            modelBuilder.Entity<Chore>()
                .HasIndex(c => c.NextOccurence)
                .HasDatabaseName("IX_Chore_NextOccurence");

            modelBuilder.Entity<Chore>()
                .HasIndex(c => c.Status)
                .HasDatabaseName("IX_Chore_Status");

            // GroupMember indexes for membership queries
            modelBuilder.Entity<GroupMember>()
                .HasIndex(gm => gm.UserId)
                .HasDatabaseName("IX_GroupMember_UserId");

            modelBuilder.Entity<GroupMember>()
                .HasIndex(gm => gm.GroupId)
                .HasDatabaseName("IX_GroupMember_GroupId");

            modelBuilder.Entity<GroupMember>()
                .HasIndex(gm => new { gm.GroupId, gm.UserId })
                .IsUnique()
                .HasDatabaseName("IX_GroupMember_GroupId_UserId");

            // ChoreCompletion indexes for leaderboard queries
            modelBuilder.Entity<ChoreCompletion>()
                .HasIndex(cc => cc.GroupId)
                .HasDatabaseName("IX_ChoreCompletion_GroupId");

            modelBuilder.Entity<ChoreCompletion>()
                .HasIndex(cc => cc.CompletedOn)
                .HasDatabaseName("IX_ChoreCompletion_CompletedOn");

            modelBuilder.Entity<ChoreCompletion>()
                .HasIndex(cc => new { cc.GroupId, cc.CompletedOn })
                .HasDatabaseName("IX_ChoreCompletion_GroupId_CompletedOn");

            modelBuilder.Entity<ChoreCompletion>()
                .HasIndex(cc => cc.UserId)
                .HasDatabaseName("IX_ChoreCompletion_UserId");

            // Group indexes
            modelBuilder.Entity<Group>()
                .HasIndex(g => g.InviteCode)
                .IsUnique()
                .HasDatabaseName("IX_Group_InviteCode");

            modelBuilder.Entity<Group>()
                .HasIndex(g => g.CreatorId)
                .HasDatabaseName("IX_Group_CreatorId");

            // Notification indexes for efficient querying
            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.UserId)
                .HasDatabaseName("IX_Notification_UserId");

            modelBuilder.Entity<Notification>()
                .HasIndex(n => new { n.UserId, n.IsRead })
                .HasDatabaseName("IX_Notification_UserId_IsRead");

            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.CreatedAt)
                .HasDatabaseName("IX_Notification_CreatedAt");

            modelBuilder.Entity<Notification>()
                .HasIndex(n => new { n.UserId, n.CreatedAt })
                .HasDatabaseName("IX_Notification_UserId_CreatedAt");
        }
    }
}