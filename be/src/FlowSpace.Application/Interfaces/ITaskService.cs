using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FlowSpace.Application.Common.Dtos;

namespace FlowSpace.Application.Interfaces
{
    public interface ITaskService
    {
        Task<IEnumerable<TaskResponse>> GetAllTasksAsync(Guid? projectId = null, string? status = null, Guid? assigneeId = null);
        Task<TaskResponse?> GetTaskByIdAsync(Guid id);
        Task<TaskResponse> CreateTaskAsync(CreateTaskRequest request, Guid createdById);
        Task<TaskResponse?> UpdateTaskAsync(Guid id, UpdateTaskRequest request);
        Task<TaskResponse?> UpdateTaskStatusAsync(Guid id, string status);
        Task<bool> DeleteTaskAsync(Guid id);
        Task<SubtaskDto?> AddSubtaskAsync(Guid taskId, string title);
        Task<bool> ToggleSubtaskAsync(Guid subtaskId);
        Task<bool> DeleteSubtaskAsync(Guid subtaskId);
        Task<CommentDto?> AddCommentAsync(Guid taskId, Guid userId, string text);
    }
}
