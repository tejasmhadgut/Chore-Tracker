using Hangfire.Dashboard;

namespace ChoreTrackerAPI.Configuration
{
    /// <summary>
    /// Authorization filter for Hangfire Dashboard
    /// Restricts access to authenticated users only
    /// Dashboard is available at /hangfire endpoint
    /// </summary>
    public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
    {
        /// <summary>
        /// Authorizes dashboard access only to authenticated users
        /// In production, you may want to add role checks for admin users only
        /// </summary>
        /// <param name="context">Dashboard context containing HTTP context</param>
        /// <returns>True if user is authenticated, false otherwise</returns>
        public bool Authorize(DashboardContext context)
        {
            // Check if user is authenticated
            var isAuthenticated = context.GetHttpContext().User.Identity?.IsAuthenticated ?? false;

            // Optional: Add role check for admin users only
            // var isAdmin = context.GetHttpContext().User.IsInRole("Admin");
            // return isAuthenticated && isAdmin;

            return isAuthenticated;
        }
    }
}
