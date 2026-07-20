using System;

namespace FlowSpace.Domain.Entities
{
    public class TimeLog
    {
        public Guid Id { get; set; }
        public Guid TaskId { get; set; }
        public TaskItem? Task { get; set; }
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public Guid ProjectId { get; set; }
        public Project? Project { get; set; }
        public decimal Hours { get; set; }
        public DateTime Date { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
