using System;

namespace FlowSpace.Domain.Entities
{
    public class WorkflowRule
    {
        public Guid Id { get; set; }
        public string RequestType { get; set; } = string.Empty; // "leave", "overtime", "purchase", "remote"
        public string Name { get; set; } = string.Empty;
        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }
        public string SequenceSteps { get; set; } = string.Empty; // "team_lead,manager,director"
        public bool IsActive { get; set; } = true;
    }
}
