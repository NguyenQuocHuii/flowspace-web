using System;
using System.ComponentModel.DataAnnotations;

namespace FlowSpace.Domain.Entities
{
    public class AuditLog
    {
        [Key]
        public Guid Id { get; set; }

        public Guid? UserId { get; set; }

        public User? User { get; set; }

        [Required]
        [MaxLength(50)]
        public string Action { get; set; } = string.Empty; // Register, Login, LoginFailed, Logout, PasswordReset, EmailVerified

        [MaxLength(45)]
        public string? IpAddress { get; set; }

        [MaxLength(255)]
        public string? UserAgent { get; set; }

        [MaxLength(500)]
        public string? Detail { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}