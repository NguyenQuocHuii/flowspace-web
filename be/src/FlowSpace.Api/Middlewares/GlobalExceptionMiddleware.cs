using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using FlowSpace.Application.Common.Dtos;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace FlowSpace.Api.Middlewares
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Đã xảy ra lỗi hệ thống không kiểm soát: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var response = ApiResponse<object>.FailResult("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.");

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

            return context.Response.WriteAsync(json);
        }
    }
}
