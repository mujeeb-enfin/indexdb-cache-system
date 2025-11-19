# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-19

### Added
- Initial release of IndexedDB Cache System
- Automatic caching for GET requests with configurable TTL
- Smart cache invalidation for POST, PUT, DELETE requests
- Request deduplication to prevent duplicate API calls
- Custom cache key generation based on URL, headers, and otherKeys
- Automatic expiry and cleanup of expired cache entries
- LRU eviction when cache size limit is reached
- Built-in cache statistics (hits, misses, hit rate, invalidations)
- Comprehensive error handling with retry logic
- Background cleanup timer for periodic maintenance
- Support for custom TTL per request
- Bypass cache option for fresh data
- Manual cache invalidation methods
- Interactive demo with real-time statistics
- Complete usage examples for common scenarios
- React integration examples
- E-commerce API wrapper example
- Comprehensive documentation

### Features
- `CachedApiClient` - Main API client with caching
- `IndexedDBCache` - Low-level cache implementation
- `ApiCall()` - Universal API call method with automatic caching
- `invalidateCache()` - Manual cache invalidation
- `getStats()` - Get cache performance statistics
- `clearCache()` - Clear all cache entries
- `close()` - Close database and cleanup

### Documentation
- Complete README with API reference
- 19 usage examples covering common scenarios
- Interactive HTML demo
- JSDoc comments for all public methods
- Best practices guide
- Performance considerations
- Security guidelines

[1.0.0]: https://github.com/mujeeb-enfin/indexdb-cache-system/releases/tag/v1.0.0
