# Enterprise-Grade IndexedDB API Caching System

A robust, production-ready IndexedDB caching solution for API requests with automatic expiry, smart cache invalidation, request deduplication, and comprehensive monitoring capabilities.

## 🌟 Features

- **Automatic Caching**: GET requests are automatically cached with configurable TTL
- **Smart Invalidation**: Non-GET requests (POST, PUT, DELETE) automatically invalidate related cache entries
- **Request Deduplication**: Multiple simultaneous requests to the same endpoint are deduplicated
- **Automatic Expiry**: Cached entries automatically expire after TTL and are cleaned up
- **Custom Cache Keys**: Support for complex cache keys based on URL, headers, and custom parameters
- **Cache Statistics**: Built-in monitoring with hit rate, miss rate, and invalidation tracking
- **Error Handling**: Comprehensive error handling with retry logic
- **Memory Management**: Automatic eviction of old entries when cache size limit is reached
- **Background Cleanup**: Periodic cleanup of expired entries
- **TypeScript-Ready**: Fully documented with JSDoc comments

## 📦 Installation

Simply include the script in your project:

```html
<script src="indexdb-cache-system.js"></script>
```

Or import as a module:

```javascript
import { CachedApiClient, IndexedDBCache } from './indexdb-cache-system.js';
```

## 🚀 Quick Start

### Basic Usage

```javascript
// Initialize the API client
const apiClient = new CachedApiClient({
  dbName: 'MyAppCache',
  defaultTTL: 5 * 60 * 1000,  // 5 minutes
  maxEntries: 1000,
  cleanupInterval: 60 * 1000   // 1 minute
});

// Make a GET request (automatically cached)
const users = await apiClient.ApiCall('https://api.example.com/users');

// Second call returns from cache instantly
const cachedUsers = await apiClient.ApiCall('https://api.example.com/users');

// POST request (automatically invalidates related cache)
await apiClient.ApiCall('https://api.example.com/users', {
  method: 'POST',
  body: { name: 'John Doe', email: 'john@example.com' }
});

// Next GET fetches fresh data
const freshUsers = await apiClient.ApiCall('https://api.example.com/users');
```

## 🔧 Configuration Options

```javascript
const apiClient = new CachedApiClient({
  dbName: 'ApiCacheDB',           // IndexedDB database name
  storeName: 'apiCache',          // Object store name
  version: 1,                     // Database version
  defaultTTL: 5 * 60 * 1000,     // Default cache TTL (5 minutes)
  maxEntries: 1000,               // Maximum cache entries
  cleanupInterval: 60 * 1000      // Cleanup interval (1 minute)
});
```

## 📚 API Reference

### ApiCall(url, options)

Main method to make API calls with automatic caching.

**Parameters:**
- `url` (string): The API endpoint URL
- `options` (object): Request options
  - `method` (string): HTTP method (GET, POST, PUT, DELETE, etc.) - Default: 'GET'
  - `headers` (object): Request headers
  - `body` (any): Request body
  - `otherKeys` (object): Additional keys for cache identification
  - `ttl` (number): Custom cache TTL in milliseconds
  - `bypassCache` (boolean): Skip cache and fetch fresh data

**Returns:** Promise<any> - API response data

**Examples:**

```javascript
// Simple GET
const data = await apiClient.ApiCall('https://api.example.com/users');

// GET with headers
const data = await apiClient.ApiCall('https://api.example.com/protected', {
  headers: {
    'Authorization': 'Bearer token123'
  }
});

// GET with custom cache keys
const data = await apiClient.ApiCall('https://api.example.com/data', {
  otherKeys: {
    userId: 'user123',
    filters: { status: 'active' }
  }
});

// GET with custom TTL
const data = await apiClient.ApiCall('https://api.example.com/data', {
  ttl: 10 * 60 * 1000  // 10 minutes
});

// Bypass cache for fresh data
const freshData = await apiClient.ApiCall('https://api.example.com/users', {
  bypassCache: true
});

// POST request
const newUser = await apiClient.ApiCall('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: {
    name: 'John Doe',
    email: 'john@example.com'
  }
});

// PUT request with specific invalidation
const updated = await apiClient.ApiCall('https://api.example.com/users/123', {
  method: 'PUT',
  body: { name: 'Jane Doe' },
  otherKeys: { userId: 123 }
});

// DELETE request
await apiClient.ApiCall('https://api.example.com/users/123', {
  method: 'DELETE',
  otherKeys: { userId: 123 }
});
```

