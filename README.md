# Enterprise-Grade IndexedDB API Caching System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/mujeeb-enfin/indexdb-cache-system)](https://github.com/mujeeb-enfin/indexdb-cache-system/issues)
[![GitHub stars](https://img.shields.io/github/stars/mujeeb-enfin/indexdb-cache-system)](https://github.com/mujeeb-enfin/indexdb-cache-system/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/mujeeb-enfin/indexdb-cache-system)](https://github.com/mujeeb-enfin/indexdb-cache-system/network)

A robust, production-ready IndexedDB caching solution for API requests with automatic expiry, smart cache invalidation, request deduplication, and comprehensive monitoring capabilities.

> 💡 **Built by [MR-INNOVATIONS.COM](https://mr-innovations.com)** - A software development company specializing in scalable web solutions and innovative platforms.

---

## 🎯 Why Use This?

Modern web applications make numerous API calls, often requesting the same data repeatedly. This creates:
- 🐌 **Slow user experiences** - Users wait for the same data to be fetched multiple times
- 💸 **Wasted bandwidth** - Unnecessary network requests increase data usage
- 💰 **Higher API costs** - More requests mean higher bills for rate-limited or paid APIs
- 📉 **Poor offline support** - Apps break when connectivity is lost

**This caching system solves all these problems** by intelligently storing API responses in IndexedDB and serving them instantly on subsequent requests, while keeping data fresh through smart invalidation.

## 🌟 Features

### Core Features
- ✅ **Automatic Caching** - GET requests are automatically cached with configurable TTL
- ✅ **Smart Invalidation** - Non-GET requests (POST, PUT, DELETE) automatically invalidate related cache entries
- ✅ **Request Deduplication** - Multiple simultaneous requests to the same endpoint are deduplicated
- ✅ **Automatic Expiry** - Cached entries automatically expire after TTL and are cleaned up
- ✅ **Custom Cache Keys** - Support for complex cache keys based on URL, headers, and custom parameters

### Advanced Features
- 📊 **Cache Statistics** - Built-in monitoring with hit rate, miss rate, and invalidation tracking
- 🔄 **Retry Logic** - Comprehensive error handling with exponential backoff retry
- 💾 **Memory Management** - Automatic eviction of old entries when cache size limit is reached
- 🧹 **Background Cleanup** - Periodic cleanup of expired entries
- 📝 **TypeScript-Ready** - Fully documented with JSDoc comments

## 📦 Installation

### NPM (Coming Soon)
```bash
npm install indexdb-cache-system
```

### Direct Download
Download `indexdb-cache-system.js` and include it in your project:

```html
<script src="indexdb-cache-system.js"></script>
```

### ES Module
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

// Second call returns from cache instantly ⚡
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
  cleanupInterval: 60 * 1000,     // Cleanup interval (1 minute)
  persistentHeaderAllowList: []   // Headers allowed to be stored alongside cached data
});
```

## 📚 Core API

### `ApiCall(url, options)`

Main method to make API calls with automatic caching.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | The API endpoint URL |
| `options.method` | string | HTTP method (GET, POST, PUT, DELETE, etc.) |
| `options.headers` | object | Request headers |
| `options.body` | any | Request body |
| `options.otherKeys` | object | Additional keys for cache identification |
| `options.ttl` | number | Custom cache TTL in milliseconds |
| `options.bypassCache` | boolean | Skip cache and fetch fresh data |

**Returns:** `Promise<any>` - API response data

### Examples

#### Simple GET Request
```javascript
const users = await apiClient.ApiCall('https://api.example.com/users');
```

#### GET with Authentication
```javascript
const data = await apiClient.ApiCall('https://api.example.com/protected', {
  headers: {
    'Authorization': 'Bearer token123'
  }
});
```

#### GET with Custom Cache Keys
```javascript
// Different users get different cached data
const data = await apiClient.ApiCall('https://api.example.com/dashboard', {
  otherKeys: {
    userId: 'user123',
    role: 'admin'
  }
});
```

#### GET with Custom TTL
```javascript
// Cache for 10 minutes instead of default
const data = await apiClient.ApiCall('https://api.example.com/products', {
  ttl: 10 * 60 * 1000
});
```

#### POST Request (Auto-invalidates cache)
```javascript
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
```

## 🎯 Real-World Examples

### E-commerce Store
```javascript
class StoreAPI {
  constructor() {
    this.client = new CachedApiClient();
  }
  
  async getProducts(filters = {}) {
    return this.client.ApiCall('https://api.store.com/products', {
      otherKeys: { filters },
      ttl: 10 * 60 * 1000  // Cache products for 10 minutes
    });
  }
  
  async addToCart(productId, quantity) {
    return this.client.ApiCall('https://api.store.com/cart', {
      method: 'POST',
      body: { productId, quantity }
      // Automatically invalidates cart cache
    });
  }
  
  async getCart() {
    return this.client.ApiCall('https://api.store.com/cart', {
      ttl: 30 * 1000  // Short cache for cart (30 seconds)
    });
  }
}
```

### React Integration
```javascript
function useApiData(url, options = {}) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    apiClient.ApiCall(url, options)
      .then(setData)
      .finally(() => setLoading(false));
  }, [url]);
  
  return { data, loading };
}

