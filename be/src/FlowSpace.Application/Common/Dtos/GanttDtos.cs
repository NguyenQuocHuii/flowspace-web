using System;
using System.Collections.Generic;

namespace FlowSpace.Application.Common.Dtos
{
    public class GanttTimelineDto
    {
        public IEnumerable<GanttTaskDto> Tasks { get; set; } = new List<GanttTaskDto>();
        public IEnumerable<GanttMilestoneDto> Milestones { get; set; } = new List<GanttMilestoneDto>();
        public IEnumerable<GanttDependencyDto> Links { get; set; } = new List<GanttDependencyDto>();
        public IEnumerable<GanttResourceDto> Resources { get; set; } = new List<GanttResourceDto>();
        public IEnumerable<Guid> CriticalPath { get; set; } = new List<Guid>();
    }

    public class GanttTaskDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public Guid ProjectId { get; set; }
        public Guid? AssigneeId { get; set; }
        public string AssigneeName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public int EstimatedHours { get; set; }
        public decimal LoggedHours { get; set; }
        public int Progress { get; set; }
        // For tree hierarchy
        public Guid? ParentId { get; set; }
    }

    public class GanttMilestoneDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Status { get; set; } = string.Empty;
        public Guid? OwnerId { get; set; }
    }

    public class GanttDependencyDto
    {
        public Guid Id { get; set; }
        public Guid Source { get; set; } // Predecessor
        public Guid Target { get; set; } // Successor
        public string Type { get; set; } = "FinishToStart";
        public int LagDays { get; set; }
    }

    public class GanttResourceDto
    {
        public Guid Id { get; set; }
        public Guid TaskId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int AllocationPercentage { get; set; }
    }

    public class RescheduleTaskRequest
    {
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public int? Progress { get; set; }
    }

    public class GanttScheduleUpdateDto
    {
        public Guid TaskId { get; set; }
        public DateTime NewStartDate { get; set; }
        public DateTime NewDueDate { get; set; }
        public string Source { get; set; } = "drag"; // "drag" | "resize_start" | "resize_end"
    }

    public class GanttScheduleUpdateResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public GanttTaskDto? UpdatedTask { get; set; }
        public IReadOnlyCollection<Guid> AffectedTaskIds { get; set; } = new List<Guid>();
    }
}
