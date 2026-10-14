const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const staffRoutes = require('./routes/staff');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const serviceRoutes = require('./routes/services');
const reportRoutes = require('./routes/reports');
const clothingCategoryRoutes = require('./routes/clothingCategories');

const app = express();

// Trust proxy for rate limiting (needed for development with hot reloading)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration for frontend clients
const allowedOrigins = [
  'http://localhost:5173', // Local development (Vite default)
  'http://localhost:3000', // Alternative local dev port
  // Explicitly allow the production frontend domain
  'https://www.foldfox.lk',
  'https://foldfox.lk',
];

// Add production frontend URLs from environment variables
if (process.env.FRONTEND_URL) {
  // Support multiple URLs separated by comma
  const frontendUrls = process.env.FRONTEND_URL.split(',').map(url => url.trim());
  allowedOrigins.push(...frontendUrls);
}

// In production, also allow Vercel preview deployments
if (process.env.NODE_ENV === 'production') {
  // Allow any Vercel deployment URL for the same project
  allowedOrigins.push(/https:\/\/.*\.vercel\.app$/);
  console.log('🔧 CORS: Production mode - allowing all *.vercel.app domains');
} else {
  console.log('⚠️  CORS: Development mode - only allowing localhost');
}
console.log('✅ CORS: Allowed origins configured:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed origin (string or regex)
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('⚠️  Blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  // Skip rate limiting in development
  skip: () => isDevelopment,
  // Use proper keyGenerator for IPv6 compatibility
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (isDevelopment) {
  app.use(morgan('dev'));
}

// Production security enhancements
if (!isDevelopment) {
  // Trust proxy for correct IP addresses
  app.set('trust proxy', 1);
  
  // Stricter rate limiting in production
  const productionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50
  });
  app.use(productionLimiter);
  
  // Additional security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/clothing-categories', clothingCategoryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    corsEnabled: process.env.NODE_ENV === 'production',
    allowedOriginsCount: allowedOrigins.length,
    requestOrigin: req.headers.origin || 'none'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: `${process.env.BUSINESS_NAME} API`,
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      staff: '/api/staff',
      customers: '/api/customers',
      orders: '/api/orders',
      services: '/api/services',
      reports: '/api/reports'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
