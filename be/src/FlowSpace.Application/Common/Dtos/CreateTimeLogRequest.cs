using System;

namespace FlowSpace.Application.Common.Dtos
{
    public class CreateTimeLogRequest
    {
        public Guid TaskId { get; set; }
        public decimal Hours { get; set; }
        public string? Description { get; set; }
        public DateTime? LoggedDate { get; set; }
    }
}
