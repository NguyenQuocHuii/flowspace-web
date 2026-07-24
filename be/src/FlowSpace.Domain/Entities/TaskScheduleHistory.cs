using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FlowSpace.Domain.Entities
{
    public class TaskScheduleHistory
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid TaskId { get; set; }

        [ForeignKey(nameof(TaskId))]
        public TaskItem? Task { get; set; }

        public DateTime? OldStartDate { get; set; }

        public DateTime? OldDueDate { get; set; }

        public DateTime? NewStartDate { get; set; }

        public DateTime? NewDueDate { get; set; }

        public Guid? ChangedBy { get; set; }

        [ForeignKey(nameof(ChangedBy))]
        public User? ChangedByUser { get; set; }

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(50)]
        public string Source { get; set; } = "gantt_drag";
    }
}