### invalidateCache(url, otherKeys)

Manually invalidate cache entries for a specific URL.

```javascript
// Invalidate all cache for a URL
await apiClient.invalidateCache('https://api.example.com/users');

// Invalidate specific cache entries
await apiClient.invalidateCache('https://api.example.com/dashboard', {
  userId: 'user123'
});
```

### getStats()

Get cache statistics.

```javascript
const stats = apiClient.getStats();
console.log(stats);
// {
//   hits: 150,
//   misses: 50,
//   invalidations: 10,
//   errors: 2,
//   hitRate: '75.00%'
// }
```

### clearCache()

Clear all cached entries.

```javascript
await apiClient.clearCache();
```

### close()

Close the database connection and stop cleanup timer.

```javascript
apiClient.close();
```

## 🎯 Use Cases

### 1. E-commerce Application

```javascript
class EcommerceAPI {
  constructor() {
    this.client = new CachedApiClient({
      defaultTTL: 5 * 60 * 1000
    });
  }
  
  async getProducts(filters = {}) {
    return this.client.ApiCall('https://api.shop.com/products', {
      otherKeys: { filters }
    });
  }
  
  async getProductDetails(productId) {
    return this.client.ApiCall(`https://api.shop.com/products/${productId}`, {
      ttl: 15 * 60 * 1000,  // Cache longer for product details
      otherKeys: { productId }
    });
  }
  
  async addToCart(productId, quantity) {
    return this.client.ApiCall('https://api.shop.com/cart', {
      method: 'POST',
      body: { productId, quantity }
    });
  }
  
  async getCart() {
    return this.client.ApiCall('https://api.shop.com/cart', {
      ttl: 30 * 1000  // Short cache for cart
    });
  }
}
```

### 2. Pagination

```javascript
async function fetchAllPages() {
  const results = [];
  
  for (let page = 1; page <= 5; page++) {
    const data = await apiClient.ApiCall('https://api.example.com/items', {
      otherKeys: { page, limit: 20 }
    });
    results.push(...data);
  }
  
  return results;
}
```

### 3. Search with Filters

```javascript
async function searchProducts(query, filters) {
  return apiClient.ApiCall('https://api.example.com/search', {
    otherKeys: {
      query,
      filters: {
        category: filters.category,
        priceRange: filters.priceRange,
        sortBy: filters.sortBy
      }
    }
  });
}
```

### 4. User-Specific Data

```javascript
async function getUserDashboard(userId) {
  return apiClient.ApiCall('https://api.example.com/dashboard', {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    otherKeys: { userId }
  });
}
```

### 5. React Integration

```javascript
function useApiData(url, options = {}) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  React.useEffect(() => {
    let mounted = true;
    
    async function fetchData() {
      try {
        setLoading(true);
        const result = await apiClient.ApiCall(url, options);
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    fetchData();
    return () => { mounted = false; };
  }, [url, JSON.stringify(options)]);
  
  return { data, loading, error };
}

// Usage
function UsersList() {
  const { data, loading, error } = useApiData('https://api.example.com/users');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <ul>
      {data.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

## 💡 Best Practices

### 1. Choose Appropriate TTL

```javascript
// Static data (product info): 15-30 minutes
const product = await apiClient.ApiCall(url, { ttl: 20 * 60 * 1000 });

// Semi-static data (user preferences): 5-10 minutes
const prefs = await apiClient.ApiCall(url, { ttl: 5 * 60 * 1000 });

// Dynamic data (cart, notifications): 30-60 seconds
const cart = await apiClient.ApiCall(url, { ttl: 30 * 1000 });

// Real-time data: Don't cache
const inventory = await apiClient.ApiCall(url, { bypassCache: true });
```

### 2. Use otherKeys for Proper Segmentation

```javascript
// User-specific data
await apiClient.ApiCall(url, {
  otherKeys: { userId: currentUser.id }
});

// Filtered/paginated data
await apiClient.ApiCall(url, {
  otherKeys: { 
    page: 1,
    limit: 20,
    filters: { status: 'active' }
  }
});

// Multi-tenant applications
await apiClient.ApiCall(url, {
  otherKeys: { tenantId: currentTenant.id }
});
```

### 3. Handle Cache Invalidation

```javascript
// Always invalidate related caches on mutations
await apiClient.ApiCall(url, {
  method: 'POST',
  body: newData,
  otherKeys: { userId }  // Invalidates cache for this user
});

// Manual invalidation for complex scenarios
await apiClient.invalidateCache('https://api.example.com/users');
await apiClient.invalidateCache('https://api.example.com/products', {
  category: 'electronics'
});
```

### 4. Monitor Performance

```javascript
// Check cache performance regularly
setInterval(() => {
  const stats = apiClient.getStats();
  console.log('Cache Hit Rate:', stats.hitRate);
  
  if (parseFloat(stats.hitRate) < 50) {
    console.warn('Low cache hit rate! Consider adjusting TTL');
  }
}, 60000);
```

### 5. Cleanup on Application Close

```javascript
window.addEventListener('beforeunload', () => {
  apiClient.close();
});
```

## 🔍 How It Works

### Cache Key Generation

The system generates cache keys based on:
1. URL (normalized to lowercase)
2. Headers (normalized and sorted)
3. Other custom keys (sorted)

This ensures consistent cache keys for identical requests.

### Automatic Invalidation

When a non-GET request (POST, PUT, DELETE) is made:
1. The system finds all cache entries matching the URL
2. If `otherKeys` are provided, only matching entries are invalidated
3. The request proceeds after invalidation

### Request Deduplication

If multiple requests to the same endpoint are made simultaneously:
1. Only one actual API call is made
2. Other requests wait for the same Promise
3. All requests receive the same result

### Automatic Expiry

1. Each cache entry has an `expiresAt` timestamp
2. When retrieving from cache, expired entries are detected and deleted
3. Background cleanup runs periodically to remove expired entries
4. LRU eviction occurs when cache size exceeds `maxEntries`

## 🐛 Debugging

Enable detailed logging:

```javascript
// Monitor cache hits/misses
console.log('[Cache HIT]', url);  // Automatically logged
console.log('[Cache MISS]', url); // Automatically logged

// Check statistics
console.log(apiClient.getStats());

// Monitor network tab
// Cache hits won't show network requests
// Cache misses will show normal fetch requests
```

## ⚠️ Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 10+)
- Opera: ✅ Full support

IndexedDB is supported in all modern browsers. For older browsers, consider using a polyfill.

## 📊 Performance Considerations

### Memory Usage

- Default: 1000 entries maximum
- Each entry: ~1-10KB depending on response size
- Total: ~1-10MB typical usage
- Adjust `maxEntries` based on your needs

### Storage Limits

- Chrome: ~60% of available disk space
- Firefox: ~50% of available disk space
- Safari: 50MB-1GB depending on storage pressure

### Cleanup Performance

- Automatic cleanup runs every 60 seconds by default
- Minimal CPU impact (<1ms typically)
- Adjust `cleanupInterval` if needed

## 🔒 Security Considerations

1. **Sensitive Data**: Don't cache sensitive data with long TTL
2. **Authentication**: Include auth tokens in cache keys via headers
3. **User Isolation**: Always use `otherKeys` with `userId` for user-specific data
4. **HTTPS**: Always use HTTPS APIs for secure data transmission

## 🧪 Testing

See `demo.html` for a complete interactive demo with:
- Real-time statistics
- Activity logging
- Test scenarios
- Custom requests

Open `demo.html` in your browser to try it out!

## 📝 License

MIT License - Feel free to use in personal and commercial projects.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📧 Support

For questions and support, please open an issue on GitHub.

---

**Built with ❤️ for the modern web**
