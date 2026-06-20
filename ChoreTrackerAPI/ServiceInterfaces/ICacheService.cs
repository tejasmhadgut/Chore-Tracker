namespace ChoreTrackerAPI.ServiceInterfaces
{
    /// <summary>
    /// Distributed cache service interface for Redis-backed caching
    /// Provides abstraction over IDistributedCache for type-safe operations
    /// </summary>
    public interface ICacheService
    {
        /// <summary>
        /// Retrieves a cached value by key
        /// </summary>
        /// <typeparam name="T">Type of the cached object</typeparam>
        /// <param name="key">Cache key</param>
        /// <returns>Cached value or null if not found/expired</returns>
        Task<T?> GetAsync<T>(string key) where T : class;

        /// <summary>
        /// Stores a value in distributed cache with optional expiration
        /// </summary>
        /// <typeparam name="T">Type of object to cache</typeparam>
        /// <param name="key">Cache key</param>
        /// <param name="value">Value to cache</param>
        /// <param name="expiration">Optional expiration time (default: 5 minutes)</param>
        Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class;

        /// <summary>
        /// Removes a specific key from cache
        /// </summary>
        /// <param name="key">Cache key to remove</param>
        Task RemoveAsync(string key);

        /// <summary>
        /// Removes all keys matching a pattern (e.g., "analytics:group:123:*")
        /// Useful for invalidating related cached data
        /// </summary>
        /// <param name="pattern">Pattern to match keys</param>
        Task RemoveByPatternAsync(string pattern);

        /// <summary>
        /// Gets or sets a cached value - retrieves if exists, otherwise executes factory and caches result
        /// </summary>
        /// <typeparam name="T">Type of cached object</typeparam>
        /// <param name="key">Cache key</param>
        /// <param name="factory">Function to execute if cache miss</param>
        /// <param name="expiration">Optional expiration time</param>
        Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null) where T : class;
    }
}
