using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FlowSpace.Domain.Enums;

namespace FlowSpace.Domain.Entities
{
    public class TaskDependency
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid PredecessorId { get; set; }

        [ForeignKey(nameof(PredecessorId))]
        public TaskItem? Predecessor { get; set; }

        [Required]
        public Guid SuccessorId { get; set; }

        [ForeignKey(nameof(SuccessorId))]
        public TaskItem? Successor { get; set; }

        [Required]
        public DependencyType Type { get; set; } = DependencyType.FinishToStart;

        // Lag in days (can be negative for lead time)
        public int LagDays { get; set; } = 0;
    }
}
