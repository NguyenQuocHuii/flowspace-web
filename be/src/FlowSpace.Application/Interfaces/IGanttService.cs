using System;
using System.Threading.Tasks;
using FlowSpace.Application.Common.Dtos;

namespace FlowSpace.Application.Interfaces
{
    public interface IGanttService
    {
        Task<GanttTimelineDto> GetTimelineAsync(Guid projectId);
        Task<GanttDependencyDto?> CreateDependencyAsync(GanttDependencyDto request);
        Task<bool> DeleteDependencyAsync(Guid id);
        Task<GanttMilestoneDto?> CreateMilestoneAsync(GanttMilestoneDto request);
        Task<GanttMilestoneDto?> UpdateMilestoneAsync(Guid milestoneId, DateTime date);
        Task<bool> DeleteMilestoneAsync(Guid id);
        Task<GanttTaskDto?> RescheduleTaskAsync(Guid taskId, RescheduleTaskRequest request);
        Task<GanttScheduleUpdateResult> UpdateTaskScheduleAsync(GanttScheduleUpdateDto dto, Guid currentUserId);
    }
}
