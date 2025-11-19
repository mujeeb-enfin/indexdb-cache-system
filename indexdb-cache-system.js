/**
 * Enterprise-Grade IndexedDB API Caching System
 * mr-innovations.com
 * Features:
 * - Automatic cache expiry with configurable TTL
 * - Smart cache invalidation for non-GET requests
 * - Request deduplication to prevent duplicate API calls
 * - Comprehensive error handling and retry logic
 * - Cache statistics and monitoring
 * - Automatic cleanup of expired entries
 * - Support for custom cache keys
 */

class IndexedDBCache {
  constructor(config = {}) {
    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not available in this environment.');
    }
    
    this.dbName = config.dbName || 'ApiCacheDB';
    this.storeName = config.storeName || 'apiCache';
    this.version = config.version || 1;
    this.defaultTTL = config.defaultTTL || 5 * 60 * 1000; // 5 minutes default
    this.maxEntries = config.maxEntries || 1000;
    this.cleanupInterval = config.cleanupInterval || 60 * 1000; // 1 minute
    this.persistentHeaderAllowList = (config.persistentHeaderAllowList || []).map(header =>
      header.toLowerCase()
    );
    
    this.db = null;
    this.initPromise = null;
    this.pendingRequests = new Map(); // For request deduplication
    
    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      errors: 0
    };
    
    // Start automatic cleanup
    this.startCleanupTimer();
  }

  /**
   * Initialize the IndexedDB database
   */
  async init() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        this.stats.errors++;
        reject(new Error(`Failed to open database: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'cacheKey' });
          
          // Create indexes for efficient querying
          objectStore.createIndex('url', 'url', { unique: false });
          objectStore.createIndex('expiresAt', 'expiresAt', { unique: false });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
          objectStore.createIndex('method', 'method', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Generate a cache key from URL, headers, and other parameters
   */
  generateCacheKey(url, headers = {}, otherKeys = {}) {
    const normalized = {
      url: url.toLowerCase(),
      headers: this.normalizeHeaders(headers),
      otherKeys: this.sortObject(otherKeys)
    };
    
    return this.hashString(JSON.stringify(normalized));
  }

  /**
   * Normalize headers by sorting and lowercasing keys
   */
  normalizeHeaders(headers) {
    const normalized = {};
    for (const [key, value] of Object.entries(headers)) {
      normalized[key.toLowerCase()] = value;
    }
    return this.sortObject(normalized);
  }

  /**
   * Persist only whitelisted headers to IndexedDB
   */
  sanitizeHeaders(headers = {}, allowList = this.persistentHeaderAllowList) {
    if (!Array.isArray(allowList) || allowList.length === 0) {
      return {};
    }
    
    const normalizedHeaders = this.normalizeHeaders(headers);
    return allowList.reduce((result, header) => {
      if (Object.prototype.hasOwnProperty.call(normalizedHeaders, header)) {
        result[header] = normalizedHeaders[header];
      }
      return result;
    }, {});
  }

  /**
   * Sort object keys for consistent hashing
   */
  sortObject(obj) {
    return Object.keys(obj)
      .sort()
      .reduce((result, key) => {
        result[key] = obj[key];
        return result;
      }, {});
  }

  /**
   * Simple hash function for generating cache keys
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `cache_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Get data from cache
   */
  async getFromCache(cacheKey) {
    try {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(cacheKey);

        request.onsuccess = () => {
          const cached = request.result;
          
          if (!cached) {
            this.stats.misses++;
            resolve(null);
            return;
          }

          // Check if expired
          if (cached.expiresAt && Date.now() > cached.expiresAt) {
            this.stats.misses++;
            // Delete expired entry asynchronously
            this.deleteFromCache(cacheKey).catch(console.error);
            resolve(null);
            return;
          }

          this.stats.hits++;
          resolve(cached);
        };

        request.onerror = () => {
          this.stats.errors++;
          reject(new Error(`Failed to get from cache: ${request.error}`));
        };
      });
    } catch (error) {
      this.stats.errors++;
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Put data into cache
   */
  async putIntoCache(cacheKey, url, data, method = 'GET', headers = {}, otherKeys = {}, ttl = null) {
    try {
      await this.init();
      
      const expiresAt = Date.now() + (ttl ?? this.defaultTTL);
      const normalizedUrl = url.toLowerCase();
      const sanitizedHeaders = this.sanitizeHeaders(headers);
      
      const cacheEntry = {
        cacheKey,
        url: normalizedUrl,
        method,
        headers: sanitizedHeaders,
        otherKeys,
        data,
        createdAt: Date.now(),
        expiresAt,
        accessCount: 0
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(cacheEntry);

        request.onsuccess = () => {
          // Check if we need to evict old entries
          this.evictIfNeeded().catch(console.error);
          resolve(true);
        };

        request.onerror = () => {
          this.stats.errors++;
          reject(new Error(`Failed to put into cache: ${request.error}`));
        };
      });
    } catch (error) {
      this.stats.errors++;
      console.error('Cache put error:', error);
      return false;
    }
  }

  /**
   * Delete specific cache entry
   */
  async deleteFromCache(cacheKey) {
    try {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(cacheKey);

        request.onsuccess = () => {
          this.stats.invalidations++;
          resolve(true);
        };

        request.onerror = () => {
          this.stats.errors++;
          reject(new Error(`Failed to delete from cache: ${request.error}`));
        };
      });
    } catch (error) {
      this.stats.errors++;
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Invalidate cache entries matching URL or other keys
   */
  async invalidateCache(url, otherKeys = {}) {
    try {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('url');
        const normalizedUrl = url.toLowerCase();
        const request = index.openCursor(IDBKeyRange.only(normalizedUrl));

        const keysToDelete = [];

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor) {
            const entry = cursor.value;
            
            // Check if otherKeys match (if provided)
            if (Object.keys(otherKeys).length === 0 || 
                this.matchesOtherKeys(entry.otherKeys, otherKeys)) {
              keysToDelete.push(entry.cacheKey);
            }
            
            cursor.continue();
          } else {
            // Delete all matching entries
            Promise.all(keysToDelete.map(key => this.deleteFromCache(key)))
              .then(() => resolve(keysToDelete.length))
              .catch(reject);
          }
        };

        request.onerror = () => {
          this.stats.errors++;
          reject(new Error(`Failed to invalidate cache: ${request.error}`));
        };
      });
    } catch (error) {
      this.stats.errors++;
      console.error('Cache invalidation error:', error);
      return 0;
    }
  }

  /**
   * Check if otherKeys match
   */
  matchesOtherKeys(cachedKeys, targetKeys) {
    if (!cachedKeys) return false;
    for (const [key, value] of Object.entries(targetKeys)) {
      if (!Object.prototype.hasOwnProperty.call(cachedKeys, key)) {
        return false;
      }
      if (JSON.stringify(cachedKeys[key]) !== JSON.stringify(value)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpired() {
    try {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('expiresAt');
        const now = Date.now();
        const request = index.openCursor(IDBKeyRange.upperBound(now));

        let deletedCount = 0;

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            resolve(deletedCount);
          }
        };

        request.onerror = () => {
          this.stats.errors++;
          reject(new Error(`Failed to cleanup expired: ${request.error}`));
        };
      });
    } catch (error) {
      this.stats.errors++;
      console.error('Cleanup error:', error);
      return 0;
    }
  }

  /**
   * Evict oldest entries if cache is too large
   */
  async evictIfNeeded() {
    try {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.count();

        request.onsuccess = async () => {
          const count = request.result;
          
          if (count > this.maxEntries) {
            const toDelete = count - this.maxEntries;
            await this.evictOldest(toDelete);
          }
          
          resolve();
        };

        request.onerror = () => {
          this.stats.errors++;
          reject(new Error(`Failed to check cache size: ${request.error}`));
        };
      });
    } catch (error) {
      this.stats.errors++;
      console.error('Eviction check error:', error);
    }
  }

  /**
   * Evict oldest entries
   */
  async evictOldest(count) {
    try {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('createdAt');
        const request = index.openCursor();

        let deletedCount = 0;

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor && deletedCount < count) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            resolve(deletedCount);
          }
        };

        request.onerror = () => {
          this.stats.errors++;
          reject(new Error(`Failed to evict oldest: ${request.error}`));
        };
      });
    } catch (error) {
      this.stats.errors++;
      console.error('Eviction error:', error);
      return 0;
    }
  }

  /**
   * Start automatic cleanup timer
   */
  startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    if (typeof setInterval === 'undefined') {
      return;
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired().catch(console.error);
    }, this.cleanupInterval);
  }

  /**
   * Stop automatic cleanup timer
   */
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * Clear all cache
   */
  async clearAll() {
    try {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          this.stats.errors++;
          reject(new Error(`Failed to clear cache: ${request.error}`));
        };
      });
    } catch (error) {
      this.stats.errors++;
      console.error('Clear cache error:', error);
      return false;
    }
  }

  /**
   * Close database connection
   */
  close() {
    this.stopCleanupTimer();
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

/**
 * Main API Call function with caching
 */
class CachedApiClient {
  constructor(cacheConfig = {}) {
    this.cache = new IndexedDBCache(cacheConfig);
  }

  /**
   * Make an API call with automatic caching
   * 
   * @param {string} url - The API endpoint URL
   * @param {Object} options - Fetch options
   * @param {Object} options.headers - Request headers
   * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param {any} options.body - Request body
   * @param {Object} options.otherKeys - Additional keys for cache identification
   * @param {number} options.ttl - Cache TTL in milliseconds (optional)
   * @param {boolean} options.bypassCache - Skip cache and fetch fresh data
   * @returns {Promise<any>} - API response data
   */
  async ApiCall(url, options = {}) {
    const {
      headers = {},
      method = 'GET',
      body = null,
      otherKeys = {},
      ttl = null,
      bypassCache = false,
      ...fetchOptions
    } = options;

    const normalizedMethod = method.toUpperCase();
    const cacheKey = this.cache.generateCacheKey(url, headers, otherKeys);
    const normalizedBody = this.normalizeRequestBody(body);

    try {
      // For non-GET requests, invalidate related cache entries first
      if (normalizedMethod !== 'GET') {
        await this.cache.invalidateCache(url, otherKeys);
      }

      // Check cache for GET requests (unless bypassing)
      if (normalizedMethod === 'GET' && !bypassCache) {
        // Check for pending request (deduplication)
        if (this.cache.pendingRequests.has(cacheKey)) {
          return await this.cache.pendingRequests.get(cacheKey);
        }

        // Try to get from cache
        const cached = await this.cache.getFromCache(cacheKey);
        
        if (cached) {
          console.log(`[Cache HIT] ${url}`);
          return cached.data;
        }

        console.log(`[Cache MISS] ${url}`);
      }

      // Create fetch request
      const fetchPromise = this.performFetch(url, {
        method: normalizedMethod,
        headers,
        body: normalizedBody,
        ...fetchOptions
      });

      // Store pending request for deduplication
      if (normalizedMethod === 'GET') {
        this.cache.pendingRequests.set(cacheKey, fetchPromise);
      }

      try {
        const response = await fetchPromise;
        const shouldCache =
          normalizedMethod === 'GET' &&
          response.ok &&
          this.shouldCacheResponse(response);

        if (shouldCache) {
          const data = await this.deserializeResponse(response);
          await this.cache.putIntoCache(
            cacheKey,
            url,
            data,
            normalizedMethod,
            headers,
            otherKeys,
            ttl
          );
          return data;
        }

        // For non-GET requests or uncached GETs, return parsed data when OK
        return response.ok ? await this.deserializeResponse(response) : response;

      } finally {
        // Remove from pending requests
        if (normalizedMethod === 'GET') {
          this.cache.pendingRequests.delete(cacheKey);
        }
      }

    } catch (error) {
      // Remove from pending requests on error
      this.cache.pendingRequests.delete(cacheKey);
      console.error(`[API Error] ${url}:`, error);
      throw error;
    }
  }

  /**
   * Perform the actual fetch request with retry logic
   */
  async performFetch(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok && i < retries - 1) {
          // Retry on 5xx errors
          if (response.status >= 500) {
            await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
            continue;
          }
        }
        
        return response;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.delay(Math.pow(2, i) * 1000);
      }
    }
  }

  /**
   * Decide whether to persist a response in the cache
   */
  shouldCacheResponse(response) {
    const cacheControl = response.headers.get('cache-control');
    if (cacheControl) {
      const normalized = cacheControl.toLowerCase();
      if (
        normalized.includes('no-store') ||
        normalized.includes('private') ||
        normalized.includes('no-cache')
      ) {
        return false;
      }
    }

    const pragma = response.headers.get('pragma');
    if (pragma && pragma.toLowerCase().includes('no-cache')) {
      return false;
    }

    if (typeof response.headers.has === 'function' && response.headers.has('set-cookie')) {
      return false;
    }

    return true;
  }

  /**
   * Deserialize responses based on their content type
   */
  async deserializeResponse(response) {
    if (!response) return null;
    if (response.status === 204 || response.status === 205) {
      return null;
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength === '0' || response.body === null) {
      return null;
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();

    if (contentType.includes('json')) {
      return await response.json();
    }

    if (contentType.startsWith('text/')) {
      return await response.text();
    }

    try {
      return await response.arrayBuffer();
    } catch (error) {
      console.warn('Falling back to text parsing for response', error);
      return await response.text();
    }
  }

  /**
   * Normalize request bodies to avoid unwanted JSON serialization
   */
  normalizeRequestBody(body) {
    if (body == null) {
      return null;
    }

    if (typeof body === 'string') {
      return body;
    }

    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      return body;
    }

    if (typeof Blob !== 'undefined' && body instanceof Blob) {
      return body;
    }

    if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
      return body;
    }

    if (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream) {
      return body;
    }

    if (typeof ArrayBuffer !== 'undefined') {
      if (body instanceof ArrayBuffer) {
        return body;
      }
      if (typeof ArrayBuffer.isView === 'function' && ArrayBuffer.isView(body)) {
        return body;
      }
    }

    return JSON.stringify(body);
  }

  /**
   * Delay helper for retry logic
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Clear all cache
   */
  async clearCache() {
    return this.cache.clearAll();
  }

  /**
   * Manually invalidate specific cache entries
   */
  async invalidateCache(url, otherKeys = {}) {
    return this.cache.invalidateCache(url, otherKeys);
  }

  /**
   * Close the cache (cleanup)
   */
  close() {
    this.cache.close();
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CachedApiClient, IndexedDBCache };
}

// Example usage
if (typeof window !== 'undefined') {
  window.CachedApiClient = CachedApiClient;
  window.IndexedDBCache = IndexedDBCache;
}
