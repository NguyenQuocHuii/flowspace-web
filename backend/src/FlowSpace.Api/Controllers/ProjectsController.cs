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
    public class ProjectsController : BaseApiController
    {
        private readonly IProjectService _projectService;
        private readonly ICurrentUserService _currentUser;

        public ProjectsController(IProjectService projectService, ICurrentUserService currentUser)
        {
            _projectService = projectService;
            _currentUser = currentUser;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<ProjectResponse>>>> GetAll()
        {
            var projects = await _projectService.GetAllProjectsAsync();
            return OkResponse(projects, "Projects retrieved successfully.");
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ApiResponse<ProjectResponse>>> GetById(Guid id)
        {
            var project = await _projectService.GetProjectByIdAsync(id);
            if (project == null)
            {
                return FailResponse<ProjectResponse>("Project not found.", StatusCodes.Status404NotFound);
            }
            return OkResponse(project, "Project retrieved successfully.");
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<ProjectResponse>>> Create([FromBody] CreateProjectRequest request)
        {
            var userIdStr = _currentUser.UserId;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var ownerId))
            {
                return FailResponse<ProjectResponse>("Invalid user credentials.", StatusCodes.Status401Unauthorized);
            }

            var createdProject = await _projectService.CreateProjectAsync(request, ownerId);
            return CreatedAtAction(nameof(GetById), new { id = createdProject.Id }, ApiResponse<ProjectResponse>.SuccessResult(createdProject, "Project created successfully."));
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<ApiResponse<ProjectResponse>>> Update(Guid id, [FromBody] UpdateProjectRequest request)
        {
            var updatedProject = await _projectService.UpdateProjectAsync(id, request);
            if (updatedProject == null)
            {
                return FailResponse<ProjectResponse>("Project not found.", StatusCodes.Status404NotFound);
            }
            return OkResponse(updatedProject, "Project updated successfully.");
        }

        [HttpDelete("{id:guid}")]
        public async Task<ActionResult<ApiResponse<string>>> Delete(Guid id)
        {
            var success = await _projectService.DeleteProjectAsync(id);
            if (!success)
            {
                return FailResponse<string>("Project not found.", StatusCodes.Status404NotFound);
            }
            return OkResponse("Project deleted successfully.");
        }
    }
}
