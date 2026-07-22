using System;
using System.Threading.Tasks;
using FlowSpace.Application.Common.Dtos;
using FlowSpace.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlowSpace.Api.Controllers
{
    [Authorize]
    [Route("api/v1/dashboard")]
    public class DashboardController : BaseApiController
    {
        private readonly IDashboardService _dashboardService;
        private readonly ICurrentUserService _currentUser;

        public DashboardController(IDashboardService dashboardService, ICurrentUserService currentUser)
        {
            _dashboardService = dashboardService;
            _currentUser = currentUser;
        }

        [HttpGet("summary")]
        public async Task<ActionResult<ApiResponse<DashboardSummaryDto>>> GetSummary()
        {
            Guid? parsedUserId = null;
            if (_currentUser.IsAuthenticated && !string.IsNullOrEmpty(_currentUser.UserId))
            {
                if (Guid.TryParse(_currentUser.UserId, out var guid))
                {
                    // Nếu là Director/Admin thì xem toàn bộ hệ thống (userId = null)
                    // Ngược lại nếu là Employee/TeamLead/Manager thì bắt buộc lọc theo UserId của họ
                    if (_currentUser.Role != "director")
                    {
                        parsedUserId = guid;
                    }
                }
            }

            var summary = await _dashboardService.GetSummaryAsync(parsedUserId);
            return OkResponse(summary, "Dashboard summary retrieved successfully.");
        }

        [HttpPost("seed-data")]
        public ActionResult<ApiResponse<string>> SeedData([FromServices] FlowSpace.Persistence.Contexts.FlowSpaceDbContext context)
        {
            if (_currentUser.Role != "director")
            {
                return FailResponse<string>("Chỉ Giám đốc/Quản trị viên mới được quyền nạp dữ liệu mẫu.", Microsoft.AspNetCore.Http.StatusCodes.Status403Forbidden);
            }

            try
            {
                FlowSpace.Persistence.DbInitializer.Initialize(context);
                return OkResponse("Database seeded successfully with production-grade data!", "Seeding complete.");
            }
            catch (Exception ex)
            {
                return FailResponse<string>($"Error seeding database: {ex.Message}", Microsoft.AspNetCore.Http.StatusCodes.Status500InternalServerError);
            }
        }
    }
}
