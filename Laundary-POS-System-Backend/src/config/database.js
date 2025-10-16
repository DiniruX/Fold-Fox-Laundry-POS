const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if already connected (important for serverless)
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return mongoose.connection;
    }

    // Check if connecting
    if (mongoose.connection.readyState === 2) {
      console.log('MongoDB connection in progress, waiting...');
      // Wait for the connection to complete
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
      return mongoose.connection;
    }

    // Configure mongoose for serverless
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    // Only set up graceful shutdown handlers if not in serverless environment
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      });
    }
    
    return conn.connection;
    
  } catch (error) {
    console.error('Database connection failed:', error.message);
    // Don't exit process in serverless environment
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      process.exit(1);
    } else {
      throw error; // Let the serverless function handle the error
    }
  }
};

module.exports = connectDB;
