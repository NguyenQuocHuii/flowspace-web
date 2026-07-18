using System;
using System.ComponentModel.DataAnnotations;

namespace FlowSpace.Domain.Entities
{
    public class User
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Role { get; set; } = "employee"; // employee, team_lead, manager, director

        [Required]
        [MaxLength(2)]
        public string Avatar { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Color { get; set; } = "av-indigo";

        [MaxLength(100)]
        public string? Department { get; set; }

        [MaxLength(100)]
        public string? Position { get; set; }

        [MaxLength(20)]
        [Phone]
        public string? Phone { get; set; }

        public bool Active { get; set; } = true;

        [Required]
        public DateTime JoinDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
