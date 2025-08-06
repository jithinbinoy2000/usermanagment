const redis = require('redis');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.error('Redis server refused connection');
          return new Error('Redis server refused connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          console.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          console.error('Redis connection attempts exhausted');
          return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log(' Connected to Redis successfully');
    });

    redisClient.on('reconnecting', () => {
      console.log('Reconnecting to Redis...');
    });

    redisClient.on('end', () => {
      console.log('Redis connection closed');
    });

    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    console.log('Redis connection tested successfully');
    
    return redisClient;
  } catch (error) {
    console.error(' Redis connection error:', error);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis client not initialized or connection closed. Call connectRedis() first.');
  }
  return redisClient;
};

const closeRedisConnection = async () => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      console.log('Redis connection closed gracefully');
    }
  } catch (error) {
    console.error(' Error closing Redis connection:', error);
  }
};

// Graceful shutdown
process.on('SIGINT', closeRedisConnection);
process.on('SIGTERM', closeRedisConnection);

module.exports = {
  connectRedis,
  getRedisClient,
  closeRedisConnection
};