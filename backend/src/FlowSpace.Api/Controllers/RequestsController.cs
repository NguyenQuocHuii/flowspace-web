using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FlowSpace.Application.Common.Dtos;
using FlowSpace.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FlowSpace.Api.Controllers
{
    [Authorize]
    public class RequestsController : BaseApiController
    {
        private readonly IWorkflowService _workflowService;
        private readonly ICurrentUserService _currentUser;

        public RequestsController(IWorkflowService workflowService, ICurrentUserService currentUser)
        {
            _workflowService = workflowService;
            _currentUser = currentUser;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<RequestResponse>>>> GetAll(
            [FromQuery] Guid? requesterId,
            [FromQuery] string? status)
        {
            var requests = await _workflowService.GetRequestsAsync(requesterId, status);
            return OkResponse(requests, "Requests retrieved successfully.");
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ApiResponse<RequestResponse>>> GetById(Guid id)
        {
            var request = await _workflowService.GetRequestByIdAsync(id);
            if (request == null)
            {
                return FailResponse<RequestResponse>("Request not found.", StatusCodes.Status404NotFound);
            }
            return OkResponse(request, "Request retrieved successfully.");
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<RequestResponse>>> Create([FromBody] CreateRequestInput input)
        {
            var userIdStr = _currentUser.UserId;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var requesterId))
            {
                return FailResponse<RequestResponse>("Invalid user credentials.", StatusCodes.Status401Unauthorized);
            }

            var createdRequest = await _workflowService.CreateRequestAsync(input, requesterId);
            return CreatedAtAction(nameof(GetById), new { id = createdRequest.Id }, ApiResponse<RequestResponse>.SuccessResult(createdRequest, "Request created successfully with approval workflow."));
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<ApiResponse<RequestResponse>>> Update(Guid id, [FromBody] CreateRequestInput input)
        {
            var userIdStr = _currentUser.UserId;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return FailResponse<RequestResponse>("Invalid user credentials.", StatusCodes.Status401Unauthorized);
            }

            var updatedRequest = await _workflowService.UpdateRequestAsync(id, input, userId);
            if (updatedRequest == null)
            {
                return FailResponse<RequestResponse>("Request not found, not owned by current user, or not in Pending status.", StatusCodes.Status400BadRequest);
            }

            return OkResponse(updatedRequest, "Request updated successfully.");
        }

        [HttpDelete("{id:guid}")]
        public async Task<ActionResult<ApiResponse<string>>> Delete(Guid id)
        {
            var userIdStr = _currentUser.UserId;
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return FailResponse<string>("Invalid user credentials.", StatusCodes.Status401Unauthorized);
            }

            var result = await _workflowService.DeleteRequestAsync(id, userId);
            if (!result)
            {
                return FailResponse<string>("Request not found, not owned by current user, or not in Pending status.", StatusCodes.Status400BadRequest);
            }

            return OkResponse("Request deleted successfully.");
        }
    }
}
