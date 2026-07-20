using System;
using System.ComponentModel.DataAnnotations;

namespace FlowSpace.Domain.Entities
{
    public class ChatChannel
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Description { get; set; }

        public bool IsDirectMessage { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
