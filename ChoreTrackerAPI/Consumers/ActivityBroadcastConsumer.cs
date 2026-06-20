using MassTransit;
using ChoreTrackerAPI.Messages;
using Microsoft.AspNetCore.SignalR;
using ChoreTrackerAPI.Services;
using Microsoft.Extensions.Logging;

namespace ChoreTrackerAPI.Consumers
{
    /// <summary>
    /// Consumer that handles ChoreCompletedEvent, ChoreCreatedEvent, and MemberJoinedEvent
    /// Broadcasts real-time activity updates to group members via SignalR
    /// </summary>
    public class ActivityBroadcastConsumer :
        IConsumer<ChoreCompletedEvent>,
        IConsumer<ChoreCreatedEvent>,
        IConsumer<MemberJoinedEvent>
    {
        private readonly IHubContext<ChoreHubService> _choreHub;
        private readonly ILogger<ActivityBroadcastConsumer> _logger;

        public ActivityBroadcastConsumer(
            IHubContext<ChoreHubService> choreHub,
            ILogger<ActivityBroadcastConsumer> logger)
        {
            _choreHub = choreHub;
            _logger = logger;
        }

        /// <summary>
        /// Handles ChoreCompletedEvent and broadcasts to all group members
        /// </summary>
        public async Task Consume(ConsumeContext<ChoreCompletedEvent> context)
        {
            var @event = context.Message;

            try
            {
                _logger.LogInformation(
                    "Broadcasting chore completion: {ChoreName} by {UserName} in group {GroupId}",
                    @event.ChoreName,
                    @event.UserName,
                    @event.GroupId);

                var activity = new
                {
                    type = "completion",
                    timestamp = @event.CompletedOn,
                    actor = $"{@event.UserFirstName} {@event.UserLastName}",
                    actorUsername = @event.UserName,
                    groupName = @event.GroupName,
                    groupId = @event.GroupId,
                    details = @event.ChoreName,
                    actorProfilePictureUrl = @event.UserProfilePictureUrl
                };

                // Broadcast to all connected clients in the group
                await _choreHub.Clients.Group(@event.GroupId.ToString())
                    .SendAsync("ActivityCreated", activity);

                _logger.LogInformation(
                    "Successfully broadcast chore completion to group {GroupId}",
                    @event.GroupId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to broadcast chore completion for group {GroupId}",
                    @event.GroupId);
                throw;
            }
        }

        /// <summary>
        /// Handles ChoreCreatedEvent and broadcasts to all group members
        /// </summary>
        public async Task Consume(ConsumeContext<ChoreCreatedEvent> context)
        {
            var @event = context.Message;

            try
            {
                _logger.LogInformation(
                    "Broadcasting chore creation: {ChoreName} in group {GroupId}",
                    @event.ChoreName,
                    @event.GroupId);

                var activity = new
                {
                    type = "chore_created",
                    timestamp = @event.CreatedAt,
                    actor = "",
                    actorUsername = "",
                    groupName = @event.GroupName,
                    groupId = @event.GroupId,
                    details = @event.ChoreName,
                    actorProfilePictureUrl = ""
                };

                // Broadcast to all connected clients in the group
                await _choreHub.Clients.Group(@event.GroupId.ToString())
                    .SendAsync("ActivityCreated", activity);

                _logger.LogInformation(
                    "Successfully broadcast chore creation to group {GroupId}",
                    @event.GroupId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to broadcast chore creation for group {GroupId}",
                    @event.GroupId);
                throw;
            }
        }

        /// <summary>
        /// Handles MemberJoinedEvent and broadcasts to all group members
        /// </summary>
        public async Task Consume(ConsumeContext<MemberJoinedEvent> context)
        {
            var @event = context.Message;

            try
            {
                _logger.LogInformation(
                    "Broadcasting member join: {UserName} in group {GroupId}",
                    @event.UserName,
                    @event.GroupId);

                var activity = new
                {
                    type = "member_joined",
                    timestamp = @event.JoinedAt,
                    actor = $"{@event.UserFirstName} {@event.UserLastName}",
                    actorUsername = @event.UserName,
                    groupName = @event.GroupName,
                    groupId = @event.GroupId,
                    details = "joined the group",
                    actorProfilePictureUrl = @event.UserProfilePictureUrl
                };

                // Broadcast to all connected clients in the group
                await _choreHub.Clients.Group(@event.GroupId.ToString())
                    .SendAsync("ActivityCreated", activity);

                _logger.LogInformation(
                    "Successfully broadcast member join to group {GroupId}",
                    @event.GroupId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Failed to broadcast member join for group {GroupId}",
                    @event.GroupId);
                throw;
            }
        }
    }
}
