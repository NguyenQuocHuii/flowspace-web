using System;
using System.Collections.Generic;

namespace FlowSpace.Application.Common.Dtos
{
    public class ApprovalResponse
    {
        public Guid Id { get; set; }
        public int Level { get; set; }
        public string Role { get; set; } = string.Empty;
        public Guid? ApproverId { get; set; }
        public string ApproverName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Note { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class RequestResponse
    {
        public Guid Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public Guid RequesterId { get; set; }
        public string RequesterName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<ApprovalResponse> Approvals { get; set; } = new List<ApprovalResponse>();
    }
}
