using System;
using System.Collections.Generic;
using FlowSpace.Domain.Entities;

namespace FlowSpace.Application.Services
{
    public static class GanttCycleValidator
    {
        public static bool ValidateCycle(Guid source, Guid target, List<TaskDependency> links)
        {
            return GanttService.HasCycle(source, target, links);
        }
    }
}
