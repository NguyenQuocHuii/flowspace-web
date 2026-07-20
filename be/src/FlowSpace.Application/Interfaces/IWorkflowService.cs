using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FlowSpace.Application.Common.Dtos;

namespace FlowSpace.Application.Interfaces
{
    public interface IWorkflowService
    {
        Task<IEnumerable<RequestResponse>> GetRequestsAsync(Guid? requesterId = null, string? status = null);
        Task<RequestResponse?> GetRequestByIdAsync(Guid id);
        Task<IEnumerable<RequestResponse>> GetPendingApprovalsForUserAsync(Guid userId, string userRole);
        Task<RequestResponse> CreateRequestAsync(CreateRequestInput input, Guid requesterId);
        Task<RequestResponse?> UpdateRequestAsync(Guid id, CreateRequestInput input, Guid userId);
        Task<bool> DeleteRequestAsync(Guid id, Guid userId);
        Task<RequestResponse?> ProcessApprovalAsync(Guid approvalId, ProcessApprovalInput input, Guid approverId);
    }
}
