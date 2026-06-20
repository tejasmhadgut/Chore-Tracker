namespace ChoreTrackerAPI.Configuration
{
    /// <summary>
    /// CloudFront configuration for CDN URLs
    /// Update these values when CloudFront distributions are created
    /// </summary>
    public class CloudFrontConfig
    {
        /// <summary>
        /// CloudFront URL for profile pictures and user uploads
        /// Format: https://d[xxx].cloudfront.net
        /// Leave empty to use direct S3 URLs (with pre-signed URLs)
        /// </summary>
        public static string ProfilePicturesUrl => ""; // TODO: Update with CloudFront URL

        /// <summary>
        /// CloudFront URL for other user uploads (documents, etc.)
        /// Format: https://d[xxx].cloudfront.net
        /// </summary>
        public static string UserUploadsUrl => ""; // TODO: Update with CloudFront URL

        /// <summary>
        /// Whether to use CloudFront URLs instead of pre-signed S3 URLs
        /// Set to true only after CloudFront distributions are created
        /// </summary>
        public static bool UseCloudFront => !string.IsNullOrEmpty(ProfilePicturesUrl);

        /// <summary>
        /// Helper method to get CloudFront or S3 URL for profile pictures
        /// </summary>
        public static string GetProfilePictureUrl(string userId, string? cloudFrontUrl = null)
        {
            if (string.IsNullOrEmpty(userId))
                return string.Empty;

            var cfUrl = cloudFrontUrl ?? ProfilePicturesUrl;
            
            if (UseCloudFront && !string.IsNullOrEmpty(cfUrl))
            {
                // Use CloudFront URL (permanent, no expiration)
                return $"{cfUrl}/profile-pictures/{userId}.jpg";
            }

            // Fallback: Return empty (will be filled by S3 presigned URL in controller)
            return string.Empty;
        }
    }
}
