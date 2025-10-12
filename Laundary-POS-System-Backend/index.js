// Load environment variables FIRST before anything else
require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/database');

// Initialize database connection
let isConnected = false;

async function ensureDBConnection() {
  if (isConnected) {
    return;
  }
  
  try {
    await connectDB();
    isConnected = true;
    console.log('✅ Database connected for serverless function');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
}

// Export the app for Vercel serverless
module.exports = async (req, res) => {
  try {
    // Ensure database is connected before handling requests
    await ensureDBConnection();
    
    // Handle the request with Express
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

