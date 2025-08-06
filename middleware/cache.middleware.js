// const cache = require('../utils/cache');

// const cacheMiddleware = (duration = 3600, keyGenerator) => {
//   return async (req, res, next) => {
//     try {
//       let cacheKey;
      
//       if (keyGenerator && typeof keyGenerator === 'function') {
//         cacheKey = keyGenerator(req);
//       } else {
//         cacheKey = cache.generateKey(
//           req.route.path.replace('/', ''),
//           req.method,
//           JSON.stringify(req.query),
//           req.user?.id || 'anonymous'
//         );
//       }

//       const cachedData = await cache.get(cacheKey);
      
//       if (cachedData) {
//         return res.status(200).json({
//           success: true,
//           data: cachedData,
//           fromCache: true
//         });
//       }

//       // Store original json method
//       const originalJson = res.json;
      
//       // Override json method to cache the response
//       res.json = function(body) {
//         if (res.statusCode === 200 && body.success) {
//           cache.set(cacheKey, body.data, duration);
//         }
//         return originalJson.call(this, body);
//       };

//       next();
//     } catch (error) {
//       console.error('Cache middleware error:', error);
//       next();
//     }
//   };
// };

// module.exports = cacheMiddleware;
const cache = require('../utils/cache');

const cacheMiddleware = (duration = 3600, keyGenerator) => {
  return async (req, res, next) => {
    try {
      // Only cache GET requests
      if (req.method !== 'GET') return next();

      let cacheKey;
      if (keyGenerator && typeof keyGenerator === 'function') {
        cacheKey = keyGenerator(req);
      } else {
        const path = req.originalUrl.split('?')[0]; // Full path without query params
        cacheKey = cache.generateKey(
          'api_cache',
          path,
          JSON.stringify(req.query || {}),
          req.user?.id || 'anonymous'
        );
      }

      // Check cache
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        return res.status(200).json({
          success: true,
          data: cachedData,
          fromCache: true
        });
      }

      // Override res.json to cache response
      const originalJson = res.json.bind(res);
      res.json = async (body) => {
        // Cache only if successful response
        if (res.statusCode === 200 && body && body.data) {
          await cache.set(cacheKey, body.data, duration);
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

module.exports = cacheMiddleware;
