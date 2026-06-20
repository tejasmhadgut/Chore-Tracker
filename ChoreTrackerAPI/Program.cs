using System.Text;
using ChoreTrackerAPI.Data;
using ChoreTrackerAPI.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ChoreTrackerAPI.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Options;
using ChoreTrackerAPI.ServiceInterfaces;
using ChoreTrackerAPI.Configuration;
using Amazon.S3;
using StackExchange.Redis;
using AspNetCoreRateLimit;
using MassTransit;
using ChoreTrackerAPI.Consumers;
using Hangfire;
using Hangfire.Redis;
using Hangfire.Redis.StackExchange;
using ChoreTrackerAPI.BackgroundJobs;

var builder = WebApplication.CreateBuilder(args);

// Get Redis connection string from appsettings.json
var redisConnectionString = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
if (!redisConnectionString.Contains("abortConnect"))
{
    redisConnectionString += ",abortConnect=false";
}
Console.WriteLine($"Redis connection: {redisConnectionString}");

// Add services to the container
builder.Services.AddOpenApi();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
    }
});

// Read replica — routes SELECT queries to the streaming replica, leaving the primary free for writes
var replicaConnStr = builder.Configuration.GetConnectionString("ReadonlyConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection"); // fallback to primary if replica not configured
builder.Services.AddDbContext<ReadOnlyDbContext>(options =>
{
    options.UseNpgsql(replicaConnStr)
           .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
});

builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options => {
        options.MapInboundClaims = true;
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if(context.Request.Cookies.ContainsKey("authToken"))
                {
                    context.Token = context.Request.Cookies["authToken"];
                }
                return Task.CompletedTask;
            }
        };
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"]))
        };
    })
    .AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options => {
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.None;
        options.Cookie.SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Strict;
        options.Cookie.Name = "authToken";
    })
    .AddGoogle(googleOptions =>
    {
        googleOptions.ClientId = builder.Configuration["Authentication:Google:ClientId"];
        googleOptions.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
        googleOptions.CallbackPath = "/signin-google";
    });
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;   // ✅ Makes token inaccessible to JavaScript
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;  // ✅ Only send over HTTPS
    options.Cookie.SameSite = SameSiteMode.Strict;  // ✅ Prevent CSRF attacks
    options.LoginPath = "/api/account/login";
    options.LogoutPath = "/api/account/logout";
    options.AccessDeniedPath = "/api/account/access-denied";
    // Prevent redirect to login for API endpoints - return 401 instead
    options.Events.OnRedirectToLogin = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = 401;
            return Task.CompletedTask;
        }
        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = 403;
            return Task.CompletedTask;
        }
        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };
});
// Redis Distributed Cache Configuration
builder.Services.AddStackExchangeRedisCache(options => {
    options.Configuration = redisConnectionString;
    options.InstanceName = "ChoreTracker_";
});

// Redis Connection Multiplexer for advanced operations (pattern deletion, pub/sub)
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var configuration = redisConnectionString;
    return ConnectionMultiplexer.Connect(configuration);
});
builder.Services.AddControllers().AddNewtonsoftJson(options =>
{
    options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
});
builder.Services.Configure<HostOptions>(options =>
{
    options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore;
});

builder.Services.AddEndpointsApiExplorer();

// SignalR with Redis backplane for horizontal scaling
// Allows multiple server instances to share SignalR connection state
builder.Services.AddSignalR()
    .AddStackExchangeRedis(options =>
    {
        var redisEndpoint = redisConnectionString.Split(",")[0]; options.Configuration.EndPoints.Add(redisEndpoint);
        options.Configuration.AbortOnConnectFail = false; // Don't crash if Redis is temporarily unavailable
    });
builder.Services.AddDefaultAWSOptions(builder.Configuration.GetAWSOptions());
builder.Services.AddAWSService<IAmazonS3>();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter token",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] { }
        }
    });
});

builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IChoreService, ChoreService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<ICacheService, RedisCacheService>();
builder.Services.AddScoped<DatabaseInitializationService>();
builder.Services.AddScoped<CachedUserLookupService>();
builder.Services.AddScoped<IGroupMembershipService, GroupMembershipService>();

// Hangfire configuration for background job processing
// Uses Redis for job storage and processing
// Dashboard available at /hangfire (requires authentication)
builder.Services.AddHangfire(config =>
{
    config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
          .UseSimpleAssemblyNameTypeSerializer()
          .UseRecommendedSerializerSettings()
          .UseRedisStorage(redisConnectionString, new RedisStorageOptions
          {
              Prefix = "hangfire:",
              ExpiryCheckInterval = TimeSpan.FromHours(1)
          });
});

// Read environment variable to determine if this instance runs background jobs
var runBackgroundJobs = builder.Configuration.GetValue<bool>("RUN_BACKGROUND_JOBS", false);
Console.WriteLine($"RUN_BACKGROUND_JOBS: {runBackgroundJobs}");

// Conditionally add Hangfire server only if RUN_BACKGROUND_JOBS=true
if (runBackgroundJobs)
{
    builder.Services.AddHangfireServer(options =>
    {
        options.WorkerCount = Environment.ProcessorCount;
        options.ServerName = $"ChoreTrack-{Environment.MachineName}-JOBS";
    });
    Console.WriteLine($"✅ Hangfire Server ENABLED on {Environment.MachineName}");
}
else
{
    Console.WriteLine($"⏸️  Hangfire Server DISABLED on {Environment.MachineName} (client mode only)");
}

