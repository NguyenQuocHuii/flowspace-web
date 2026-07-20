using System;
using System.Threading.Tasks;
using FlowSpace.Application.Common.Dtos;

namespace FlowSpace.Application.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardSummaryDto> GetSummaryAsync(Guid? userId = null);
    }
}
