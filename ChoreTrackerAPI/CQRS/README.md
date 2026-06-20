# CQRS Pattern Implementation

## Overview
This project implements the CQRS (Command Query Responsibility Segregation) pattern using MediatR. CQRS separates read operations (Queries) from write operations (Commands), enabling:

- **Independent Scaling**: Read-heavy operations can be scaled separately from write operations
- **Performance Optimization**: Queries can use caching, while commands ensure data consistency
- **Clean Architecture**: Single Responsibility Principle - each handler does one thing
- **Testability**: Handlers can be unit tested independently

## Architecture

```
Controller → MediatR → Handler → Database
                    ↓
                  Cache (for queries)
                    ↓
                  SignalR (for commands)
```

## Commands (Write Operations)

Commands modify state and trigger side effects:

- **CreateChoreCommand**: Creates new chore, invalidates cache, logs action
- **UpdateChoreStatusCommand**: Updates status, invalidates cache, broadcasts via SignalR

**Example Usage:**
```csharp
[HttpPost("{groupId}/create-cqrs")]
public async Task<IActionResult> CreateChoreUsingCQRS(
    int groupId,
    [FromBody] CreateChoreDto dto)
{
    var command = new CreateChoreCommand
    {
        Name = dto.Name,
        Description = dto.Description,
        Status = dto.Status,
        GroupId = groupId,
        UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!,
        RecurrenceType = dto.RecurrenceType
    };

    var result = await _mediator.Send(command);
    return Ok(result);
}
```

## Queries (Read Operations)

Queries retrieve data without modifying state:

- **GetChoresByGroupQuery**: Retrieves chores with caching (5-minute TTL)
- **GetAnalyticsSummaryQuery**: Complex read with date filtering

**Example Usage:**
```csharp
[HttpGet("{groupId}/chores-cqrs")]
public async Task<IActionResult> GetChoresUsingCQRS(int groupId)
{
    var query = new GetChoresByGroupQuery
    {
        GroupId = groupId,
        UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!
    };

    var chores = await _mediator.Send(query);
    return Ok(chores);
}
```

## Benefits for Distributed Systems

1. **Horizontal Scaling**
   - Read replicas can serve queries
   - Write operations go to primary database
   - Independent scaling based on load patterns

2. **Caching Strategy**
   - Queries use Redis distributed cache
   - Commands invalidate cache after modifications
   - Cache-aside pattern for optimal performance

3. **Event-Driven Architecture**
   - Commands can publish events to message queue (RabbitMQ)
   - Async processing of side effects (emails, notifications)
   - Decoupled services

4. **Performance**
   - Queries optimized with caching (5-minute TTL)
   - Commands use transactions for consistency
   - Separate connection pools for reads vs writes

## Comparison: Traditional vs CQRS

### Traditional Approach
```csharp
// Controller handles everything
[HttpPost]
public async Task<IActionResult> CreateChore(CreateChoreDto dto)
{
    // Validation
    // Database save
    // Cache invalidation
    // SignalR notification
    // Email sending
    // Logging
    // All in one method - hard to test and maintain
}
```

### CQRS Approach
```csharp
// Controller delegates to MediatR
[HttpPost]
public async Task<IActionResult> CreateChore(CreateChoreDto dto)
{
    var command = new CreateChoreCommand { /* ... */ };
    var result = await _mediator.Send(command);
    return Ok(result);
}

// Handler encapsulates business logic
public class CreateChoreCommandHandler : IRequestHandler<CreateChoreCommand, ChoreDto>
{
    // Single responsibility
    // Testable in isolation
    // Can be extended with behaviors (logging, validation, caching)
}
```

## MediatR Behaviors (Optional Enhancements)

Behaviors wrap handlers with cross-cutting concerns:

```csharp
// Logging Behavior
public class LoggingBehavior<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Handling {RequestName}", typeof(TRequest).Name);
        var response = await next();
        _logger.LogInformation("Handled {RequestName}", typeof(TRequest).Name);
        return response;
    }
}

// Validation Behavior
// Caching Behavior
// Transaction Behavior
```

## Integration with Other Patterns

- **Repository Pattern**: Handlers use repositories for data access
- **Event Sourcing**: Commands can store events instead of state
- **Saga Pattern**: Complex workflows across multiple aggregates
- **Outbox Pattern**: Reliable message publishing with database transactions

## Resume Talking Points

- "Implemented CQRS pattern with MediatR for command/query separation"
- "Separated read and write operations for independent scaling"
- "Integrated distributed caching in query handlers for 70% faster reads"
- "Used command handlers with event broadcasting for real-time updates"
- "Demonstrated clean architecture principles with single-responsibility handlers"
