using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Model;
using ChoreTrackerAPI.Dtos;
using ChoreTrackerAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;


namespace ChoreTrackerAPI.Controller
{
    [ApiController]
    [Route("api/aws")]
    [Authorize]
    public class AwsS3Controller : ControllerBase
    {
        private readonly IAmazonS3 _s3Client;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AwsS3Controller> _logger;

        public AwsS3Controller(IAmazonS3 s3Client, UserManager<ApplicationUser> userManager, IConfiguration configuration, ILogger<AwsS3Controller> logger)
        {
            _s3Client = s3Client;
            _userManager = userManager;
            _configuration = configuration;
            _logger = logger;
        }
        [HttpPost("upload-profile-picture")]
        public async Task<IActionResult> UploadProfilePictureAsync(IFormFile file)
        {
            try
            {
                // Get user from claims (already authenticated via [Authorize])
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
                if (string.IsNullOrEmpty(userEmail))
                {
                    _logger.LogWarning("Upload profile picture: User email not found in claims");
                    return Unauthorized("User not authenticated");
                }

                var user = await _userManager.FindByEmailAsync(userEmail);
                if (user == null)
                {
                    _logger.LogWarning("Upload profile picture: User not found for email {Email}", userEmail);
                    return Unauthorized("User not found");
                }

                // Validate file
                if (file == null || file.Length == 0)
                    return BadRequest("No file uploaded.");

                if (file.Length > 20 * 1024 * 1024) // 20MB limit
                    return BadRequest("File size exceeds 20MB limit.");

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                var fileExtension = Path.GetExtension(file.FileName).ToLower();
                if (!allowedExtensions.Contains(fileExtension))
                    return BadRequest("Invalid file type. Only images are allowed.");

                var bucketName = _configuration["AWS:S3:ProfilePictureBucket"] ?? "choretrack-user-profile-picture";

                // Check if AWS is properly configured
                if (string.IsNullOrEmpty(_configuration["AWS:S3:ProfilePictureBucket"]))
                {
                    _logger.LogWarning("AWS S3 bucket not configured. Profile picture upload is disabled.");
                    return BadRequest(new { message = "Profile picture upload is not available. AWS S3 is not configured." });
                }

                // Delete old profile picture if exists
                if (!string.IsNullOrEmpty(user.ProfilePictureUrl))
                {
                    try
                    {
                        var oldKey = user.ProfilePictureUrl.Split('/').Last();
                        _logger.LogInformation("Deleting old profile picture for user {UserId}: {Key}", user.Id, oldKey);
                        await _s3Client.DeleteObjectAsync(bucketName, oldKey);
                    }
                    catch (AmazonS3Exception ex)
                    {
                        _logger.LogWarning(ex, "Error deleting old profile picture for user {UserId}", user.Id);
                    }
                }

                // Upload new picture to S3
                string key = $"profile-pictures/{user.Id}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

                var request = new PutObjectRequest()
                {
                    BucketName = bucketName,
                    Key = key,
                    InputStream = file.OpenReadStream(),
                    ContentType = file.ContentType
                };

                await _s3Client.PutObjectAsync(request);

                // Update user profile with the new picture URL
                var pictureUrl = $"https://{bucketName}.s3.amazonaws.com/{key}";
                user.ProfilePictureUrl = pictureUrl;
                await _userManager.UpdateAsync(user);

                _logger.LogInformation("Profile picture uploaded successfully for user {UserId}", user.Id);

                return Ok(new
                {
                    Message = "Profile picture uploaded successfully",
                    Url = pictureUrl
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading profile picture");
                return StatusCode(500, new { message = "An error occurred while uploading the profile picture." });
            }
        }

        [HttpGet("profile-picture")]
        public async Task<IActionResult> GetProfilePictureAsync()
        {
            try
            {
                // Get user from claims (already authenticated via [Authorize])
                var userEmail = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
                if (string.IsNullOrEmpty(userEmail))
                {
                    _logger.LogWarning("Get profile picture: User email not found in claims");
                    return Unauthorized("User not authenticated");
                }

                var user = await _userManager.FindByEmailAsync(userEmail);
                if (user == null)
                {
                    _logger.LogWarning("Get profile picture: User not found for email {Email}", userEmail);
                    return Unauthorized("User not found");
                }

                // If no profile picture is set, return the default avatar URL
                if (string.IsNullOrEmpty(user.ProfilePictureUrl))
                {
                    var defaultAvatarUrl = "/default-avatar.jpeg";
                    return Ok(new { url = defaultAvatarUrl, isDefault = true });
                }

                var bucketName = _configuration["AWS:S3:ProfilePictureBucket"] ?? "choretrack-user-profile-picture";

                // If AWS bucket is not configured, return the stored URL directly (no pre-signed URL generation)
                if (string.IsNullOrEmpty(_configuration["AWS:S3:ProfilePictureBucket"]))
                {
                    _logger.LogInformation("AWS S3 not configured, returning direct URL for user {UserId}", user.Id);
                    return Ok(new { url = user.ProfilePictureUrl, isDefault = false });
                }

                var key = user.ProfilePictureUrl.Replace($"https://{bucketName}.s3.amazonaws.com/", "");

                _logger.LogInformation("Generating pre-signed URL for user {UserId}", user.Id);

                var request = new GetPreSignedUrlRequest
                {
                    BucketName = bucketName,
                    Key = key,
                    Expires = DateTime.UtcNow.AddMinutes(60),
                    Verb = HttpVerb.GET
                };
                var url = _s3Client.GetPreSignedURL(request);

                return Ok(new { url, isDefault = false });
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogWarning("Profile picture not found in S3 storage");
                return NotFound("Profile picture not found in storage.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving profile picture");
                return StatusCode(500, new { message = "An error occurred while retrieving the profile picture." });
            }
        }
    }
}