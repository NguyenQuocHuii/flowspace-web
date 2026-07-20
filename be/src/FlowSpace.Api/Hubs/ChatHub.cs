using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FlowSpace.Api.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        public async Task SendMessage(string channelId, string user, string message)
        {
            await Clients.Group(channelId).SendAsync("ReceiveMessage", channelId, user, message, DateTime.UtcNow);
        }

        public async Task JoinChannel(string channelId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, channelId);
        }

        public async Task LeaveChannel(string channelId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, channelId);
        }

        public async Task RecallMessage(string channelId, string messageId)
        {
            await Clients.Group(channelId).SendAsync("MessageRecalled", channelId, messageId);
        }

        public async Task PinMessage(string channelId, string messageId, bool isPinned)
        {
            await Clients.Group(channelId).SendAsync("MessagePinned", channelId, messageId, isPinned);
        }
    }
}
