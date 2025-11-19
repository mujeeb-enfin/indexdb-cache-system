/**
 * INDEXEDDB CACHING SYSTEM - USAGE GUIDE
 * ========================================
 * MR-INNOVATIONS.COM
 * A complete guide on how to use the enterprise-grade IndexedDB caching system
 */

// ============================================================================
// BASIC SETUP
// ============================================================================

// Initialize the cached API client with custom configuration
const apiClient = new CachedApiClient({
  dbName: 'MyAppCache',          // Database name
  storeName: 'apiCache',         // Object store name
  version: 1,                    // Database version
  defaultTTL: 5 * 60 * 1000,    // 5 minutes default cache TTL
  maxEntries: 1000,              // Maximum cache entries
  cleanupInterval: 60 * 1000     // Cleanup every 1 minute
});

// ============================================================================
// EXAMPLE 1: Simple GET Request (Auto-cached)
// ============================================================================

async function example1_simpleGet() {
  try {
    // First call - fetches from API and caches
    const users = await apiClient.ApiCall('https://api.example.com/users');
    console.log('Users:', users);
    
    // Second call - returns from cache instantly
    const cachedUsers = await apiClient.ApiCall('https://api.example.com/users');
    console.log('Cached Users:', cachedUsers);
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// EXAMPLE 2: GET Request with Custom Headers
// ============================================================================

async function example2_withHeaders() {
  const options = {
    headers: {
      'Authorization': 'Bearer token123',
      'Content-Type': 'application/json'
    }
  };
  
  const data = await apiClient.ApiCall(
    'https://api.example.com/protected',
    options
  );
  
  console.log('Protected data:', data);
}

// ============================================================================
// EXAMPLE 3: GET Request with Additional Cache Keys
// ============================================================================

async function example3_withOtherKeys() {
  // Same URL but different cache based on user ID and filters
  const options1 = {
    headers: {
      'Authorization': 'Bearer token123'
    },
    otherKeys: {
      userId: 'user123',
      filters: { status: 'active' }
    }
  };
  
  const options2 = {
    headers: {
      'Authorization': 'Bearer token123'
    },
    otherKeys: {
      userId: 'user456',
      filters: { status: 'active' }
    }
  };
  
  // These will be cached separately despite same URL
  const user123Data = await apiClient.ApiCall('https://api.example.com/data', options1);
  const user456Data = await apiClient.ApiCall('https://api.example.com/data', options2);
  
  console.log('User 123:', user123Data);
  console.log('User 456:', user456Data);
}

// ============================================================================
// EXAMPLE 4: GET Request with Custom TTL
// ============================================================================

async function example4_customTTL() {
  const options = {
    ttl: 10 * 60 * 1000  // Cache for 10 minutes instead of default 5
  };
  
  const data = await apiClient.ApiCall(
    'https://api.example.com/long-lived-data',
    options
  );
  
  console.log('Data with 10min TTL:', data);
}

// ============================================================================
// EXAMPLE 5: Bypass Cache for Fresh Data
// ============================================================================

async function example5_bypassCache() {
  const options = {
    bypassCache: true  // Skip cache and fetch fresh data
  };
  
  const freshData = await apiClient.ApiCall(
    'https://api.example.com/users',
    options
  );
  
  console.log('Fresh data:', freshData);
}

// ============================================================================
// EXAMPLE 6: POST Request (Auto-invalidates related cache)
// ============================================================================

async function example6_postRequest() {
  // First, get users (will be cached)
  const users = await apiClient.ApiCall('https://api.example.com/users');
  console.log('Original users:', users);
  
  // Create a new user - this will invalidate the cache for this URL
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
  
  console.log('New user created:', newUser);
  
  // Next GET will fetch fresh data from API
  const updatedUsers = await apiClient.ApiCall('https://api.example.com/users');
  console.log('Updated users list:', updatedUsers);
}

// ============================================================================
// EXAMPLE 7: PUT/PATCH Request with Specific Cache Invalidation
// ============================================================================

async function example7_updateRequest() {
  const userId = 123;
  
  // Get user details (cached)
  const user = await apiClient.ApiCall(`https://api.example.com/users/${userId}`, {
    otherKeys: { userId }
  });
  
  console.log('Original user:', user);
  
  // Update user - invalidates cache for this specific user
  const updated = await apiClient.ApiCall(`https://api.example.com/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      name: 'Jane Doe Updated'
    },
    otherKeys: { userId }  // Invalidate cache for this specific user
  });
  
  console.log('User updated:', updated);
  
  // Next GET fetches fresh data
  const freshUser = await apiClient.ApiCall(`https://api.example.com/users/${userId}`, {
    otherKeys: { userId }
  });
  
  console.log('Fresh user data:', freshUser);
}

// ============================================================================
// EXAMPLE 8: DELETE Request
// ============================================================================

async function example8_deleteRequest() {
  const userId = 123;
  
  // Delete user - invalidates all cache for this URL
  await apiClient.ApiCall(`https://api.example.com/users/${userId}`, {
    method: 'DELETE',
    otherKeys: { userId }
  });
  
  console.log('User deleted, cache invalidated');
}

// ============================================================================
// EXAMPLE 9: Pagination with Cache
// ============================================================================

async function example9_pagination() {
  // Each page is cached separately based on otherKeys
  for (let page = 1; page <= 3; page++) {
    const data = await apiClient.ApiCall('https://api.example.com/items', {
      otherKeys: {
        page,
        limit: 20
      }
    });
    
    console.log(`Page ${page}:`, data);
  }
  
  // Accessing page 2 again will use cache
  const cachedPage2 = await apiClient.ApiCall('https://api.example.com/items', {
    otherKeys: {
      page: 2,
      limit: 20
    }
  });
  
  console.log('Cached page 2:', cachedPage2);
}

// ============================================================================
// EXAMPLE 10: Search Results with Filters
// ============================================================================

async function example10_searchWithFilters() {
  // Different filters create different cache entries
  const filters1 = {
    category: 'electronics',
    priceRange: '100-500',
    sortBy: 'price'
  };
  
  const filters2 = {
    category: 'electronics',
    priceRange: '500-1000',
    sortBy: 'rating'
  };
  
  // Cached separately
  const results1 = await apiClient.ApiCall('https://api.example.com/search', {
    otherKeys: { filters: filters1 }
  });
  
  const results2 = await apiClient.ApiCall('https://api.example.com/search', {
    otherKeys: { filters: filters2 }
  });
  
  console.log('Search results 1:', results1);
  console.log('Search results 2:', results2);
}

// ============================================================================
// EXAMPLE 11: Manual Cache Invalidation
// ============================================================================

async function example11_manualInvalidation() {
  // Get data (cached)
  await apiClient.ApiCall('https://api.example.com/products');
  
  // Manually invalidate cache for this URL
  const invalidatedCount = await apiClient.invalidateCache('https://api.example.com/products');
  console.log(`Invalidated ${invalidatedCount} cache entries`);
  
  // Next call will fetch fresh data
  await apiClient.ApiCall('https://api.example.com/products');
}

// ============================================================================
// EXAMPLE 12: Invalidate Cache with Specific OtherKeys
// ============================================================================

async function example12_specificInvalidation() {
  // Cache data for multiple users
  await apiClient.ApiCall('https://api.example.com/dashboard', {
    otherKeys: { userId: 'user123' }
  });
  
  await apiClient.ApiCall('https://api.example.com/dashboard', {
    otherKeys: { userId: 'user456' }
  });
  
  // Invalidate cache only for user123
  await apiClient.invalidateCache('https://api.example.com/dashboard', {
    userId: 'user123'
  });
  
  console.log('Cache invalidated only for user123');
}

// ============================================================================
// EXAMPLE 13: Get Cache Statistics
// ============================================================================

async function example13_statistics() {
  // Make some requests
  await apiClient.ApiCall('https://api.example.com/users');
  await apiClient.ApiCall('https://api.example.com/users'); // Cache hit
  await apiClient.ApiCall('https://api.example.com/products');
  
  // Get statistics
  const stats = apiClient.getStats();
  console.log('Cache Statistics:', stats);
  // Output: { hits: 1, misses: 2, invalidations: 0, errors: 0, hitRate: '33.33%' }
}

// ============================================================================
// EXAMPLE 14: Clear All Cache
// ============================================================================

async function example14_clearCache() {
  // Clear all cached entries
  await apiClient.clearCache();
  console.log('All cache cleared');
}

// ============================================================================
// EXAMPLE 15: Advanced - Multiple Simultaneous Requests (Deduplication)
// ============================================================================

async function example15_requestDeduplication() {
  // These requests happen simultaneously for the same resource
  // The system will deduplicate them and only make ONE API call
  const [result1, result2, result3] = await Promise.all([
    apiClient.ApiCall('https://api.example.com/expensive-operation'),
    apiClient.ApiCall('https://api.example.com/expensive-operation'),
    apiClient.ApiCall('https://api.example.com/expensive-operation')
  ]);
  
  console.log('All three got the same data, but only one API call was made!');
  console.log(result1, result2, result3);
}

// ============================================================================
// EXAMPLE 16: React Integration
// ============================================================================

// Initialize once globally
const globalApiClient = new CachedApiClient({
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  maxEntries: 500
});

// React Hook Example
function useApiData(url, options = {}) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  React.useEffect(() => {
    let mounted = true;
    
    async function fetchData() {
      try {
        setLoading(true);
        const result = await globalApiClient.ApiCall(url, options);
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    
    fetchData();
    
    return () => {
      mounted = false;
    };
  }, [url, JSON.stringify(options)]);
  
  return { data, loading, error };
}

// React Component Example
function UsersList() {
  const { data, loading, error } = useApiData('https://api.example.com/users');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// ============================================================================
// EXAMPLE 17: Error Handling
// ============================================================================

async function example17_errorHandling() {
  try {
    const data = await apiClient.ApiCall('https://api.example.com/might-fail');
    console.log('Success:', data);
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      console.error('Network error:', error);
      // Handle network errors
    } else if (error.message.includes('404')) {
      console.error('Resource not found:', error);
      // Handle 404 errors
    } else {
      console.error('Unknown error:', error);
      // Handle other errors
    }
  }
}

// ============================================================================
// EXAMPLE 18: Cleanup on App Close
// ============================================================================

// Call this when closing your application
function cleanupOnClose() {
  apiClient.close();
  console.log('Cache closed and cleanup timer stopped');
}

// Add event listener for page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupOnClose);
}

// ============================================================================
// EXAMPLE 19: Real-World E-commerce Example
// ============================================================================

class EcommerceAPI {
  constructor() {
    this.client = new CachedApiClient({
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxEntries: 1000
    });
  }
  
  // Get products with caching
  async getProducts(filters = {}) {
    return this.client.ApiCall('https://api.shop.com/products', {
      otherKeys: { filters }
    });
  }
  
  // Get product details (longer cache)
  async getProductDetails(productId) {
    return this.client.ApiCall(`https://api.shop.com/products/${productId}`, {
      ttl: 15 * 60 * 1000, // Cache for 15 minutes
      otherKeys: { productId }
    });
  }
  
  // Add to cart (invalidates cart cache)
  async addToCart(productId, quantity) {
    return this.client.ApiCall('https://api.shop.com/cart', {
      method: 'POST',
      body: { productId, quantity },
      otherKeys: { action: 'add' }
    });
  }
  
  // Get cart (frequently updated, shorter cache)
  async getCart() {
    return this.client.ApiCall('https://api.shop.com/cart', {
      ttl: 30 * 1000 // Only 30 seconds cache
    });
  }
  
  // Update product (invalidates product cache)
  async updateProduct(productId, updates) {
    return this.client.ApiCall(`https://api.shop.com/products/${productId}`, {
      method: 'PUT',
      body: updates,
      otherKeys: { productId }
    });
  }
  
  // Search products
  async searchProducts(query, page = 1) {
    return this.client.ApiCall('https://api.shop.com/search', {
      otherKeys: {
        query,
        page
      }
    });
  }
  
  // Get fresh data bypassing cache
  async getRealtimeInventory(productId) {
    return this.client.ApiCall(`https://api.shop.com/inventory/${productId}`, {
      bypassCache: true // Always fresh data for inventory
    });
  }
}

// Usage
const ecommerceAPI = new EcommerceAPI();

async function example19_ecommerce() {
  // Get products (cached)
  const products = await ecommerceAPI.getProducts({ category: 'electronics' });
  
  // Get product details (cached for 15 minutes)
  const product = await ecommerceAPI.getProductDetails(123);
  
  // Add to cart (invalidates cart cache)
  await ecommerceAPI.addToCart(123, 2);
  
  // Get updated cart
  const cart = await ecommerceAPI.getCart();
  
  // Search (cached by query)
  const searchResults = await ecommerceAPI.searchProducts('laptop', 1);
  
  // Get realtime inventory (never cached)
  const inventory = await ecommerceAPI.getRealtimeInventory(123);
}

// ============================================================================
// BEST PRACTICES
// ============================================================================

/**
 * 1. Choose appropriate TTL based on data volatility
 *    - Static data (product info): 15-30 minutes
 *    - Semi-static data (user preferences): 5-10 minutes
 *    - Dynamic data (cart, notifications): 30-60 seconds
 *    - Real-time data: Don't cache or use bypassCache: true
 * 
 * 2. Use otherKeys for proper cache segmentation
 *    - User-specific data: include userId
 *    - Filtered/paginated data: include filters and pagination params
 *    - Multi-tenant: include tenantId
 * 
 * 3. Handle cache invalidation properly
 *    - Always invalidate related caches on POST/PUT/DELETE
 *    - Use specific otherKeys for granular invalidation
 *    - Consider invalidating parent/related resources
 * 
 * 4. Monitor cache performance
 *    - Check cache hit rate regularly
 *    - Adjust TTL based on hit rate and data freshness requirements
 *    - Set appropriate maxEntries based on memory constraints
 * 
 * 5. Handle errors gracefully
 *    - Implement proper error handling
 *    - Consider fallback mechanisms
 *    - Log errors for monitoring
 * 
 * 6. Cleanup properly
 *    - Call close() when application shuts down
 *    - Use beforeunload event listeners for cleanup
 */

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    example1_simpleGet,
    example2_withHeaders,
    example3_withOtherKeys,
    example4_customTTL,
    example5_bypassCache,
    example6_postRequest,
    example7_updateRequest,
    example8_deleteRequest,
    example9_pagination,
    example10_searchWithFilters,
    EcommerceAPI
  };
}
