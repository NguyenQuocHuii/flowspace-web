using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FlowSpace.Domain.Entities
{
    public class TaskResource
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid TaskId { get; set; }

        [ForeignKey(nameof(TaskId))]
        public TaskItem? Task { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        // Percentage of allocation for this user on this task (0-100)
        [Range(0, 100)]
        public int AllocationPercentage { get; set; } = 100;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
