# Environment Variables Setup Guide

## Backend Environment Variables

### Required Variables

```env
# MongoDB Connection
MONGO_URI=your-mongodb-connection-string

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS - Frontend URLs (comma-separated for multiple domains)
FRONTEND_URL=https://fox-fold-laundary-pos.vercel.app,https://www.yourotherdomain.com
```

### Optional Variables

```env
# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Twilio Configuration (for SMS notifications)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

## Setting Environment Variables in Vercel

### For Backend Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **backend project** (fox-fold-laundary-pos-test1)
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **MONGO_URI**: Your MongoDB connection string
   - **JWT_SECRET**: A secure random string
   - **FRONTEND_URL**: `https://fox-fold-laundary-pos.vercel.app`
   - **NODE_ENV**: `production`
5. Select environments: Production, Preview, Development
6. Click **Save**
7. **Redeploy** your application for changes to take effect

### For Frontend Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **frontend project** (fox-fold-laundary-pos)
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **VITE_API_URL**: `https://fox-fold-laundary-pos-test1.vercel.app/api`
5. Select environments: Production, Preview, Development
6. Click **Save**
7. **Redeploy** your application

## Multiple Frontend Domains

If you have multiple frontend domains (e.g., production, staging, custom domain), use comma-separated values:

```env
FRONTEND_URL=https://fox-fold-laundary-pos.vercel.app,https://staging.yourdomain.com,https://yourdomain.com
```

## Local Development

For local development, create a `.env` file in the backend root:

```env
MONGO_URI=mongodb://localhost:27017/foldfox-laundry-pos
JWT_SECRET=dev-secret-key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

⚠️ **Note**: Never commit `.env` files to version control!

## Verifying Setup

After setting environment variables and redeploying:

1. Check backend health: `https://your-backend.vercel.app/api/health`
2. Check CORS in browser console when making requests
3. Look for "Allowed origins" in Vercel logs if CORS issues persist

## Troubleshooting

### CORS Error Still Appearing?

1. Verify `FRONTEND_URL` in backend Vercel settings
2. Verify `VITE_API_URL` in frontend Vercel settings
3. Ensure both apps are redeployed after adding variables
4. Check Vercel deployment logs for errors
5. Clear browser cache and try again

### How to Check Environment Variables

In your Vercel deployment logs, you should see:
```
Allowed origins: [ 'http://localhost:5173', 'http://localhost:3000', 'https://fox-fold-laundary-pos.vercel.app' ]
```

If you don't see your frontend URL in the list, the environment variable wasn't loaded correctly.


