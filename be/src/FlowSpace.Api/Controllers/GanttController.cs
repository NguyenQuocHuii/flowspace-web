using System;
using System.Threading.Tasks;
using FlowSpace.Api.Hubs;
using FlowSpace.Application.Common.Dtos;
using FlowSpace.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace FlowSpace.Api.Controllers
{
    [Authorize]
    [Route("api/v1/gantt")]
    public class GanttController : BaseApiController
    {
        private readonly IGanttService _ganttService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IHubContext<GanttHub> _ganttHubContext;

        public GanttController(
            IGanttService ganttService,
            ICurrentUserService currentUserService,
            IHubContext<GanttHub> ganttHubContext)
        {
            _ganttService = ganttService;
            _currentUserService = currentUserService;
            _ganttHubContext = ganttHubContext;
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

            Guid currentUserId = GetCurrentUserId();
            // Broadcast dependency change
            await _ganttHubContext.Clients.All.SendAsync("DependencyChanged", new
            {
                action = "create",
                dependency = result.Dependency,
                changedBy = currentUserId
            });

            return OkResponse(result.Dependency, "Tạo liên kết phụ thuộc thành công.");
        }
        
        [HttpDelete("dependencies/{id:guid}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteDependency(Guid id)
        {
            var success = await _ganttService.DeleteDependencyAsync(id);
            if (!success) return FailResponse<bool>("Dependency not found", StatusCodes.Status404NotFound);

            Guid currentUserId = GetCurrentUserId();
            await _ganttHubContext.Clients.All.SendAsync("DependencyChanged", new
            {
                action = "delete",
                dependencyId = id,
                changedBy = currentUserId
            });

            return OkResponse(true, "Dependency deleted");
        }

        [HttpPost("milestones")]
        public async Task<ActionResult<ApiResponse<GanttMilestoneDto>>> CreateMilestone([FromBody] GanttMilestoneDto request)
        {
            var result = await _ganttService.CreateMilestoneAsync(request);
            if (result == null) return FailResponse<GanttMilestoneDto>("Failed to create milestone", StatusCodes.Status400BadRequest);

            Guid currentUserId = GetCurrentUserId();
            if (result.ProjectId != Guid.Empty)
            {
                await _ganttHubContext.Clients.Group($"gantt-{result.ProjectId}").SendAsync("MilestoneChanged", new
                {
                    action = "create",
                    milestone = result,
                    changedBy = currentUserId
                });
            }

            return OkResponse(result, "Milestone created");
        }

        [HttpPut("milestones/{id:guid}")]
        public async Task<ActionResult<ApiResponse<GanttMilestoneDto>>> UpdateMilestone(Guid id, [FromBody] DateTime date)
        {
            var result = await _ganttService.UpdateMilestoneAsync(id, date);
            if (result == null) return FailResponse<GanttMilestoneDto>("Milestone not found", StatusCodes.Status404NotFound);

            Guid currentUserId = GetCurrentUserId();
            await _ganttHubContext.Clients.All.SendAsync("MilestoneChanged", new
            {
                action = "update",
                milestone = result,
                changedBy = currentUserId
            });

            return OkResponse(result, "Milestone updated");
        }
        
        [HttpDelete("milestones/{id:guid}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteMilestone(Guid id)
        {
            var success = await _ganttService.DeleteMilestoneAsync(id);
            if (!success) return FailResponse<bool>("Milestone not found", StatusCodes.Status404NotFound);

            Guid currentUserId = GetCurrentUserId();
            await _ganttHubContext.Clients.All.SendAsync("MilestoneChanged", new
            {
                action = "delete",
                milestoneId = id,
                changedBy = currentUserId
            });

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
            Guid currentUserId = GetCurrentUserId();

            var result = await _ganttService.UpdateTaskScheduleAsync(dto, currentUserId);
            if (!result.Success)
            {
                return FailResponse<GanttScheduleUpdateResult>(result.ErrorMessage ?? "Cập nhật lịch trình thất bại.", StatusCodes.Status400BadRequest);
            }

            if (result.UpdatedTask != null)
            {
                // Broadcast TaskScheduleUpdated event to project group
                await _ganttHubContext.Clients.Group($"gantt-{result.UpdatedTask.ProjectId}").SendAsync("TaskScheduleUpdated", new
                {
                    taskId = dto.TaskId,
                    newStartDate = dto.NewStartDate,
                    newDueDate = dto.NewDueDate,
                    affectedTaskIds = result.AffectedTaskIds,
                    changedBy = currentUserId
                });
            }

            return OkResponse(result, "Cập nhật lịch trình công việc thành công.");
        }

        private Guid GetCurrentUserId()
        {
            if (!string.IsNullOrEmpty(_currentUserService.UserId) && Guid.TryParse(_currentUserService.UserId, out var userId))
            {
                return userId;
            }
            return Guid.Empty;
        }
    }
}
