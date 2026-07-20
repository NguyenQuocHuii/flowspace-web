using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowSpace.Application.Common.Dtos;
using FlowSpace.Persistence.Contexts;
using FlowSpace.Domain.Entities;

namespace FlowSpace.Api.Controllers
{
    [Authorize]
    [Route("api/v1/workflowrules")]
    public class WorkflowRulesController : BaseApiController
    {
        private readonly FlowSpaceDbContext _context;

        public WorkflowRulesController(FlowSpaceDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<WorkflowRule>>>> GetAll()
        {
            var rules = await _context.WorkflowRules.ToListAsync();
            return OkResponse<IEnumerable<WorkflowRule>>(rules, "Workflow rules retrieved successfully.");
        }

        [Authorize(Policy = "ManagerOrAbove")]
        [HttpPost]
        public async Task<ActionResult<ApiResponse<WorkflowRule>>> Create([FromBody] WorkflowRule rule)
        {
            if (rule == null)
            {
                return FailResponse<WorkflowRule>("Invalid rule payload.", StatusCodes.Status400BadRequest);
            }

            rule.Id = Guid.NewGuid();
            await _context.WorkflowRules.AddAsync(rule);
            await _context.SaveChangesAsync();

            return OkResponse(rule, "Workflow rule created successfully.");
        }

        [Authorize(Policy = "ManagerOrAbove")]
        [HttpPut("{id:guid}")]
        public async Task<ActionResult<ApiResponse<WorkflowRule>>> Update(Guid id, [FromBody] WorkflowRule payload)
        {
            var rule = await _context.WorkflowRules.FindAsync(id);
            if (rule == null)
            {
                return FailResponse<WorkflowRule>("Workflow rule not found.", StatusCodes.Status404NotFound);
            }

            rule.RequestType = payload.RequestType;
            rule.Name = payload.Name;
            rule.MinAmount = payload.MinAmount;
            rule.MaxAmount = payload.MaxAmount;
            rule.SequenceSteps = payload.SequenceSteps;
            rule.IsActive = payload.IsActive;

            _context.WorkflowRules.Update(rule);
            await _context.SaveChangesAsync();

            return OkResponse(rule, "Workflow rule updated successfully.");
        }

        [Authorize(Policy = "ManagerOrAbove")]
        [HttpDelete("{id:guid}")]
        public async Task<ActionResult<ApiResponse<string>>> Delete(Guid id)
        {
            var rule = await _context.WorkflowRules.FindAsync(id);
            if (rule == null)
            {
                return FailResponse<string>("Workflow rule not found.", StatusCodes.Status404NotFound);
            }

            _context.WorkflowRules.Remove(rule);
            await _context.SaveChangesAsync();

            return OkResponse("Workflow rule deleted successfully.");
        }
    }
}
