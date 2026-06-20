using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChoreTrackerAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Chores: GetRecentActivities fires ORDER BY CreatedAt DESC WHERE GroupId IN (...)
            // Planner was doing Seq Scan + Sort; this pushes the sort into the index.
            migrationBuilder.CreateIndex(
                name: "IX_Chores_GroupId_CreatedAt",
                table: "Chores",
                columns: new[] { "GroupId", "CreatedAt" });

            // Chores: GetGroupDetails fires WHERE GroupId = ? AND Status = ? ORDER BY NextOccurence ASC
            // Planner was using the Status-only index then filtering GroupId (removed 19/25 rows).
            migrationBuilder.CreateIndex(
                name: "IX_Chores_GroupId_Status_NextOccurence",
                table: "Chores",
                columns: new[] { "GroupId", "Status", "NextOccurence" });

            // GroupMember: GetRecentActivities memberships sub-query fires
            // WHERE GroupId IN (...) ORDER BY JoinedAt DESC LIMIT 20
            // Planner was sorting after the GroupId bitmap scan.
            migrationBuilder.CreateIndex(
                name: "IX_GroupMember_GroupId_JoinedAt",
                table: "GroupMember",
                columns: new[] { "GroupId", "JoinedAt" });

            // Notifications: unread query fires WHERE UserId = ? AND IsRead = false ORDER BY CreatedAt DESC
            // Planner was using UserId-only index then filtering IsRead and sorting.
            // Covering index lets postgres satisfy the whole predicate + sort from the index.
            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_IsRead_CreatedAt",
                table: "Notifications",
                columns: new[] { "UserId", "IsRead", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_Chores_GroupId_CreatedAt",             table: "Chores");
            migrationBuilder.DropIndex(name: "IX_Chores_GroupId_Status_NextOccurence",  table: "Chores");
            migrationBuilder.DropIndex(name: "IX_GroupMember_GroupId_JoinedAt",          table: "GroupMember");
            migrationBuilder.DropIndex(name: "IX_Notifications_UserId_IsRead_CreatedAt", table: "Notifications");
        }
    }
}
