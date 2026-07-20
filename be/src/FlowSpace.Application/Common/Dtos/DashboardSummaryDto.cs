using System;

namespace FlowSpace.Application.Common.Dtos
{
    public class DashboardSummaryDto
    {
        public int TotalProjects { get; set; }
        public int ActiveProjects { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int PendingTasks { get; set; }
        public int OverdueTasks { get; set; }
        public int PendingApprovalsCount { get; set; }
        public decimal TotalLoggedHours { get; set; }
    }
}
