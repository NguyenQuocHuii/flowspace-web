using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FlowSpace.Application.Common.Dtos;

namespace FlowSpace.Application.Interfaces
{
    public interface ITimeLogService
    {
        Task<IEnumerable<TimeLogDto>> GetTimeLogsAsync(Guid? userId = null, Guid? taskId = null, DateTime? fromDate = null, DateTime? toDate = null);
        Task<TimeLogDto?> CreateTimeLogAsync(CreateTimeLogRequest request, Guid userId);
        Task<TimeLogDto?> UpdateTimeLogAsync(Guid id, CreateTimeLogRequest request, Guid userId);
        Task<bool> DeleteTimeLogAsync(Guid id);
    }
}
