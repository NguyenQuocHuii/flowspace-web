using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FlowSpace.Application.Common.Dtos;

namespace FlowSpace.Application.Interfaces
{
    public interface IProjectService
    {
        Task<IEnumerable<ProjectResponse>> GetAllProjectsAsync();
        Task<ProjectResponse?> GetProjectByIdAsync(Guid id);
        Task<ProjectResponse> CreateProjectAsync(CreateProjectRequest request, Guid ownerId);
        Task<ProjectResponse?> UpdateProjectAsync(Guid id, UpdateProjectRequest request);
        Task<bool> DeleteProjectAsync(Guid id);
        Task<ProjectResponse?> UpdateProjectMembersAsync(Guid projectId, IEnumerable<Guid> memberIds);
        Task<bool> RemoveProjectMemberAsync(Guid projectId, Guid userId);
    }
}
