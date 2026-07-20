using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using FlowSpace.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FlowSpace.Infrastructure.Services
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<SmtpEmailSender> _logger;

        public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendAsync(string to, string subject, string htmlBody)
        {
            var host = _configuration["Smtp:Host"];
            var port = _configuration.GetValue<int>("Smtp:Port");
            var user = _configuration["Smtp:User"];
            var from = _configuration["Smtp:From"];
            var enableSsl = _configuration.GetValue<bool>("Smtp:EnableSsl");
            var password = Environment.GetEnvironmentVariable("SMTP_PASSWORD");

            if (string.IsNullOrEmpty(host) || port == 0 || string.IsNullOrEmpty(user) || string.IsNullOrEmpty(from))
            {
                _logger.LogError("SMTP configuration is missing. Email not sent.");
                return;
            }
            if (string.IsNullOrEmpty(password))
            {
                _logger.LogError("SMTP_PASSWORD environment variable not set. Email not sent.");
                return;
            }

            try
            {
                using (var client = new SmtpClient(host, port))
                {
                    client.UseDefaultCredentials = false;
                    client.Credentials = new NetworkCredential(user, password);
                    client.EnableSsl = enableSsl;

                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(from),
                        Subject = subject,
                        Body = htmlBody,
                        IsBodyHtml = true
                    };
                    mailMessage.To.Add(to);

                    await client.SendMailAsync(mailMessage);
                    _logger.LogInformation("Email sent successfully to {To}", to);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {To}. Error: {Message}", to, ex.Message);
                throw;
            }
        }
    }
}