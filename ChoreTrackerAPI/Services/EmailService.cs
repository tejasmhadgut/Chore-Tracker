using System;
using System.Collections.Generic;
using System.Linq;
//using System.Net.Mail;
using System.Threading.Tasks;
using ChoreTrackerAPI.ServiceInterfaces;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using ChoreTrackerAPI.Models;
using SendGrid;
using SendGrid.Helpers.Mail;
namespace ChoreTrackerAPI.Services
{
    public class EmailService : IEmailService
    {
        private readonly string _sendGridApiKey;
        public EmailService(IConfiguration configuration)
        {
            _sendGridApiKey = configuration["SendGrid:ApiKey"];
        }
        public async Task SendInviteEmailAsync(ApplicationUser creator, string recipientEmail, string inviteCode)
        {
            var client = new SendGridClient(_sendGridApiKey);
            var from = new EmailAddress("tejaschoretracker@gmail.com", "ChoreTracker");
            var to = new EmailAddress(recipientEmail);
            var subject = "You're Invited to Join a ChoreTracker Group!";
            var plainTextContent = $"You have been invited to join a group. Use the invite code: {inviteCode} to join the group.";
            var htmlContent = $"<p>You have been invited to join a group. Use the invite code: <strong>{inviteCode}</strong> to join the group.</p>";
            Console.WriteLine("from email"+from);
            Console.WriteLine("to email"+to);
            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);

            var response = await client.SendEmailAsync(msg);
            if (response.StatusCode != System.Net.HttpStatusCode.Accepted)
            {
                // Handle failure if necessary
                throw new Exception($"Failed to send email. Status code: {response.StatusCode}");
            }
        }
        
    }
}