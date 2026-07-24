using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FlowSpace.Domain.Entities
{
    public class Milestone
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(250)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public Guid ProjectId { get; set; }

        [ForeignKey(nameof(ProjectId))]
        public Project? Project { get; set; }

        [Required]
        public DateTime Date { get; set; }

        public Guid? OwnerId { get; set; }

        [ForeignKey(nameof(OwnerId))]
        public User? Owner { get; set; }

        public Enums.TaskStatus Status { get; set; } = Enums.TaskStatus.Todo;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
