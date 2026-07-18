using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FlowSpace.Domain.Enums;

namespace FlowSpace.Domain.Entities
{
    public class Approval
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid RequestId { get; set; }

        [ForeignKey(nameof(RequestId))]
        public Request? Request { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int Level { get; set; }

        [Required]
        [MaxLength(20)]
        public string Role { get; set; } = string.Empty; // team_lead, manager, director

        public Guid? ApproverId { get; set; }

        [ForeignKey(nameof(ApproverId))]
        public User? Approver { get; set; }

        [Required]
        public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;

        [MaxLength(1000)]
        public string? Note { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}
