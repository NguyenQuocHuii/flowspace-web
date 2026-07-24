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
                    ProjectId = m.ProjectId,
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

        public async Task<GanttDependencyCreateResult> CreateDependencyAsync(GanttDependencyDto request)
        {
            if (request.Source == request.Target)
            {
                return new GanttDependencyCreateResult
                {
                    Success = false,
                    ErrorMessage = "Không thể tạo liên kết: Công việc không thể phụ thuộc vào chính nó."
                };
            }

            var taskRepo = _unitOfWork.Repository<TaskItem>();
            var sourceTask = await taskRepo.GetByIdAsync(request.Source);
            var targetTask = await taskRepo.GetByIdAsync(request.Target);

            if (sourceTask == null || targetTask == null)
            {
                return new GanttDependencyCreateResult
                {
                    Success = false,
                    ErrorMessage = "Không tìm thấy công việc để tạo liên kết."
                };
            }

            // Load all dependencies of the project to check cycle (Target -> ... -> Source)
            var projTaskIds = await taskRepo.GetQueryable()
                .Where(t => t.ProjectId == sourceTask.ProjectId)
                .Select(t => t.Id)
                .ToListAsync();

            var projectDependencies = await _unitOfWork.Repository<TaskDependency>().GetQueryable()
                .AsNoTracking()
                .Where(d => projTaskIds.Contains(d.PredecessorId) && projTaskIds.Contains(d.SuccessorId))
                .ToListAsync();

            if (HasCycle(request.Source, request.Target, projectDependencies))
            {
                return new GanttDependencyCreateResult
                {
                    Success = false,
                    ErrorMessage = $"Không thể tạo liên kết: Sẽ tạo vòng lặp phụ thuộc (cycle) giữa '{sourceTask.Title}' và '{targetTask.Title}'."
                };
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
            return new GanttDependencyCreateResult
            {
                Success = true,
                Dependency = request
            };
        }

        public static bool HasCycle(Guid source, Guid target, List<TaskDependency> existingLinks)
        {
            if (source == target) return true;

            var adj = new Dictionary<Guid, List<Guid>>();
            foreach (var l in existingLinks)
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
                ProjectId = request.ProjectId,
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
                ProjectId = milestone.ProjectId,
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

            var oldStart = task.StartDate;
            var oldDue = task.DueDate;

            if (request.StartDate.HasValue) task.StartDate = request.StartDate.Value;
            if (request.DueDate.HasValue) task.DueDate = request.DueDate.Value;
            if (request.Progress.HasValue) task.CompletionScore = Math.Clamp(request.Progress.Value, 0, 100);

            repo.Update(task);

            // Audit Log in TaskScheduleHistory
            var history = new TaskScheduleHistory
            {
                Id = Guid.NewGuid(),
                TaskId = task.Id,
                OldStartDate = oldStart,
                OldDueDate = oldDue,
                NewStartDate = task.StartDate,
                NewDueDate = task.DueDate,
                ChangedAt = DateTime.UtcNow,
                Source = "gantt_drag"
            };
            await _unitOfWork.Repository<TaskScheduleHistory>().AddAsync(history);

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

        public async Task<GanttScheduleUpdateResult> UpdateTaskScheduleAsync(GanttScheduleUpdateDto dto, Guid currentUserId)
        {
            if (dto.NewDueDate < dto.NewStartDate)
            {
                return new GanttScheduleUpdateResult
                {
                    Success = false,
                    ErrorMessage = "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu."
                };
            }

            var taskRepo = _unitOfWork.Repository<TaskItem>();
            var depRepo = _unitOfWork.Repository<TaskDependency>();
            var historyRepo = _unitOfWork.Repository<TaskScheduleHistory>();

            var task = await taskRepo.GetQueryable().FirstOrDefaultAsync(t => t.Id == dto.TaskId);
            if (task == null)
            {
                return new GanttScheduleUpdateResult
                {
                    Success = false,
                    ErrorMessage = "Không tìm thấy công việc."
                };
            }

            // Validate Predecessor Dependencies (FinishToStart)
            var predecessorDependencies = await depRepo.GetQueryable()
                .Include(d => d.Predecessor)
                .Where(d => d.SuccessorId == dto.TaskId)
                .ToListAsync();

            foreach (var dep in predecessorDependencies)
            {
                if (dep.Predecessor != null)
                {
                    var predEnd = dep.Predecessor.DueDate ?? dep.Predecessor.StartDate;
                    if (predEnd.HasValue)
                    {
                        var minAllowedStart = predEnd.Value.AddDays(dep.LagDays);
                        if (dep.Type == Domain.Enums.DependencyType.FinishToStart && dto.NewStartDate < minAllowedStart)
                        {
                            return new GanttScheduleUpdateResult
                            {
                                Success = false,
                                ErrorMessage = $"Không thể bắt đầu công việc '{task.Title}' trước khi công việc tiên quyết '{dep.Predecessor.Title}' kết thúc + độ trễ {dep.LagDays} ngày."
                            };
                        }
                    }
                }
            }

            var affectedTaskIds = new List<Guid>();
            var now = DateTime.UtcNow;

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var queue = new Queue<(Guid TaskId, DateTime NewStart, DateTime NewDue, string Source, Guid? ChangedBy)>();
                queue.Enqueue((dto.TaskId, dto.NewStartDate, dto.NewDueDate, dto.Source, currentUserId.Equals(Guid.Empty) ? null : currentUserId));

                var visited = new HashSet<Guid>();
                int depth = 0;

                while (queue.Count > 0 && depth < 50)
                {
                    depth++;
                    var currentUpdate = queue.Dequeue();
                    var targetTask = await taskRepo.GetQueryable().FirstOrDefaultAsync(t => t.Id == currentUpdate.TaskId);
                    if (targetTask == null || visited.Contains(targetTask.Id)) continue;

                    visited.Add(targetTask.Id);
                    affectedTaskIds.Add(targetTask.Id);

                    var oldStart = targetTask.StartDate;
                    var oldDue = targetTask.DueDate;

                    targetTask.StartDate = currentUpdate.NewStart;
                    targetTask.DueDate = currentUpdate.NewDue;
                    if (targetTask.StartDate.HasValue && targetTask.DueDate.HasValue)
                    {
                        targetTask.DurationDays = Math.Max(1, (int)(targetTask.DueDate.Value - targetTask.StartDate.Value).TotalDays);
                    }

                    taskRepo.Update(targetTask);

                    var history = new TaskScheduleHistory
                    {
                        Id = Guid.NewGuid(),
                        TaskId = targetTask.Id,
                        OldStartDate = oldStart,
                        OldDueDate = oldDue,
                        NewStartDate = targetTask.StartDate,
                        NewDueDate = targetTask.DueDate,
                        ChangedBy = currentUpdate.ChangedBy,
                        ChangedAt = now,
                        Source = currentUpdate.Source
                    };
                    await historyRepo.AddAsync(history);

                    var successorDependencies = await depRepo.GetQueryable()
                        .Include(d => d.Successor)
                        .Where(d => d.PredecessorId == targetTask.Id)
                        .ToListAsync();

                    foreach (var succDep in successorDependencies)
                    {
                        if (succDep.Successor == null) continue;
                        var succ = succDep.Successor;

                        if (succ.StartDate.HasValue && succ.DueDate.HasValue)
                        {
                            var succDurationDays = Math.Max(1, (int)(succ.DueDate.Value - succ.StartDate.Value).TotalDays);
                            var requiredStart = targetTask.DueDate.Value.AddDays(succDep.LagDays);

                            if (succ.StartDate.Value < requiredStart)
                            {
                                var newSuccStart = requiredStart;
                                var newSuccDue = newSuccStart.AddDays(succDurationDays);
                                queue.Enqueue((succ.Id, newSuccStart, newSuccDue, "cascade", currentUpdate.ChangedBy));
                            }
                        }
                    }
                }

                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();

                var updatedTaskDto = new GanttTaskDto
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

                return new GanttScheduleUpdateResult
                {
                    Success = true,
                    UpdatedTask = updatedTaskDto,
                    AffectedTaskIds = affectedTaskIds
                };
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return new GanttScheduleUpdateResult
                {
                    Success = false,
                    ErrorMessage = $"Lỗi hệ thống khi cập nhật lịch trình: {ex.Message}"
                };
            }
        }
    }
}
