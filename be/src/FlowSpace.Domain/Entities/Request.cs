using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FlowSpace.Domain.Enums;

namespace FlowSpace.Domain.Entities
{
    public class Request
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public FlowSpace.Domain.Enums.RequestType? Type { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public Guid RequesterId { get; set; }

        [ForeignKey(nameof(RequesterId))]
        public User? Requester { get; set; }

        [Required]
        public RequestStatus Status { get; set; } = RequestStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Guid? RequestTypeId { get; set; }

        [ForeignKey(nameof(RequestTypeId))]
        public FlowSpace.Domain.Entities.RequestType? RequestType { get; set; }

        public ICollection<Approval> Approvals { get; set; } = new List<Approval>();
    }
}
