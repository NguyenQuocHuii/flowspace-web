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

        public GanttController(IGanttService ganttService)
        {
            _ganttService = ganttService;
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
            if (result == null) return FailResponse<GanttDependencyDto>("Failed to create dependency", StatusCodes.Status400BadRequest);
            return OkResponse(result, "Dependency created");
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
    }
}
