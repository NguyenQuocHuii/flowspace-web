using System;

namespace FlowSpace.Domain.Entities
{
    public class Subtask
    {
        public Guid Id { get; set; }
        public Guid TaskId { get; set; }
        public TaskItem? Task { get; set; }
        public string Title { get; set; } = string.Empty;
        public bool Done { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