// Register background job classes
builder.Services.AddScoped<EmailJobs>();
builder.Services.AddScoped<CacheJobs>();
builder.Services.AddScoped<AnalyticsJobs>();
builder.Services.AddScoped<CleanupJobs>();
builder.Services.AddScoped<ChoreJobs>();
builder.Services.AddScoped<NotificationJobs>();

// CQRS Pattern with MediatR - separates commands (writes) from queries (reads)
// Enables independent scaling of read and write operations
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

// MassTransit with RabbitMQ for distributed message processing
// Enables async activity broadcasts, cache invalidation, and analytics pre-calculation
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<SendInviteEmailConsumer>();
    x.AddConsumer<InvalidateCacheConsumer>();
    x.AddConsumer<PreCalculateAnalyticsConsumer>();
    x.AddConsumer<ActivityBroadcastConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitmqHost = builder.Configuration.GetConnectionString("RabbitMQ") ?? "rabbitmq";
        cfg.Host(rabbitmqHost, h =>
        {
            h.Username(builder.Configuration["RabbitMQ:Username"] ?? "guest");
            h.Password(builder.Configuration["RabbitMQ:Password"] ?? "guest");
        });

        cfg.UseMessageRetry(r => r.Exponential(3, TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(1)));

        cfg.ConfigureEndpoints(context);
    });
});

// Distributed Rate Limiting with Redis backend
builder.Services.AddDistributedRateLimiting(builder.Configuration);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:5173" };

        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Allow cookies and credentials
    });
});

var app = builder.Build();

// Apply CORS policy before authentication
app.UseRouting();
app.UseCors("AllowSpecificOrigins");

// Cache control middleware - set appropriate cache headers for CloudFront/CDN
app.Use(async (context, next) =>
{
    var request = context.Request;
    var response = context.Response;

    // Frontend assets from CloudFront (immutable - content hashed, can cache forever)
    if (request.Path.StartsWithSegments("/assets"))
    {
        response.Headers.CacheControl = "public, max-age=31536000, immutable";
    }
    // HTML files (check for updates frequently so users get new asset hashes)
    else if (request.Path.Value?.EndsWith(".html") == true)
    {
        response.Headers.CacheControl = "public, max-age=300, must-revalidate";
    }
    // API endpoints - don't cache (user-specific, real-time data)
    else if (request.Path.StartsWithSegments("/api"))
    {
        response.Headers.CacheControl = "private, no-cache, no-store, must-revalidate";
    }

    await next.Invoke();
});

// Rate limiting middleware - applies distributed rate limits
app.UseIpRateLimiting();
app.UseClientRateLimiting();

app.UseAuthentication();

app.UseAuthorization();

// Hangfire Dashboard - accessible at /hangfire (requires authentication)
// Shows job execution history, scheduled jobs, and failed jobs
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new HangfireAuthorizationFilter() },
    DarkModeEnabled = true,
    DisplayStorageConnectionString = false
});

// Configure recurring Hangfire jobs (ONLY if background jobs are enabled)
if (runBackgroundJobs)
{
    // New recurring job for chore updates (migrated from RecurrenceBackgroundService)
    RecurringJob.AddOrUpdate<ChoreJobs>(
        "update-recurring-chores",
        job => job.UpdateRecurringChoresJob(),
        "*/5 * * * *"); // Every 5 minutes

    RecurringJob.AddOrUpdate<AnalyticsJobs>(
        "daily-analytics-precalculation",
        job => job.PreCalculateAllGroupsAnalyticsJob(),
        "0 2 * * *"); // Daily at 2 AM UTC

    RecurringJob.AddOrUpdate<CleanupJobs>(
        "weekly-cleanup-old-completions",
        job => job.CleanupOldChoreCompletionsJob(),
        "0 3 * * 0"); // Weekly on Sunday at 3 AM UTC

    RecurringJob.AddOrUpdate<CleanupJobs>(
        "daily-cleanup-analytics",
        job => job.CleanupOldAnalyticsCacheJob(),
        "0 1 * * *"); // Daily at 1 AM UTC

    RecurringJob.AddOrUpdate<CleanupJobs>(
        "hourly-system-heartbeat",
        job => job.SystemMaintenanceHeartbeatJob(),
        "0 * * * *"); // Every hour

    RecurringJob.AddOrUpdate<NotificationJobs>(
        "send-chore-reminders",
        job => job.SendChoreRemindersJob(),
        "0 * * * *"); // Every hour

    RecurringJob.AddOrUpdate<NotificationJobs>(
        "send-overdue-chore-alerts",
        job => job.SendOverdueChoreRemindersJob(),
        "0 9 * * *"); // Daily at 9 AM UTC

    app.Logger.LogInformation("✅ Registered 7 recurring Hangfire jobs");
}
else
{
    app.Logger.LogInformation("⏸️  Skipped recurring job registration (RUN_BACKGROUND_JOBS=false)");
}

app.MapHub<ChoreHubService>("/choreHub");
app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// Swagger for development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "API V1");
        options.RoutePrefix = string.Empty;
    });
}

// Initialize database with migrations and seed data
// Uses Redis-based locking to prevent concurrent migrations in distributed setup
using (var scope = app.Services.CreateScope())
{
    var initService = scope.ServiceProvider.GetRequiredService<DatabaseInitializationService>();
    await initService.InitializeAsync();
}

app.Run();
