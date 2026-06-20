using MassTransit;
using ChoreTrackerAPI.Messages;
using ChoreTrackerAPI.ServiceInterfaces;
using ChoreTrackerAPI.Models;
using Microsoft.AspNetCore.Identity;

namespace ChoreTrackerAPI.Consumers
{
    /// <summary>
    /// Consumer that handles SendInviteEmailCommand messages
    /// Runs in background and sends invite emails asynchronously
    /// MassTransit automatically retries on failure (3 attempts)
    /// </summary>
    public class SendInviteEmailConsumer : IConsumer<SendInviteEmailCommand>
    {
        private readonly IEmailService _emailService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<SendInviteEmailConsumer> _logger;

        public SendInviteEmailConsumer(
            IEmailService emailService,
            UserManager<ApplicationUser> userManager,
            ILogger<SendInviteEmailConsumer> logger)
        {
            _emailService = emailService;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<SendInviteEmailCommand> context)
        {
            var command = context.Message;

            try
            {
                _logger.LogInformation(
                    "Sending invite email to {Email} for group {GroupName} by {CreatorName}",
                    command.RecipientEmail,
                    command.GroupName,
                    command.CreatorName);

                // Get creator user object (could be cached or from DB)
                var creator = new ApplicationUser
                {
                    Id = command.CreatorId,
                    UserName = command.CreatorName
                };

                // Send the email
                await _emailService.SendInviteEmailAsync(creator, command.RecipientEmail, command.InviteCode);

                _logger.LogInformation(
                    "Successfully sent invite email to {Email}",
                    command.RecipientEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to send invite email to {Email}. Message will be retried.",
                    command.RecipientEmail);

                // MassTransit will automatically retry this message based on retry policy
                throw;
            }
        }
    }
}
