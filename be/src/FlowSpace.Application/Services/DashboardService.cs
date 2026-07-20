using System;
using System.Linq;
using System.Threading.Tasks;
using FlowSpace.Application.Common.Dtos;
using FlowSpace.Application.Interfaces;
using FlowSpace.Domain.Entities;
using FlowSpace.Domain.Enums;
using FlowSpace.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using TaskStatus = FlowSpace.Domain.Enums.TaskStatus;

namespace FlowSpace.Application.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IUnitOfWork _unitOfWork;

        public DashboardService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<DashboardSummaryDto> GetSummaryAsync(Guid? userId = null)
        {
            var projectQuery = _unitOfWork.Repository<Project>().GetQueryable().AsNoTracking();
            var taskQuery = _unitOfWork.Repository<TaskItem>().GetQueryable().AsNoTracking();
            var requestQuery = _unitOfWork.Repository<Request>().GetQueryable().AsNoTracking();
            var timeLogQuery = _unitOfWork.Repository<TimeLog>().GetQueryable().AsNoTracking();

            if (userId.HasValue)
            {
                taskQuery = taskQuery.Where(t => t.AssigneeId == userId.Value);
                requestQuery = requestQuery.Where(r => r.RequesterId == userId.Value);
                timeLogQuery = timeLogQuery.Where(tl => tl.UserId == userId.Value);
            }

            var now = DateTime.UtcNow;

            var totalProjects = await projectQuery.CountAsync();
            var activeProjects = await projectQuery.CountAsync(p => p.Status == ProjectStatus.Active);

            var totalTasks = await taskQuery.CountAsync();
            var completedTasks = await taskQuery.CountAsync(t => t.Status == TaskStatus.Done);
            var pendingTasks = await taskQuery.CountAsync(t => t.Status != TaskStatus.Done);
            var overdueTasks = await taskQuery.CountAsync(t => t.Status != TaskStatus.Done && t.DueDate < now);

            var pendingApprovalsCount = await requestQuery.CountAsync(r => r.Status == RequestStatus.Pending);
            var totalLoggedHours = await timeLogQuery.SumAsync(tl => (decimal?)tl.Hours) ?? 0m;

            return new DashboardSummaryDto
            {
                TotalProjects = totalProjects,
                ActiveProjects = activeProjects,
                TotalTasks = totalTasks,
                CompletedTasks = completedTasks,
                PendingTasks = pendingTasks,
                OverdueTasks = overdueTasks,
                PendingApprovalsCount = pendingApprovalsCount,
                TotalLoggedHours = totalLoggedHours
            };
        }
    }
}
