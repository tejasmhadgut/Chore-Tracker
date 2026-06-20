using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using ChoreTrackerAPI.ServiceInterfaces;
using StackExchange.Redis;

namespace ChoreTrackerAPI.Services
{
    /// <summary>
    /// Two-level cache: L1 = IMemoryCache (in-process, ~0ms), L2 = Redis (distributed, ~2ms).
    /// Hot keys served from memory without a network hop; Redis keeps data consistent across
    /// multiple API instances and survives restarts.
    /// </summary>
    public class RedisCacheService : ICacheService
    {
        private readonly IMemoryCache _memoryCache;
        private readonly IDistributedCache _distributedCache;
        private readonly IConnectionMultiplexer _redisConnection;
        private readonly ILogger<RedisCacheService> _logger;

        private static readonly TimeSpan DefaultExpiration = TimeSpan.FromMinutes(5);
        // L1 TTL is short so cross-instance invalidations (via Redis) propagate within 30s
        private static readonly TimeSpan L1Expiration = TimeSpan.FromSeconds(30);

        public RedisCacheService(
            IMemoryCache memoryCache,
            IDistributedCache distributedCache,
            IConnectionMultiplexer redisConnection,
            ILogger<RedisCacheService> logger)
        {
            _memoryCache = memoryCache;
            _distributedCache = distributedCache;
            _redisConnection = redisConnection;
            _logger = logger;
        }

        public async Task<T?> GetAsync<T>(string key) where T : class
        {
            // L1: check in-process memory first
            if (_memoryCache.TryGetValue(key, out T? cached))
            {
                _logger.LogDebug("L1 cache hit for key: {Key}", key);
                return cached;
            }

            try
            {
                // L2: check Redis
                var cachedData = await _distributedCache.GetStringAsync(key);
                if (cachedData == null)
                {
                    _logger.LogDebug("Cache miss for key: {Key}", key);
                    return null;
                }

                var value = JsonSerializer.Deserialize<T>(cachedData);

                // Populate L1 so next request is served from memory
                if (value != null)
                    _memoryCache.Set(key, value, L1Expiration);

                _logger.LogDebug("L2 cache hit for key: {Key}", key);
                return value;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving from cache, key: {Key}", key);
                return null;
            }
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class
        {
            // Write to both levels
            _memoryCache.Set(key, value, L1Expiration);

            try
            {
                var serializedData = JsonSerializer.Serialize(value);
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = expiration ?? DefaultExpiration
                };

                await _distributedCache.SetStringAsync(key, serializedData, options);
                _logger.LogDebug("Cached data for key: {Key}, L2 expiration: {Expiration}",
                    key, expiration ?? DefaultExpiration);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting cache, key: {Key}", key);
            }
        }

        public async Task RemoveAsync(string key)
        {
            _memoryCache.Remove(key);

            try
            {
                await _distributedCache.RemoveAsync(key);
                _logger.LogDebug("Removed cache key: {Key}", key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing cache key: {Key}", key);
            }
        }

        public async Task RemoveByPatternAsync(string pattern)
        {
            try
            {
                var database = _redisConnection.GetDatabase();
                var server = _redisConnection.GetServer(_redisConnection.GetEndPoints().First());

                var keys = server.Keys(pattern: $"ChoreTracker_{pattern}").ToArray();

                if (keys.Length > 0)
                {
                    // Remove from L1 for each matched key
                    foreach (var k in keys)
                        _memoryCache.Remove(k.ToString());

                    await database.KeyDeleteAsync(keys);
                    _logger.LogDebug("Removed {Count} keys matching pattern: {Pattern}", keys.Length, pattern);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing keys by pattern: {Pattern}", pattern);
            }
        }

        public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null) where T : class
        {
            try
            {
                var cached = await GetAsync<T>(key);
                if (cached != null)
                    return cached;

                _logger.LogDebug("Cache miss for key: {Key}, executing factory", key);
                var result = await factory();
                await SetAsync(key, result, expiration);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetOrSet for key: {Key}", key);
                return await factory();
            }
        }
    }
}
