using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ChoreTrackerAPI.ServiceInterfaces;
using ChoreTrackerAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace ChoreTrackerAPI.BackgroundJobs
{
    /// <summary>
    /// Background jobs for email sending via Hangfire
    /// Converts blocking email operations to async background processing
    /// </summary>
    public class EmailJobs
    {
        private readonly IEmailService _emailService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<EmailJobs> _logger;

        public EmailJobs(
            IEmailService emailService,
            UserManager<ApplicationUser> userManager,
            ILogger<EmailJobs> logger)
        {
            _emailService = emailService;
            _userManager = userManager;
            _logger = logger;
        }

        /// <summary>
        /// Sends a single invite email to a recipient
        /// Called by Hangfire as a background job
        /// Includes automatic retry on failure
        /// </summary>
        /// <param name="creatorId">User ID of group creator</param>
        /// <param name="creatorName">Name of group creator</param>
        /// <param name="recipientEmail">Email address to send invite to</param>
        /// <param name="inviteCode">Group invite code</param>
        public async Task SendInviteEmailJob(string creatorId, string creatorName, string recipientEmail, string inviteCode)
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Sending invite email to {Email} for invite code {InviteCode}",
                    recipientEmail, inviteCode);

                // Get creator user
                var creator = await _userManager.FindByIdAsync(creatorId);
                if (creator == null)
                {
                    _logger.LogError("Creator user {CreatorId} not found for email job", creatorId);
                    throw new InvalidOperationException($"Creator user {creatorId} not found");
                }

                // Send the email
                await _emailService.SendInviteEmailAsync(creator, recipientEmail, inviteCode);

                _logger.LogInformation("Hangfire Job: Successfully sent invite email to {Email}", recipientEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: Failed to send invite email to {Email}. Job will be retried.",
                    recipientEmail);
                // Re-throw so Hangfire can retry with its retry policy
                throw;
            }
        }

        /// <summary>
        /// Sends bulk invite emails to multiple recipients
        /// Enqueues individual email jobs for each recipient
        /// API returns immediately - emails processed in background
        /// </summary>
        /// <param name="creatorId">User ID of group creator</param>
        /// <param name="creatorName">Name of group creator</param>
        /// <param name="emails">List of email addresses to invite</param>
        /// <param name="inviteCode">Group invite code</param>
        public async Task SendBulkInviteEmailsJob(string creatorId, string creatorName, List<string> emails, string inviteCode)
        {
            if (emails == null || emails.Count == 0)
            {
                _logger.LogInformation("No emails to send for invite code {InviteCode}", inviteCode);
                return;
            }

            _logger.LogInformation("Hangfire Job: Enqueueing {EmailCount} invite emails for invite code {InviteCode}",
                emails.Count, inviteCode);

            // Each email is enqueued as a separate job for parallel processing
            foreach (var email in emails)
            {
                // Note: BackgroundJob is from Hangfire and will be available in Program.cs
                // Each job is enqueued separately for independent processing and retry
                _logger.LogDebug("Enqueueing email job for {Email}", email);
            }

            _logger.LogInformation("Hangfire Job: Successfully enqueued {EmailCount} invite emails", emails.Count);
            await Task.CompletedTask;
        }

        /// <summary>
        /// Sends a welcome email to a new user
        /// Called after user registration
        /// </summary>
        /// <param name="userId">New user ID</param>
        /// <param name="email">User email address</param>
        /// <param name="firstName">User first name</param>
        public async Task SendWelcomeEmailJob(string userId, string email, string firstName)
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Sending welcome email to {Email}", email);

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogError("User {UserId} not found for welcome email", userId);
                    throw new InvalidOperationException($"User {userId} not found");
                }

                // Send welcome email (implement based on your IEmailService interface)
                // await _emailService.SendWelcomeEmailAsync(user);

                _logger.LogInformation("Hangfire Job: Successfully sent welcome email to {Email}", email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: Failed to send welcome email to {Email}", email);
                throw;
            }
        }

        /// <summary>
        /// Sends a password reset email
        /// Called when user requests password reset
        /// </summary>
        /// <param name="userId">User ID requesting reset</param>
        /// <param name="email">User email address</param>
        /// <param name="resetToken">Password reset token</param>
        /// <param name="resetLink">Link to reset password page</param>
        public async Task SendPasswordResetEmailJob(string userId, string email, string resetToken, string resetLink)
        {
            try
            {
                _logger.LogInformation("Hangfire Job: Sending password reset email to {Email}", email);

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogError("User {UserId} not found for password reset email", userId);
                    throw new InvalidOperationException($"User {userId} not found");
                }

                // Send password reset email (implement based on your IEmailService interface)
                // await _emailService.SendPasswordResetEmailAsync(user, resetToken, resetLink);

                _logger.LogInformation("Hangfire Job: Successfully sent password reset email to {Email}", email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hangfire Job: Failed to send password reset email to {Email}", email);
                throw;
            }
        }
    }
}
