using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChoreTrackerAPI.Models;
using Microsoft.AspNetCore.SignalR;

namespace ChoreTrackerAPI.Services
{
    public class ChoreHubService: Hub
    {
        public async Task JoinGroup(string groupId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupId);
        }
        public async Task LeaveGroup(string groupId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId);
        }
        public async Task NotifyChoreCreated(int groupId, Chore chore)
        {
            await Clients.Group($"Group-{groupId}").SendAsync("ChoreCreated", chore);
        }

        public async Task NotifyChoreDeleted(int groupId, int choreId)
        {
            await Clients.Group($"Group-{groupId}").SendAsync("ChoreDeleted", choreId);
        }
        public async Task NotifyChoreUpdate(int groupId, int choreId)
        {
            await Clients.Group($"Group-{groupId}").SendAsync("ChoreUpdated", choreId);
        }

        public async Task SendNotificationToUser(string userId, object notification)
        {
            await Clients.User(userId).SendAsync("ReceiveNotification", notification);
        }

        public async Task UpdateUnreadCount(string userId, int count)
        {
            await Clients.User(userId).SendAsync("UpdateUnreadCount", count);
        }
    }
}