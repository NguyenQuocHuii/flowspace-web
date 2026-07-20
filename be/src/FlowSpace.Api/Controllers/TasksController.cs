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
    public class TasksController : BaseApiController
    {
        private readonly ITaskService _taskService;
        private readonly ICurrentUserService _currentUser;

        public TasksController(ITaskService taskService, ICurrentUserService currentUser)
        {
            _taskService = taskService;
            _currentUser = currentUser;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<TaskResponse>>>> GetAll(
            [FromQuery] Guid? projectId,
            [FromQuery] string? status,
            [FromQuery] Guid? assigneeId)
        {
            var tasks = await _taskService.GetAllTasksAsync(projectId, status, assigneeId);
            return OkResponse(tasks, "Tasks retrieved successfully.");
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ApiResponse<TaskResponse>>> GetById(Guid id)
        {
            var task = await _taskService.GetTaskByIdAsync(id);
            if (task == null)
            {
                return FailResponse<TaskResponse>("Task not found.", StatusCodes.Status404NotFound);
            }
            return OkResponse(task, "Task retrieved successfully.");
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<TaskResponse>>> Create([FromBody] CreateTaskRequest request)
        {
            var userIdStr = _currentUser.UserId;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var createdById))
            {
                return FailResponse<TaskResponse>("Invalid user credentials.", StatusCodes.Status401Unauthorized);
            }

            var createdTask = await _taskService.CreateTaskAsync(request, createdById);
            return CreatedAtAction(nameof(GetById), new { id = createdTask.Id }, ApiResponse<TaskResponse>.SuccessResult(createdTask, "Task created successfully."));
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<ApiResponse<TaskResponse>>> Update(Guid id, [FromBody] UpdateTaskRequest request)
        {
            var updatedTask = await _taskService.UpdateTaskAsync(id, request);
            if (updatedTask == null)
            {
                return FailResponse<TaskResponse>("Task not found.", StatusCodes.Status404NotFound);
            }
            return OkResponse(updatedTask, "Task updated successfully.");
        }

        [HttpPatch("{id:guid}/status")]
        public async Task<ActionResult<ApiResponse<TaskResponse>>> UpdateStatus(Guid id, [FromBody] UpdateTaskStatusRequest request)
        {
            var updatedTask = await _taskService.UpdateTaskStatusAsync(id, request.Status);
            if (updatedTask == null)
            {
                return FailResponse<TaskResponse>("Task not found.", StatusCodes.Status404NotFound);
            }
            return OkResponse(updatedTask, "Task status updated successfully.");
        }

        [HttpDelete("{id:guid}")]
        public async Task<ActionResult<ApiResponse<string>>> Delete(Guid id)
        {
            var success = await _taskService.DeleteTaskAsync(id);
            if (!success)
            {
                return FailResponse<string>("Task not found.", StatusCodes.Status404NotFound);
            }
            return OkResponse("Task deleted successfully.");
        }

        [HttpPost("{id:guid}/subtasks")]
        public async Task<ActionResult<ApiResponse<SubtaskDto>>> AddSubtask(Guid id, [FromBody] CreateSubtaskRequest request)
        {
            var subtask = await _taskService.AddSubtaskAsync(id, request.Title);
            if (subtask == null)
            {
                return FailResponse<SubtaskDto>("Task not found.", StatusCodes.Status404NotFound);
            }
            return OkResponse(subtask, "Subtask added successfully.");
        }

        [HttpPatch("subtasks/{subtaskId:guid}/toggle")]
        public async Task<ActionResult<ApiResponse<string>>> ToggleSubtask(Guid subtaskId)
        {
            var success = await _taskService.ToggleSubtaskAsync(subtaskId);
            if (!success)
            {
                return FailResponse<string>("Subtask not found.", StatusCodes.Status404NotFound);
            }
            return OkResponse("Subtask status toggled successfully.");
        }

        [HttpDelete("subtasks/{subtaskId:guid}")]
        public async Task<ActionResult<ApiResponse<string>>> DeleteSubtask(Guid subtaskId)
        {
            var success = await _taskService.DeleteSubtaskAsync(subtaskId);
            if (!success)
            {
                return FailResponse<string>("Subtask not found.", StatusCodes.Status404NotFound);
            }
            return OkResponse("Subtask deleted successfully.");
        }

        [HttpPost("{id:guid}/comments")]
        public async Task<ActionResult<ApiResponse<CommentDto>>> AddComment(Guid id, [FromBody] CreateCommentRequest request)
        {
            var userIdStr = _currentUser.UserId;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return FailResponse<CommentDto>("Invalid user credentials.", StatusCodes.Status401Unauthorized);
            }

            var comment = await _taskService.AddCommentAsync(id, userId, request.Text);
            if (comment == null)
            {
                return FailResponse<CommentDto>("Task not found.", StatusCodes.Status404NotFound);
            }
            return OkResponse(comment, "Comment added successfully.");
        }
    }
}
