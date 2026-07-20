using System;
using System.ComponentModel.DataAnnotations;

namespace FlowSpace.Domain.Entities
{
    public class ChatMessage
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid ChannelId { get; set; }

        public ChatChannel? Channel { get; set; }

        [Required]
        public Guid SenderId { get; set; }

        public User? Sender { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;

        public bool IsPinned { get; set; } = false;

        public bool IsRecalled { get; set; } = false;

        public Guid? ReplyToMessageId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
