using System;
using System.Threading.Tasks;
using FlowSpace.Application.Common.Dtos;
using FlowSpace.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FlowSpace.Api.Controllers
{
    [Authorize]
    [Route("api/v1/gantt")]
    public class GanttController : BaseApiController
    {
        private readonly IGanttService _ganttService;
        private readonly ICurrentUserService _currentUserService;

        public GanttController(IGanttService ganttService, ICurrentUserService currentUserService)
        {
            _ganttService = ganttService;
            _currentUserService = currentUserService;
        }

        [HttpGet("{projectId:guid}")]
        public async Task<ActionResult<ApiResponse<GanttTimelineDto>>> GetTimeline(Guid projectId)
        {
            var timeline = await _ganttService.GetTimelineAsync(projectId);
            return OkResponse(timeline, "Gantt timeline retrieved successfully.");
        }

        [HttpPost("dependencies")]
        public async Task<ActionResult<ApiResponse<GanttDependencyDto>>> CreateDependency([FromBody] GanttDependencyDto request)
        {
            var result = await _ganttService.CreateDependencyAsync(request);
            if (!result.Success)
            {
                return FailResponse<GanttDependencyDto>(result.ErrorMessage ?? "Không thể tạo liên kết.", StatusCodes.Status400BadRequest);
            }
            return OkResponse(result.Dependency, "Tạo liên kết phụ thuộc thành công.");
        }
        
        [HttpDelete("dependencies/{id:guid}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteDependency(Guid id)
        {
            var success = await _ganttService.DeleteDependencyAsync(id);
            if (!success) return FailResponse<bool>("Dependency not found", StatusCodes.Status404NotFound);
            return OkResponse(true, "Dependency deleted");
        }

        [HttpPost("milestones")]
        public async Task<ActionResult<ApiResponse<GanttMilestoneDto>>> CreateMilestone([FromBody] GanttMilestoneDto request)
        {
            var result = await _ganttService.CreateMilestoneAsync(request);
            if (result == null) return FailResponse<GanttMilestoneDto>("Failed to create milestone", StatusCodes.Status400BadRequest);
            return OkResponse(result, "Milestone created");
        }

        [HttpPut("milestones/{id:guid}")]
        public async Task<ActionResult<ApiResponse<GanttMilestoneDto>>> UpdateMilestone(Guid id, [FromBody] DateTime date)
        {
            var result = await _ganttService.UpdateMilestoneAsync(id, date);
            if (result == null) return FailResponse<GanttMilestoneDto>("Milestone not found", StatusCodes.Status404NotFound);
            return OkResponse(result, "Milestone updated");
        }
        
        [HttpDelete("milestones/{id:guid}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteMilestone(Guid id)
        {
            var success = await _ganttService.DeleteMilestoneAsync(id);
            if (!success) return FailResponse<bool>("Milestone not found", StatusCodes.Status404NotFound);
            return OkResponse(true, "Milestone deleted");
        }

        [HttpPatch("tasks/{taskId:guid}/reschedule")]
        public async Task<ActionResult<ApiResponse<GanttTaskDto>>> RescheduleTask(Guid taskId, [FromBody] RescheduleTaskRequest request)
        {
            var result = await _ganttService.RescheduleTaskAsync(taskId, request);
            if (result == null) return FailResponse<GanttTaskDto>("Reschedule failed or dependency constraint violated", StatusCodes.Status400BadRequest);
            return OkResponse(result, "Task rescheduled successfully");
        }

        [HttpPatch("tasks/{id:guid}/schedule")]
        public async Task<ActionResult<ApiResponse<GanttScheduleUpdateResult>>> UpdateTaskSchedule(Guid id, [FromBody] GanttScheduleUpdateDto dto)
        {
            dto.TaskId = id;
            Guid currentUserId = Guid.Empty;
            if (!string.IsNullOrEmpty(_currentUserService.UserId))
            {
                Guid.TryParse(_currentUserService.UserId, out currentUserId);
            }

            var result = await _ganttService.UpdateTaskScheduleAsync(dto, currentUserId);
            if (!result.Success)
            {
                return FailResponse<GanttScheduleUpdateResult>(result.ErrorMessage ?? "Cập nhật lịch trình thất bại.", StatusCodes.Status400BadRequest);
            }

            return OkResponse(result, "Cập nhật lịch trình công việc thành công.");
        }
    }
}
