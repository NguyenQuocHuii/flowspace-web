using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlowSpace.Application.Common.Dtos;
using FlowSpace.Persistence.Contexts;
using FlowSpace.Domain.Entities;
using System.Security.Claims;

namespace FlowSpace.Api.Controllers
{
    [Authorize]
    [Route("api/v1/chat")]
    public class ChatController : BaseApiController
    {
        private readonly FlowSpaceDbContext _context;

        public ChatController(FlowSpaceDbContext context)
        {
            _context = context;
        }

        // Do chưa có bảng DB cho Messages/Channels thật ở backend trong domain gốc (backend/src),
        // Để tránh sửa đổi DB Domain mà chưa hỏi ý kiến (Ràng buộc: Điều kiện dừng),
        // và do ChatHub hiện tại chỉ làm nhiệm vụ Broadcast real-time:
        // Client sẽ hoạt động theo mô hình Hybrid:
        // - Lấy danh sách channels/tin nhắn mẫu/cũ từ LocalStorage (để lưu vết/offline).
        // - Đồng thời khi online, toàn bộ tin nhắn chat sẽ được Broadcast qua SignalR đến tất cả các tab đang mở của mọi user
        //   để cập nhật real-time ngay lập tức trên màn hình của họ mà không cần F5.
        // Dưới đây chúng tôi trả về danh sách Users để client có thể map DM, và endpoint channels tượng trưng.

        [HttpGet("users")]
        public async Task<ActionResult<ApiResponse<object>>> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new { u.Id, u.Name, u.Email, u.Avatar, u.Color, u.Role })
                .ToListAsync();
            return OkResponse<object>(users, "Users retrieved successfully.");
        }
    }
}