// Usage in component
function UsersList() {
  const { data: users, loading } = useApiData('https://api.example.com/users');
  
  if (loading) return <div>Loading...</div>;
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

### Pagination
```javascript
async function fetchPage(page) {
  return apiClient.ApiCall('https://api.example.com/items', {
    otherKeys: { page, limit: 20 }
    // Each page is cached separately
  });
}
```

## 📊 Cache Statistics

Monitor your cache performance:

```javascript
const stats = apiClient.getStats();
console.log(stats);
// {
//   hits: 150,        // Number of cache hits
//   misses: 50,       // Number of cache misses
//   invalidations: 10,// Number of invalidations
//   errors: 2,        // Number of errors
//   hitRate: '75.00%' // Cache hit rate
// }
```

## 🔄 Cache Management

### Manual Invalidation
```javascript
// Invalidate all cache for a URL
await apiClient.invalidateCache('https://api.example.com/users');

// Invalidate specific cache entries
await apiClient.invalidateCache('https://api.example.com/dashboard', {
  userId: 'user123'
});
```

### Clear All Cache
```javascript
await apiClient.clearCache();
```

### Close Connection
```javascript
// Call when app closes
apiClient.close();
```

## 💡 Best Practices

### 1. Choose Appropriate TTL

| Data Type | Recommended TTL | Example |
|-----------|-----------------|---------|
| Static data (product info) | 15-30 minutes | `ttl: 20 * 60 * 1000` |
| Semi-static (user preferences) | 5-10 minutes | `ttl: 5 * 60 * 1000` |
| Dynamic (cart, notifications) | 30-60 seconds | `ttl: 30 * 1000` |
| Real-time data | Don't cache | `bypassCache: true` |

### 2. Use `otherKeys` for Segmentation

```javascript
// ✅ Good - User-specific caching
await apiClient.ApiCall(url, {
  otherKeys: { userId: currentUser.id }
});

// ❌ Bad - All users share same cache
await apiClient.ApiCall(url);  // Without otherKeys
```

### 3. Monitor Performance

```javascript
// Check cache hit rate regularly
setInterval(() => {
  const stats = apiClient.getStats();
  if (parseFloat(stats.hitRate) < 50) {
    console.warn('Low cache hit rate! Consider adjusting TTL');
  }
}, 60000);
```

## 🔍 How It Works

### Cache Key Generation
Cache keys are generated from:
1. URL (normalized to lowercase)
2. Headers (normalized and sorted)
3. Custom keys (`otherKeys`)

This ensures identical requests share the same cache.

### Smart Invalidation
When you make a non-GET request:
1. System finds all cache entries matching the URL
2. If `otherKeys` provided, only matching entries are invalidated
3. Request proceeds after invalidation

### Request Deduplication
Multiple simultaneous requests to the same endpoint:
1. Only one actual API call is made
2. Other requests wait for the same Promise
3. All requests receive the same result

## 🌐 Browser Support

| Browser | Support |
|---------|---------|
| Chrome/Edge | ✅ Full support |
| Firefox | ✅ Full support |
| Safari | ✅ Full support (iOS 10+) |
| Opera | ✅ Full support |

## 🧪 Try the Demo

Check out the interactive demo at `demo.html` with:
- Real-time statistics dashboard
- Activity logging
- Test scenarios
- Custom request builder

[**Try the Live Demo**](https://mujeeb-enfin.github.io/indexdb-cache-system/demo.html) *(if GitHub Pages enabled)*

## 📈 Performance

- **Typical cache hit**: <5ms
- **Typical cache miss**: Normal fetch time
- **Memory usage**: ~1-10KB per entry
- **Storage**: Uses IndexedDB (50MB-1GB available depending on browser)

## 🔒 Security

- ✅ Don't cache sensitive data with long TTL
- ✅ Include auth tokens in cache keys via headers
- ✅ Use `persistentHeaderAllowList` to explicitly opt-in headers you want stored
- ✅ Always use `otherKeys` with `userId` for user-specific data
- ✅ Use HTTPS APIs for secure data transmission

## 👨‍💻 About the Author

**Mujeeb Rahman**  
Founder & CEO, [MR-INNOVATIONS.COM](https://mr-innovations.com)

A passionate software developer and entrepreneur with a focus on building scalable, innovative web solutions. This caching system was born from real-world needs across multiple production platforms.

### 🚀 Other Innovations

MR-INNOVATIONS.COM has developed several successful platforms:

- **[WorldPostalLocations.com](https://worldpostallocations.com)** - Global Postal Locations API service
- **[CybroHosting.com](https://cybrohosting.com)** - Domain registration and web hosting platform
- **[360Classifieds.in](https://360classifieds.in)** - Comprehensive classifieds and ads platform
- **[OneSync.in](https://onesync.in)** - All-in-one business solution (ERP)
- **[PaymentHooks.com](https://paymenthooks.com)** - Subscription and billing platform (Chargebee alternative)
- **[BloodRescuers.org](https://bloodrescuers.org)** - Blood donor connection platform

> 💼 **Looking for custom software development?** Check out [MR-INNOVATIONS.COM](https://mr-innovations.com) for enterprise solutions.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

This project benefits from real-world testing across multiple production platforms handling millions of API requests daily.

## 📝 License

MIT License - Feel free to use in personal and commercial projects.

## 🐛 Issues & Support

Found a bug? Have a question? [Open an issue](https://github.com/mujeeb-enfin/indexdb-cache-system/issues)

For commercial support or custom implementations, contact [MR-INNOVATIONS.COM](https://mr-innovations.com)

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

## 📧 Connect

- **GitHub**: [@mujeeb-enfin](https://github.com/mujeeb-enfin)
- **Company**: [MR-INNOVATIONS.COM](https://mr-innovations.com)
- **Email**: Available through GitHub profile

---

**Built with ❤️ by [Mujeeb Rahman](https://github.com/mujeeb-enfin) at [MR-INNOVATIONS.COM](https://mr-innovations.com)**

*Battle-tested across multiple production platforms serving millions of users*
