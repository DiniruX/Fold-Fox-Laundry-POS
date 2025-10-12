# Vercel Deployment Guide

## Changes Made for Serverless Deployment

The backend has been configured to work with Vercel's serverless architecture. Here are the key changes:

1. **Created `index.js`** - Serverless entry point that exports the Express app
2. **Updated `vercel.json`** - Configured builds and routes for serverless deployment
3. **Updated `database.js`** - Optimized MongoDB connection for serverless (connection reuse)
4. **Created `.vercelignore`** - Excludes unnecessary files from deployment

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Set Environment Variables

Before deploying, make sure to set all required environment variables in your Vercel project:

- `MONGO_URI` - Your MongoDB connection string
- `JWT_SECRET` - Your JWT secret key
- `JWT_EXPIRE` - JWT expiration time (e.g., "7d")
- `FRONTEND_URL` - Your frontend URL (for CORS)
- `NODE_ENV` - Set to "production"

You can set these via Vercel dashboard or CLI:

```bash
# Via CLI
vercel env add MONGO_URI
vercel env add JWT_SECRET
vercel env add JWT_EXPIRE
vercel env add FRONTEND_URL
```

Or via Vercel Dashboard:
- Go to your project settings
- Navigate to "Environment Variables"
- Add each variable for Production, Preview, and Development

### 4. Deploy to Vercel

```bash
# Navigate to backend directory
cd Laundary-POS-System-Backend

# Deploy to production
vercel --prod
```

Or push to GitHub and let Vercel auto-deploy (if you have GitHub integration set up).

## Testing Your Deployment

After deployment, test these endpoints:

1. **Health Check**
   ```
   GET https://your-backend.vercel.app/api/health
   ```

2. **API Documentation**
   ```
   GET https://your-backend.vercel.app/api
   ```

3. **Auth Endpoints**
   ```
   POST https://your-backend.vercel.app/api/auth/login
   POST https://your-backend.vercel.app/api/auth/register
   ```

## Common Issues and Solutions

### Issue: "Route not found" error
**Solution:** Make sure you've pushed all changes (especially `index.js` and updated `vercel.json`)

### Issue: Database connection timeout
**Solution:** 
- Ensure your MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Check that your `MONGO_URI` environment variable is set correctly in Vercel

### Issue: CORS errors
**Solution:** 
- Set `FRONTEND_URL` environment variable to your actual frontend URL
- Update the CORS configuration in `src/app.js` if needed

### Issue: Cold start delays
**Solution:** This is normal for serverless. The first request after inactivity may be slow. Consider:
- Using Vercel Pro plan for better performance
- Implementing a ping service to keep functions warm

## Monitoring

You can monitor your serverless functions in the Vercel dashboard:
- View function logs
- Monitor response times
- Track error rates

## Reverting to Traditional Server

If you need to run the backend as a traditional server (not serverless):

1. Keep using `server.js` for local development
2. For traditional hosting (like Heroku, DigitalOcean), use:
   ```json
   "scripts": {
     "start": "node server.js"
   }
   ```

The `server.js` file remains unchanged and will work for traditional deployments.

