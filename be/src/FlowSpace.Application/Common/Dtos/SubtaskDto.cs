using System;

namespace FlowSpace.Application.Common.Dtos
{
    public class SubtaskDto
    {
        public Guid Id { get; set; }
        public Guid TaskId { get; set; }
        public string Title { get; set; } = string.Empty;
        public bool Done { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
