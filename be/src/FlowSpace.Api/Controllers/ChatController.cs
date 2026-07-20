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

        [HttpGet("users")]
        public async Task<ActionResult<ApiResponse<object>>> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new { u.Id, u.Name, u.Email, u.Avatar, u.Color, u.Role })
                .ToListAsync();
            return OkResponse<object>(users, "Users retrieved successfully.");
        }

        // 1. GET /api/v1/chat/channels
        [HttpGet("channels")]
        public async Task<ActionResult<ApiResponse<IEnumerable<ChatChannel>>>> GetChannels()
        {
            var channels = await _context.ChatChannels
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();
            return OkResponse<IEnumerable<ChatChannel>>(channels, "Channels retrieved successfully.");
        }

        // 2. POST /api/v1/chat/channels
        [HttpPost("channels")]
        public async Task<ActionResult<ApiResponse<ChatChannel>>> CreateChannel([FromBody] CreateChannelRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return FailResponse<ChatChannel>("Channel name is required.", StatusCodes.Status400BadRequest);
            }

            var channel = new ChatChannel
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                IsDirectMessage = request.IsDirectMessage,
                CreatedAt = DateTime.UtcNow
            };

            await _context.ChatChannels.AddAsync(channel);
            await _context.SaveChangesAsync();

            return OkResponse(channel, "Channel created successfully.");
        }

        // 3. GET /api/v1/chat/channels/{channelId}/messages
        [HttpGet("channels/{channelId:guid}/messages")]
        public async Task<ActionResult<ApiResponse<IEnumerable<object>>>> GetMessages(Guid channelId)
        {
            var messages = await _context.ChatMessages
                .Include(m => m.Sender)
                .Where(m => m.ChannelId == channelId)
                .OrderBy(m => m.CreatedAt)
                .Select(m => new
                {
                    id = m.Id,
                    channelId = m.ChannelId,
                    senderId = m.SenderId,
                    senderName = m.Sender != null ? m.Sender.Name : "System",
                    senderAvatar = m.Sender != null ? m.Sender.Avatar : "S",
                    senderColor = m.Sender != null ? m.Sender.Color : "av-indigo",
                    content = m.Content,
                    isPinned = m.IsPinned,
                    isRecalled = m.IsRecalled,
                    replyToMessageId = m.ReplyToMessageId,
                    createdAt = m.CreatedAt
                })
                .ToListAsync();

            return OkResponse<IEnumerable<object>>(messages, "Messages retrieved successfully.");
        }

        // 4. POST /api/v1/chat/messages
        [HttpPost("messages")]
        public async Task<ActionResult<ApiResponse<object>>> SendMessage([FromBody] SendMessageRequest request)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var senderId))
            {
                return FailResponse<object>("Invalid user credentials.", StatusCodes.Status401Unauthorized);
            }

            if (string.IsNullOrWhiteSpace(request.Content))
            {
                return FailResponse<object>("Message content is required.", StatusCodes.Status400BadRequest);
            }

            var message = new ChatMessage
            {
                Id = Guid.NewGuid(),
                ChannelId = request.ChannelId,
                SenderId = senderId,
                Content = request.Content,
                ReplyToMessageId = request.ReplyToMessageId,
                IsPinned = false,
                IsRecalled = false,
                CreatedAt = DateTime.UtcNow
            };

            await _context.ChatMessages.AddAsync(message);
            await _context.SaveChangesAsync();

            var sender = await _context.Users.FindAsync(senderId);

            var result = new
            {
                id = message.Id,
                channelId = message.ChannelId,
                senderId = message.SenderId,
                senderName = sender?.Name ?? "User",
                senderAvatar = sender?.Avatar ?? "U",
                senderColor = sender?.Color ?? "av-indigo",
                content = message.Content,
                isPinned = message.IsPinned,
                isRecalled = message.IsRecalled,
                replyToMessageId = message.ReplyToMessageId,
                createdAt = message.CreatedAt
            };

            return OkResponse<object>(result, "Message sent successfully.");
        }

        // 5. PUT /api/v1/chat/messages/{id}
        [HttpPut("messages/{id:guid}")]
        public async Task<ActionResult<ApiResponse<object>>> EditMessage(Guid id, [FromBody] EditMessageRequest request)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var senderId))
            {
                return FailResponse<object>("Invalid user credentials.", StatusCodes.Status401Unauthorized);
            }

            var message = await _context.ChatMessages.FirstOrDefaultAsync(m => m.Id == id);
            if (message == null)
            {
                return FailResponse<object>("Message not found.", StatusCodes.Status404NotFound);
            }

            if (message.SenderId != senderId)
            {
                return FailResponse<object>("You can only edit your own messages.", StatusCodes.Status403Forbidden);
            }

            if (string.IsNullOrWhiteSpace(request.Content))
            {
                return FailResponse<object>("Message content is required.", StatusCodes.Status400BadRequest);
            }

            message.Content = request.Content;
            _context.ChatMessages.Update(message);
            await _context.SaveChangesAsync();

            var sender = await _context.Users.FindAsync(senderId);

            var result = new
            {
                id = message.Id,
                channelId = message.ChannelId,
                senderId = message.SenderId,
                senderName = sender?.Name ?? "User",
                senderAvatar = sender?.Avatar ?? "U",
                senderColor = sender?.Color ?? "av-indigo",
                content = message.Content,
                isPinned = message.IsPinned,
                isRecalled = message.IsRecalled,
                replyToMessageId = message.ReplyToMessageId,
                createdAt = message.CreatedAt
            };

            return OkResponse<object>(result, "Message edited successfully.");
        }

        // 6. DELETE /api/v1/chat/messages/{id}
        [HttpDelete("messages/{id:guid}")]
        public async Task<ActionResult<ApiResponse<string>>> RecallMessage(Guid id)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var senderId))
            {
                return FailResponse<string>("Invalid user credentials.", StatusCodes.Status401Unauthorized);
            }

            var message = await _context.ChatMessages.FirstOrDefaultAsync(m => m.Id == id);
            if (message == null)
            {
                return FailResponse<string>("Message not found.", StatusCodes.Status404NotFound);
            }

            if (message.SenderId != senderId)
            {
                return FailResponse<string>("You can only recall your own messages.", StatusCodes.Status403Forbidden);
            }

            message.IsRecalled = true;
            message.Content = "Tin nhắn này đã bị thu hồi.";
            _context.ChatMessages.Update(message);
            await _context.SaveChangesAsync();

            return OkResponse("Message recalled successfully.");
        }
    }

    public class CreateChannelRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsDirectMessage { get; set; } = false;
    }

    public class SendMessageRequest
    {
        public Guid ChannelId { get; set; }
        public string Content { get; set; } = string.Empty;
        public Guid? ReplyToMessageId { get; set; }
    }

    public class EditMessageRequest
    {
        public string Content { get; set; } = string.Empty;
    }
}
