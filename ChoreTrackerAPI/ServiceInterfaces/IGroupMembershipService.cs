namespace ChoreTrackerAPI.ServiceInterfaces
{
    /// <summary>
    /// Service for cached group membership verification
    /// Reduces database queries for repeated membership checks across endpoints
    /// </summary>
    public interface IGroupMembershipService
    {
        /// <summary>
        /// Checks if a user is a member of a group (cached for 15 minutes)
        /// </summary>
        /// <param name="userId">User ID to check</param>
        /// <param name="groupId">Group ID to check membership in</param>
        /// <returns>True if user is a member, false otherwise</returns>
        Task<bool> IsMemberAsync(string userId, int groupId);

        /// <summary>
        /// Invalidates membership cache for a user in a specific group
        /// Call after user joins/leaves a group
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="groupId">Group ID</param>
        Task InvalidateMembershipCacheAsync(string userId, int groupId);

        /// <summary>
        /// Invalidates all membership cache for a user across all groups
        /// Call after user's groups change significantly
        /// </summary>
        /// <param name="userId">User ID</param>
        Task InvalidateAllMembershipsAsync(string userId);

        /// <summary>
        /// Invalidates all membership cache for a group
        /// Call when group membership changes or group is deleted
        /// </summary>
        /// <param name="groupId">Group ID</param>
        Task InvalidateGroupMembershipsAsync(int groupId);
    }
}
