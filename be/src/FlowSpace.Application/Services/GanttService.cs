using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FlowSpace.Application.Common.Dtos;
using FlowSpace.Application.Interfaces;
using FlowSpace.Domain.Entities;
using FlowSpace.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FlowSpace.Application.Services
{
    public class GanttService : IGanttService
    {
        private readonly IUnitOfWork _unitOfWork;

        public GanttService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<GanttTimelineDto> GetTimelineAsync(Guid projectId)
        {
            var taskRepo = _unitOfWork.Repository<TaskItem>().GetQueryable().AsNoTracking();
            var milestoneRepo = _unitOfWork.Repository<Milestone>().GetQueryable().AsNoTracking();
            var depRepo = _unitOfWork.Repository<TaskDependency>().GetQueryable().AsNoTracking();
            var resRepo = _unitOfWork.Repository<TaskResource>().GetQueryable().AsNoTracking();

            var tasks = await taskRepo
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

            var milestones = await milestoneRepo
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
            var links = await depRepo
                .Where(d => taskIds.Contains(d.PredecessorId) || taskIds.Contains(d.SuccessorId))
                .Select(d => new GanttDependencyDto
                {
                    Id = d.Id,
                    Source = d.PredecessorId,
                    Target = d.SuccessorId,
                    Type = d.Type.ToString(),
                    LagDays = d.LagDays
                }).ToListAsync();

            var resources = await resRepo
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

            var criticalPath = ComputeCriticalPath(tasks, links);

            return new GanttTimelineDto
            {
                Tasks = tasks,
                Milestones = milestones,
                Links = links,
                Resources = resources,
                CriticalPath = criticalPath
            };
        }

        private List<Guid> ComputeCriticalPath(List<GanttTaskDto> tasks, List<GanttDependencyDto> links)
        {
            if (!tasks.Any()) return new List<Guid>();

            var taskMap = tasks.ToDictionary(t => t.Id);
            var duration = new Dictionary<Guid, int>();
            var es = new Dictionary<Guid, int>(); // Early Start
            var ef = new Dictionary<Guid, int>(); // Early Finish
            var ls = new Dictionary<Guid, int>(); // Late Start
            var lf = new Dictionary<Guid, int>(); // Late Finish

            var minDate = tasks.Where(t => t.StartDate.HasValue).Min(t => (DateTime?)t.StartDate.Value) ?? DateTime.UtcNow;

            foreach (var t in tasks)
            {
                var s = t.StartDate ?? minDate;
                var e = t.DueDate ?? s.AddDays(1);
                var d = Math.Max(1, (int)(e - s).TotalDays);
                duration[t.Id] = d;

                var startDay = Math.Max(0, (int)(s - minDate).TotalDays);
                es[t.Id] = startDay;
                ef[t.Id] = startDay + d;
            }

            // Forward Pass
            bool changed = true;
            int passCount = 0;
            while (changed && passCount < tasks.Count * 2)
            {
                changed = false;
                passCount++;
                foreach (var link in links)
                {
                    if (!taskMap.ContainsKey(link.Source) || !taskMap.ContainsKey(link.Target)) continue;

                    int requiredEs = ef[link.Source] + link.LagDays;
                    if (link.Type == "StartToStart") requiredEs = es[link.Source] + link.LagDays;
                    
                    if (requiredEs > es[link.Target])
                    {
                        es[link.Target] = requiredEs;
                        ef[link.Target] = requiredEs + duration[link.Target];
                        changed = true;
                    }
                }
            }

            int maxEf = ef.Values.DefaultIfEmpty(0).Max();

            // Backward Pass
            foreach (var t in tasks)
            {
                lf[t.Id] = maxEf;
                ls[t.Id] = maxEf - duration[t.Id];
            }

            changed = true;
            passCount = 0;
            while (changed && passCount < tasks.Count * 2)
            {
                changed = false;
                passCount++;
                foreach (var link in links)
                {
                    if (!taskMap.ContainsKey(link.Source) || !taskMap.ContainsKey(link.Target)) continue;

                    int requiredLf = ls[link.Target] - link.LagDays;
                    if (requiredLf < lf[link.Source])
                    {
                        lf[link.Source] = requiredLf;
                        ls[link.Source] = requiredLf - duration[link.Source];
                        changed = true;
                    }
                }
            }

            var critical = new List<Guid>();
            foreach (var t in tasks)
            {
                int floatTime = ls[t.Id] - es[t.Id];
                if (floatTime <= 0)
                {
                    critical.Add(t.Id);
                }
            }

            return critical;
        }

        public async Task<GanttDependencyDto?> CreateDependencyAsync(GanttDependencyDto request)
        {
            // Cycle detection check
            if (await HasCycleAsync(request.Source, request.Target))
            {
                return null; // Reject dependency creation to prevent cycle
            }

            var dep = new TaskDependency
            {
                Id = Guid.NewGuid(),
                PredecessorId = request.Source,
                SuccessorId = request.Target,
                LagDays = request.LagDays,
                Type = Enum.TryParse<Domain.Enums.DependencyType>(request.Type, out var type) ? type : Domain.Enums.DependencyType.FinishToStart
            };
            await _unitOfWork.Repository<TaskDependency>().AddAsync(dep);
            await _unitOfWork.SaveChangesAsync();
            request.Id = dep.Id;
            return request;
        }

        private async Task<bool> HasCycleAsync(Guid source, Guid target)
        {
            if (source == target) return true;
            var allLinks = await _unitOfWork.Repository<TaskDependency>().GetQueryable().AsNoTracking().ToListAsync();
            
            var adj = new Dictionary<Guid, List<Guid>>();
            foreach (var l in allLinks)
            {
                if (!adj.ContainsKey(l.PredecessorId)) adj[l.PredecessorId] = new List<Guid>();
                adj[l.PredecessorId].Add(l.SuccessorId);
            }
            if (!adj.ContainsKey(source)) adj[source] = new List<Guid>();
            adj[source].Add(target);

            // DFS from target to see if we can reach source
            var visited = new HashSet<Guid>();
            var stack = new Stack<Guid>();
            stack.Push(target);

            while (stack.Count > 0)
            {
                var current = stack.Pop();
                if (current == source) return true;
                if (visited.Contains(current)) continue;
                visited.Add(current);

                if (adj.ContainsKey(current))
                {
                    foreach (var neighbor in adj[current])
                    {
                        stack.Push(neighbor);
                    }
                }
            }
            return false;
        }

        public async Task<bool> DeleteDependencyAsync(Guid id)
        {
            var repo = _unitOfWork.Repository<TaskDependency>();
            var dep = await repo.GetByIdAsync(id);
            if (dep == null) return false;
            repo.Delete(dep);
            await _unitOfWork.SaveChangesAsync();
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
            };
            await _unitOfWork.Repository<Milestone>().AddAsync(milestone);
            await _unitOfWork.SaveChangesAsync();
            request.Id = milestone.Id;
            return request;
        }

        public async Task<GanttMilestoneDto?> UpdateMilestoneAsync(Guid milestoneId, DateTime date)
        {
            var repo = _unitOfWork.Repository<Milestone>();
            var milestone = await repo.GetByIdAsync(milestoneId);
            if (milestone == null) return null;
            milestone.Date = date;
            repo.Update(milestone);
            await _unitOfWork.SaveChangesAsync();

            return new GanttMilestoneDto
            {
                Id = milestone.Id,
                Name = milestone.Name,
                Date = milestone.Date,
                Status = milestone.Status.ToString().ToLower(),
                OwnerId = milestone.OwnerId
            };
        }

        public async Task<bool> DeleteMilestoneAsync(Guid id)
        {
            var repo = _unitOfWork.Repository<Milestone>();
            var milestone = await repo.GetByIdAsync(id);
            if (milestone == null) return false;
            repo.Delete(milestone);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<GanttTaskDto?> RescheduleTaskAsync(Guid taskId, RescheduleTaskRequest request)
        {
            var repo = _unitOfWork.Repository<TaskItem>();
            var task = await repo.GetQueryable().FirstOrDefaultAsync(t => t.Id == taskId);
            if (task == null) return null;

            if (request.StartDate.HasValue) task.StartDate = request.StartDate.Value;
            if (request.DueDate.HasValue) task.DueDate = request.DueDate.Value;
            if (request.Progress.HasValue) task.CompletionScore = Math.Clamp(request.Progress.Value, 0, 100);

            repo.Update(task);
            await _unitOfWork.SaveChangesAsync();

            return new GanttTaskDto
            {
                Id = task.Id,
                Code = task.Code,
                Title = task.Title,
                ProjectId = task.ProjectId,
                AssigneeId = task.AssigneeId,
                Status = task.Status.ToString().ToLower(),
                Priority = task.Priority.ToString().ToLower(),
                StartDate = task.StartDate,
                DueDate = task.DueDate,
                EstimatedHours = task.EstimatedHours,
                LoggedHours = task.LoggedHours,
                Progress = task.CompletionScore ?? 0
            };
        }
    }
}
