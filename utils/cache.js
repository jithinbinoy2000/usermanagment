const { getRedisClient } = require('../config/redis');

class CacheService {
  constructor() {
    this.defaultTTL = 3600; // 1 hour in seconds
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>}
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const client = getRedisClient();
      const serializedValue = JSON.stringify(value);
      await client.setEx(key, ttl, serializedValue);
      console.log(`Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error(' Cache SET error:', error);
      return false;
    }
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>}
   */
  async get(key) {
    try {
      const client = getRedisClient();
      const value = await client.get(key);
      if (value) {
        console.log(` Cache HIT: ${key}`);
        return JSON.parse(value);
      }
      console.log(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      console.error(' Cache GET error:', error);
      return null;
    }
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>}
   */
  async del(key) {
    try {
      const client = getRedisClient();
      const result = await client.del(key);
      console.log(`Cache DELETE: ${key} (${result} keys deleted)`);
      return result > 0;
    } catch (error) {
      console.error(' Cache DELETE error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * @param {string} pattern - Pattern to match keys
   * @returns {Promise<boolean>}
   */
  async delPattern(pattern) {
    try {
      const client = getRedisClient();
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        const result = await client.del(keys);
        console.log(`🗑️ Cache DELETE PATTERN: ${pattern} (${result} keys deleted)`);
        return result > 0;
      }
      return true;
    } catch (error) {
      console.error(' Cache DELETE PATTERN error:', error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    try {
      const client = getRedisClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(' Cache EXISTS error:', error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   * @param {string} key - Cache key
   * @returns {Promise<number>} TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  async ttl(key) {
    try {
      const client = getRedisClient();
      return await client.ttl(key);
    } catch (error) {
      console.error(' Cache TTL error:', error);
      return -2;
    }
  }

  /**
   * Flush all cache
   * @returns {Promise<boolean>}
   */
  async flush() {
    try {
      const client = getRedisClient();
      await client.flushAll();
      console.log(' Cache FLUSHED - All keys deleted');
      return true;
    } catch (error) {
      console.error(' Cache FLUSH error:', error);
      return false;
    }
  }

  /**
   * Generate cache key from prefix and arguments
   * @param {string} prefix - Key prefix
   * @param {...any} args - Arguments to include in key
   * @returns {string}
   */
  generateKey(prefix, ...args) {
    const sanitizedArgs = args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg);
      }
      return String(arg);
    });
    return `${prefix}:${sanitizedArgs.join(':')}`;
  }

  /**
   * Increment a counter in cache
   * @param {string} key - Cache key
   * @param {number} increment - Amount to increment (default: 1)
   * @param {number} ttl - TTL for new keys
   * @returns {Promise<number>} New value
   */
  async incr(key, increment = 1, ttl = this.defaultTTL) {
    try {
      const client = getRedisClient();
      const newValue = await client.incrBy(key, increment);
      
      // Set TTL if this is a new key (value equals increment)
      if (newValue === increment && ttl > 0) {
        await client.expire(key, ttl);
      }
      
      return newValue;
    } catch (error) {
      console.error(' Cache INCR error:', error);
      return 0;
    }
  }

  /**
   * Set multiple key-value pairs
   * @param {Object} keyValuePairs - Object with key-value pairs
   * @param {number} ttl - TTL for all keys
   * @returns {Promise<boolean>}
   */
  async mset(keyValuePairs, ttl = this.defaultTTL) {
    try {
      const client = getRedisClient();
      const pipeline = client.multi();
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        pipeline.setEx(key, ttl, JSON.stringify(value));
      });
      
      await pipeline.exec();
      console.log(` Cache MSET: ${Object.keys(keyValuePairs).length} keys`);
      return true;
    } catch (error) {
      console.error(' Cache MSET error:', error);
      return false;
    }
  }

  /**
   * Get multiple values
   * @param {string[]} keys - Array of keys
   * @returns {Promise<Object>} Object with key-value pairs
   */
  async mget(keys) {
    try {
      const client = getRedisClient();
      const values = await client.mGet(keys);
      
      const result = {};
      keys.forEach((key, index) => {
        if (values[index]) {
          try {
            result[key] = JSON.parse(values[index]);
          } catch (parseError) {
            result[key] = values[index];
          }
        } else {
          result[key] = null;
        }
      });
      
      return result;
    } catch (error) {
      console.error(' Cache MGET error:', error);
      return {};
    }
  }
}

// Export singleton instance
module.exports = new CacheService();