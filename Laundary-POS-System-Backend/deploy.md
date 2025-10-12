# Quick Deploy to Vercel

## IMPORTANT: Follow These Steps

### 1. Commit All Changes to Git
```bash
cd Laundary-POS-System-Backend

# Add all files
git add .

# Commit the changes
git commit -m "Fix Vercel serverless deployment configuration"

# Push to your repository
git push origin main
```

### 2. Deploy via Vercel

**Option A: Using Vercel Dashboard (Recommended)**
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Find your backend project
3. Click "Redeploy" on the latest deployment
4. OR: If connected to GitHub, the push will auto-deploy

**Option B: Using Vercel CLI**
```bash
# Make sure you're in the backend directory
cd Laundary-POS-System-Backend

# Deploy to production
vercel --prod
```

### 3. Test Your Deployment

After deployment, test these endpoints:

1. **Health Check** (should return success)
   ```
   https://your-backend.vercel.app/api/health
   ```

2. **API Root** (should return API documentation)
   ```
   https://your-backend.vercel.app/api
   ```

3. **Auth Login** (POST request)
   ```
   https://your-backend.vercel.app/api/auth/login
   ```

## What Was Fixed

The issue was that Vercel requires a specific folder structure for serverless functions. The changes made:

1. ✅ Created `api/index.js` - Vercel automatically recognizes this as a serverless function
2. ✅ Updated `vercel.json` - Simplified to use rewrites that route all traffic to `/api`
3. ✅ Database connection optimized for serverless (connection pooling/reuse)

## Environment Variables Checklist

Make sure these are set in Vercel (Project Settings → Environment Variables):

- [ ] `MONGO_URI` - Your MongoDB connection string
- [ ] `JWT_SECRET` - Your JWT secret key
- [ ] `JWT_EXPIRE` - JWT expiration (e.g., "7d")
- [ ] `FRONTEND_URL` - Your frontend URL for CORS
- [ ] `NODE_ENV` - Set to "production"

## If You Still Get "Route not found"

1. Check Vercel deployment logs for errors
2. Verify all environment variables are set
3. Make sure your MongoDB allows connections from anywhere (0.0.0.0/0)
4. Try clearing Vercel cache: `vercel --prod --force`

## Structure Overview

```
Laundary-POS-System-Backend/
├── api/
│   └── index.js          ← Vercel serverless function (NEW)
├── src/
│   ├── app.js            ← Express app setup
│   ├── config/
│   │   └── database.js   ← MongoDB connection (UPDATED)
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── routes/
├── server.js             ← Traditional server (for local dev)
├── vercel.json           ← Vercel configuration (UPDATED)
└── package.json
```

The `server.js` file is still used for local development. The `api/index.js` is used for Vercel deployment.

