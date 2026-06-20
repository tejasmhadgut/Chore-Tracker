using AspNetCoreRateLimit;

namespace ChoreTrackerAPI.Configuration
{
    /// <summary>
    /// Rate limiting configuration for distributed API protection
    /// Uses Redis for storing rate limit counters across multiple server instances
    /// </summary>
    public static class RateLimitConfiguration
    {
        public static IServiceCollection AddDistributedRateLimiting(this IServiceCollection services, IConfiguration configuration)
        {
            // Load configuration from appsettings
            services.AddOptions();
            services.AddMemoryCache();

            // Configure IP rate limiting
            services.Configure<IpRateLimitOptions>(options =>
            {
                // General rules - apply to all endpoints
                options.GeneralRules = new List<RateLimitRule>
                {
                    new RateLimitRule
                    {
                        Endpoint = "*",
                        Period = "1m",
                        Limit = 500  // 500 requests per minute per IP (development)
                    },
                    new RateLimitRule
                    {
                        Endpoint = "*",
                        Period = "1h",
                        Limit = 5000  // 5000 requests per hour per IP (development)
                    }
                };

                // Specific endpoint rules - stricter limits for expensive operations
                options.EndpointWhitelist = new List<string>
                {
                    "get:/health",  // Health check endpoint - no limit
                };

                // Enable real IP detection (important for load balancers)
                options.RealIpHeader = "X-Real-IP";
                options.ClientIdHeader = "X-ClientId";

                // HTTP status code returned when rate limit exceeded
                options.HttpStatusCode = 429; // Too Many Requests

                // Custom rate limit response
                options.QuotaExceededResponse = new QuotaExceededResponse
                {
                    Content = "{{ \"message\": \"Rate limit exceeded. Please try again later.\", \"retryAfter\": \"{0}\" }}",
                    ContentType = "application/json"
                };
            });

            // Configure client rate limiting (by API key/user)
            services.Configure<ClientRateLimitOptions>(options =>
            {
                options.GeneralRules = new List<RateLimitRule>
                {
                    new RateLimitRule
                    {
                        Endpoint = "POST:/api/chores/*/create",
                        Period = "1m",
                        Limit = 20  // Limit chore creation to 20 per minute
                    },
                    new RateLimitRule
                    {
                        Endpoint = "POST:/api/groups/create",
                        Period = "1h",
                        Limit = 10  // Limit group creation to 10 per hour
                    },
                    new RateLimitRule
                    {
                        Endpoint = "*/api/groups/*/analytics/*",
                        Period = "1m",
                        Limit = 30  // Analytics endpoints - 30 requests per minute
                    }
                };
            });

            // Use distributed cache (Redis) for rate limit storage
            // This allows rate limiting to work across multiple server instances
            services.AddSingleton<IIpPolicyStore, DistributedCacheIpPolicyStore>();
            services.AddSingleton<IClientPolicyStore, DistributedCacheClientPolicyStore>();
            services.AddSingleton<IRateLimitCounterStore, DistributedCacheRateLimitCounterStore>();

            // Add rate limit configuration
            services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
            services.AddSingleton<IRateLimitConfiguration, DefaultRateLimitConfiguration>();

            return services;
        }
    }

    /// <summary>
    /// Custom rate limit configuration provider
    /// </summary>
    public class DefaultRateLimitConfiguration : IRateLimitConfiguration
    {
        public IList<IpRateLimitPolicy> IpPolicies => new List<IpRateLimitPolicy>();
        public IList<ClientRateLimitPolicy> ClientPolicies => new List<ClientRateLimitPolicy>();
        public IList<RateLimitRule> GeneralRules => new List<RateLimitRule>();
        public IList<string> EndpointWhitelist => new List<string>();
        public IList<string> ClientWhitelist => new List<string>();
        public IList<IClientResolveContributor> ClientResolvers => new List<IClientResolveContributor>();
        public IList<IIpResolveContributor> IpResolvers => new List<IIpResolveContributor>();
        public ICounterKeyBuilder EndpointCounterKeyBuilder => null!;
        public Func<double> RateIncrementer => () => 1.0;

        public void RegisterResolvers()
        {
            // Default resolvers are fine
        }
    }
}
