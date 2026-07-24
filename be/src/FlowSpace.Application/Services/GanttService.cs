using System;
using System.Linq;
using System.Threading.Tasks;
using FlowSpace.Application.Common.Dtos;
using FlowSpace.Application.Interfaces;
using FlowSpace.Domain.Entities;
using FlowSpace.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace FlowSpace.Application.Services
{
    public class GanttService : IGanttService
    {
        private readonly FlowSpaceDbContext _context;

        public GanttService(FlowSpaceDbContext context)
        {
            _context = context;
        }

        public async Task<GanttTimelineDto> GetTimelineAsync(Guid projectId)
        {
            var tasks = await _context.Tasks
                .Include(t => t.Assignee)
                .Where(t => t.ProjectId == projectId)
                .Select(t => new GanttTaskDto
                {
                    Id = t.Id,
                    Code = t.Code,
                    Title = t.Title,
                    ProjectId = t.ProjectId,
                    AssigneeId = t.AssigneeId,
                    AssigneeName = t.Assignee != null ? t.Assignee.Name : string.Empty,
                    Status = t.Status.ToString().ToLower(),
                    Priority = t.Priority.ToString().ToLower(),
                    StartDate = t.StartDate,
                    DueDate = t.DueDate,
                    EstimatedHours = t.EstimatedHours,
                    LoggedHours = t.LoggedHours,
                    Progress = t.CompletionScore ?? 0
                }).ToListAsync();

            var milestones = await _context.Milestones
                .Where(m => m.ProjectId == projectId)
                .Select(m => new GanttMilestoneDto
                {
                    Id = m.Id,
                    Name = m.Name,
                    Date = m.Date,
                    Status = m.Status.ToString().ToLower(),
                    OwnerId = m.OwnerId
                }).ToListAsync();

            var taskIds = tasks.Select(t => t.Id).ToList();
            var links = await _context.TaskDependencies
                .Where(d => taskIds.Contains(d.PredecessorId) || taskIds.Contains(d.SuccessorId))
                .Select(d => new GanttDependencyDto
                {
                    Id = d.Id,
                    Source = d.PredecessorId,
                    Target = d.SuccessorId,
                    Type = d.Type.ToString(),
                    LagDays = d.LagDays
                }).ToListAsync();

            var resources = await _context.TaskResources
                .Include(r => r.User)
                .Where(r => taskIds.Contains(r.TaskId))
                .Select(r => new GanttResourceDto
                {
                    Id = r.Id,
                    TaskId = r.TaskId,
                    UserId = r.UserId,
                    UserName = r.User != null ? r.User.Name : string.Empty,
                    AllocationPercentage = r.AllocationPercentage
                }).ToListAsync();

            return new GanttTimelineDto
            {
                Tasks = tasks,
                Milestones = milestones,
                Links = links,
                Resources = resources
            };
        }

        public async Task<GanttDependencyDto?> CreateDependencyAsync(GanttDependencyDto request)
        {
            var dep = new TaskDependency
            {
                Id = Guid.NewGuid(),
                PredecessorId = request.Source,
                SuccessorId = request.Target,
                LagDays = request.LagDays,
                Type = Enum.TryParse<Domain.Enums.DependencyType>(request.Type, out var type) ? type : Domain.Enums.DependencyType.FinishToStart
            };
            _context.TaskDependencies.Add(dep);
            await _context.SaveChangesAsync();
            request.Id = dep.Id;
            return request;
        }

        public async Task<bool> DeleteDependencyAsync(Guid id)
        {
            var dep = await _context.TaskDependencies.FindAsync(id);
            if (dep == null) return false;
            _context.TaskDependencies.Remove(dep);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<GanttMilestoneDto?> CreateMilestoneAsync(GanttMilestoneDto request)
        {
            var milestone = new Milestone
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Date = request.Date,
                OwnerId = request.OwnerId,
                // ProjectId would normally be resolved from request
            };
            _context.Milestones.Add(milestone);
            await _context.SaveChangesAsync();
            request.Id = milestone.Id;
            return request;
        }

        public async Task<bool> DeleteMilestoneAsync(Guid id)
        {
            var milestone = await _context.Milestones.FindAsync(id);
            if (milestone == null) return false;
            _context.Milestones.Remove(milestone);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
