using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FlowSpace.Application.Common.Dtos;
using FlowSpace.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FlowSpace.Api.Controllers
{
    [Authorize]
    [Route("api/v1/timetracking")]
    public class TimeTrackingController : BaseApiController
    {
        private readonly ITimeLogService _timeLogService;
        private readonly ICurrentUserService _currentUser;

        public TimeTrackingController(ITimeLogService timeLogService, ICurrentUserService currentUser)
        {
            _timeLogService = timeLogService;
            _currentUser = currentUser;
        }

        [HttpGet("logs")]
        public async Task<ActionResult<ApiResponse<IEnumerable<TimeLogDto>>>> GetLogs(
            [FromQuery] Guid? userId,
            [FromQuery] Guid? taskId,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var logs = await _timeLogService.GetTimeLogsAsync(userId, taskId, fromDate, toDate);
            return OkResponse(logs, "Time logs retrieved successfully.");
        }

        [HttpPost("logs")]
        public async Task<ActionResult<ApiResponse<TimeLogDto>>> CreateLog([FromBody] CreateTimeLogRequest request)
        {
            var userIdStr = _currentUser.UserId;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return FailResponse<TimeLogDto>("Invalid user credentials.", StatusCodes.Status401Unauthorized);
            }

            var createdLog = await _timeLogService.CreateTimeLogAsync(request, userId);
            if (createdLog == null)
            {
                return FailResponse<TimeLogDto>("Task not found.", StatusCodes.Status404NotFound);
            }
            return OkResponse(createdLog, "Time log recorded successfully.");
        }

        [HttpDelete("logs/{id:guid}")]
        public async Task<ActionResult<ApiResponse<string>>> DeleteLog(Guid id)
        {
            var userIdStr = _currentUser.UserId;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return FailResponse<string>("Invalid user credentials.", StatusCodes.Status401Unauthorized);
            }

            var success = await _timeLogService.DeleteTimeLogAsync(id, userId, CanManageAllTimeLogs());
            if (!success)
            {
                return FailResponse<string>("Time log not found or not owned by current user.", StatusCodes.Status404NotFound);
            }
            return OkResponse("Time log deleted successfully.");
        }

        [HttpPut("logs/{id:guid}")]
        public async Task<ActionResult<ApiResponse<TimeLogDto>>> UpdateLog(Guid id, [FromBody] CreateTimeLogRequest request)
        {
            var userIdStr = _currentUser.UserId;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return FailResponse<TimeLogDto>("Invalid user credentials.", StatusCodes.Status401Unauthorized);
            }

            var updatedLog = await _timeLogService.UpdateTimeLogAsync(id, request, userId, CanManageAllTimeLogs());
            if (updatedLog == null)
            {
                return FailResponse<TimeLogDto>("Time log not found or not owned by current user.", StatusCodes.Status400BadRequest);
            }

            return OkResponse(updatedLog, "Time log updated successfully.");
        }

        private bool CanManageAllTimeLogs()
        {
            return string.Equals(_currentUser.Role, "director", StringComparison.OrdinalIgnoreCase)
                || string.Equals(_currentUser.Role, "admin", StringComparison.OrdinalIgnoreCase);
        }
    }
}
