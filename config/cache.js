const { getRedisClient } = require('../config/redis');

class CacheService {
  constructor() {
    this.defaultTTL = 3600; // 1 hour in seconds
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      const client = getRedisClient();
      const serializedValue = JSON.stringify(value);
      await client.setEx(key, ttl, serializedValue);
      console.log(`Cache set for key: ${key}`);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async get(key) {
    try {
      const client = getRedisClient();
      const value = await client.get(key);
      if (value) {
        console.log(`Cache hit for key: ${key}`);
        return JSON.parse(value);
      }
      console.log(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async del(key) {
    try {
      const client = getRedisClient();
      await client.del(key);
      console.log(`Cache deleted for key: ${key}`);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async flush() {
    try {
      const client = getRedisClient();
      await client.flushAll();
      console.log('Cache flushed');
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // Generate cache key
  generateKey(prefix, ...args) {
    return `${prefix}:${args.join(':')}`;
  }
}

module.exports = new CacheService();