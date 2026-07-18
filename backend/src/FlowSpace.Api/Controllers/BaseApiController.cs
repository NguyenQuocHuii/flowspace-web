using FlowSpace.Application.Common.Dtos;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace FlowSpace.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public abstract class BaseApiController : ControllerBase
    {
        private ISender? _mediator;
        protected ISender Mediator => _mediator ??= HttpContext.RequestServices.GetRequiredService<ISender>();

        protected ActionResult<ApiResponse<T>> OkResponse<T>(T data, string message = "")
        {
            return Ok(ApiResponse<T>.SuccessResult(data, message));
        }

        protected ActionResult<ApiResponse<T>> FailResponse<T>(string message, int statusCode = StatusCodes.Status400BadRequest)
        {
            return StatusCode(statusCode, ApiResponse<T>.FailResult(message));
        }
    }
}
