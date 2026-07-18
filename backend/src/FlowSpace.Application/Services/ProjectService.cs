using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using FlowSpace.Application.Common.Dtos;
using FlowSpace.Application.Interfaces;
using FlowSpace.Domain.Entities;
using FlowSpace.Domain.Enums;
using FlowSpace.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FlowSpace.Application.Services
{
    public class ProjectService : IProjectService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ProjectService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<IEnumerable<ProjectResponse>> GetAllProjectsAsync()
        {
            var projects = await _unitOfWork.Repository<Project>().GetQueryable()
                .Include(p => p.Owner)
                .Include(p => p.Members)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ProjectResponse>>(projects);
        }

        public async Task<ProjectResponse?> GetProjectByIdAsync(Guid id)
        {
            var project = await _unitOfWork.Repository<Project>().GetQueryable()
                .Include(p => p.Owner)
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null) return null;
            return _mapper.Map<ProjectResponse>(project);
        }

        public async Task<ProjectResponse> CreateProjectAsync(CreateProjectRequest request, Guid ownerId)
        {
            var project = _mapper.Map<Project>(request);
            project.Id = Guid.NewGuid();
            project.OwnerId = ownerId;
            project.CreatedAt = DateTime.UtcNow;

            await _unitOfWork.Repository<Project>().AddAsync(project);
            await _unitOfWork.SaveChangesAsync();

            // Refetch with navigation properties loaded
            return (await GetProjectByIdAsync(project.Id))!;
        }

        public async Task<ProjectResponse?> UpdateProjectAsync(Guid id, UpdateProjectRequest request)
        {
            var project = await _unitOfWork.Repository<Project>().GetByIdAsync(id);
            if (project == null) return null;

            project.Name = request.Name;
            project.Description = request.Description;
            project.Status = Enum.Parse<ProjectStatus>(request.Status, true);
            project.Priority = Enum.Parse<ProjectPriority>(request.Priority, true);
            project.StartDate = request.StartDate;
            project.EndDate = request.EndDate;
            project.Progress = request.Progress;

            _unitOfWork.Repository<Project>().Update(project);
            await _unitOfWork.SaveChangesAsync();

            return await GetProjectByIdAsync(id);
        }

        public async Task<bool> DeleteProjectAsync(Guid id)
        {
            var project = await _unitOfWork.Repository<Project>().GetByIdAsync(id);
            if (project == null) return false;

            _unitOfWork.Repository<Project>().Delete(project);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }
    }
}
