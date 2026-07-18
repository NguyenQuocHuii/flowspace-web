using System;

namespace FlowSpace.Domain.Entities
{
    public class Comment
    {
        public Guid Id { get; set; }
        public Guid TaskId { get; set; }
        public TaskItem? Task { get; set; }
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
