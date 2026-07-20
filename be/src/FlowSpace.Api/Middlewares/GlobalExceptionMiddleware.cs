using System;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using FlowSpace.Application.Common.Dtos;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FlowSpace.Api.Middlewares
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger, IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                var requestPath = context.Request.Path;
                var requestMethod = context.Request.Method;
                var queryString = context.Request.QueryString.ToString();

                _logger.LogError(ex, "Đã xảy ra lỗi hệ thống không kiểm soát tại {Method} {Path} {QueryString}. Chi tiết lỗi: {Message}", 
                    requestMethod, requestPath, queryString, ex.Message);

                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            string errorMessage = "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";
            object? errorDetails = null;

            if (_env.IsDevelopment())
            {
                errorMessage = exception.Message;
                errorDetails = new
                {
                    exceptionType = exception.GetType().Name,
                    stackTrace = exception.StackTrace
                };
            }

            var response = new ApiResponse<object>
            {
                Success = false,
                Message = errorMessage,
                Data = errorDetails
            };

            // Custom error checks (e.g. FluentValidation, KeyNotFoundException, etc.)
            if (exception is FluentValidation.ValidationException valEx)
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                var errors = valEx.Errors.Select(e => new { e.PropertyName, e.ErrorMessage });
                response = new ApiResponse<object>
                {
                    Success = false,
                    Message = "Validation failed",
                    Data = errors
                };
            }
            else if (exception is UnauthorizedAccessException)
            {
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                response = ApiResponse<object>.FailResult("Bạn không có quyền truy cập vào tài nguyên này.");
            }

            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var json = JsonSerializer.Serialize(response, options);

            await context.Response.WriteAsync(json);
        }
    }
}
