/**
 * ============================================================================
 * Rate Limiting Configuration
 * ============================================================================
 * 
 * Specialized rate limiting for different endpoints
 * Protects against abuse while allowing legitimate high traffic
 * 
 */

const rateLimit = require('express-rate-limit');

/**
 * Strict rate limiter for public registration endpoint
 * Prevents spam and bot registrations
 */
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 registration attempts per IP per 15 minutes
  message: {
    success: false,
    message: 'Too many registration attempts from this IP. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  
  // Skip rate limiting for localhost in development
  skip: (req) => {
    const isDev = process.env.NODE_ENV === 'development';
    const isLocalhost = req.ip === '127.0.0.1' || 
                       req.ip === '::1' || 
                       req.ip === '::ffff:127.0.0.1';
    return isDev && isLocalhost;
  },
  
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many registration attempts. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime - Date.now()) / 1000 / 60,
      helpText: 'If you need assistance, please contact support.'
    });
  },
  
  // Use request IP for rate limiting
  keyGenerator: (req) => {
    // Get real IP from proxy headers (for Vercel, Heroku, etc.)
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.ip || 
           req.socket.remoteAddress;
  }
});

/**
 * Moderate rate limiter for authenticated endpoints
 * Higher limits for logged-in users
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes for authenticated users
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  },
  
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.ip;
  }
});

/**
 * Lenient rate limiter for read-only operations
 * Higher limits for GET requests
 */
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // 300 read requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * Very strict rate limiter for sensitive operations
 * Used for password changes, account deletions, etc.
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 attempts per hour
  message: {
    success: false,
    message: 'Too many attempts. For security, please wait 1 hour before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Login rate limiter
 * Protects against brute force attacks
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  skipSuccessfulRequests: true, // Don't count successful logins
  
  keyGenerator: (req) => {
    // Rate limit by email + IP combination
    const email = req.body.email || 'unknown';
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    return `login:${email}:${ip}`;
  }
});

module.exports = {
  registrationLimiter,
  apiLimiter,
  readLimiter,
  strictLimiter,
  loginLimiter
};

