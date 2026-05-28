let redisClient = null;
let isRedisConnected = false;
let hasLoggedRedisError = false;

// Simple In-memory store fallback
const memoryStore = new Map();

const initRedis = async () => {
  try {
    const redis = await import('redis');
    const url = process.env.REDIS_URI || 'redis://localhost:6379';
    
    redisClient = redis.createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => {
          // Retry after 1s, 2s, 5s, and then every 30s
          if (retries === 1) return 1000;
          if (retries === 2) return 2000;
          if (retries === 3) return 5000;
          return 30000; // retry every 30 seconds after that
        }
      }
    });

    redisClient.on('error', (err) => {
      if (!hasLoggedRedisError) {
        console.warn('⚠️ Redis Client Error. Using In-Memory Cache fallback.', err.message);
        hasLoggedRedisError = true;
      }
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis Connected');
      isRedisConnected = true;
      hasLoggedRedisError = false; // Reset flag on successful connection
    });

    await redisClient.connect();
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' || error.message.includes('Cannot find module')) {
      console.warn('⚠️ Redis package not installed. Using In-Memory Cache fallback.');
    } else if (!hasLoggedRedisError) {
      console.warn('⚠️ Redis server connection failed. Using In-Memory Cache fallback.', error.message);
      hasLoggedRedisError = true;
    }
    isRedisConnected = false;
  }
};

// Initialize connection
initRedis();

const cacheService = {
  /**
   * Get value from cache
   */
  get: async (key) => {
    try {
      if (isRedisConnected && redisClient) {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      }
    } catch (e) {
      console.error('Cache get error:', e.message);
    }

    // Fallback: In-memory
    const data = memoryStore.get(key);
    if (!data) return null;

    // Check expiry
    if (data.expiry && Date.now() > data.expiry) {
      memoryStore.delete(key);
      return null;
    }
    return data.value;
  },

  /**
   * Set value in cache
   */
  set: async (key, value, ttlSeconds = 300) => {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.set(key, JSON.stringify(value), {
          EX: ttlSeconds,
        });
        return true;
      }
    } catch (e) {
      console.error('Cache set error:', e.message);
    }

    // Fallback: In-memory
    memoryStore.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
    return true;
  },

  /**
   * Delete specific key from cache
   */
  del: async (key) => {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.del(key);
        return true;
      }
    } catch (e) {
      console.error('Cache delete error:', e.message);
    }

    memoryStore.delete(key);
    return true;
  },

  /**
   * Clear cache keys matching prefix pattern
   */
  delStartWith: async (prefix) => {
    try {
      if (isRedisConnected && redisClient) {
        const keys = await redisClient.keys(`${prefix}*`);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
        return true;
      }
    } catch (e) {
      console.error('Cache prefix invalidation error:', e.message);
    }

    // Fallback: In-memory
    for (const key of memoryStore.keys()) {
      if (key.startsWith(prefix)) {
        memoryStore.delete(key);
      }
    }
    return true;
  },

  /**
   * Check connection status
   */
  isRedis: () => isRedisConnected,
};

export default cacheService;
