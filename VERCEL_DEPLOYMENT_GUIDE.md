# Vercel Deployment Guide

## ✅ Vercel Configuration Files Created

Both backend and frontend now have `vercel.json` configuration files for easy deployment!

## Files Created

1. **Backend**: `Laundary-POS-System-Backend/vercel.json`
2. **Frontend**: `Laundary-POS-System-Frontend/vercel.json`

---

## Backend Deployment

### Configuration Overview

**File**: `Laundary-POS-System-Backend/vercel.json`

#### Key Features:
- ✅ Serverless function setup
- ✅ API routes configuration
- ✅ CORS headers configured
- ✅ 1024MB memory allocation
- ✅ 10 second max duration
- ✅ Production environment

### Deployment Steps

#### 1. Prerequisites
```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Or use npx (no installation needed)
npx vercel
```

#### 2. Navigate to Backend Directory
```bash
cd Laundary-POS-System-Backend
```

#### 3. Login to Vercel
```bash
vercel login
```

#### 4. Deploy
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### 5. Set Environment Variables

**Required Environment Variables:**

Go to your Vercel dashboard → Project → Settings → Environment Variables

Add these variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/laundry-pos
JWT_SECRET=your-secure-jwt-secret-key-here
JWT_EXPIRE=7d

FRONTEND_URL=https://your-frontend-url.vercel.app

# Email Configuration (if using)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Optional: Twilio (if using SMS)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-phone

# Bank Account Details (for payments)
BANK_NAME=Your Bank Name
BANK_ACCOUNT_NAME=Company Name
BANK_ACCOUNT_NUMBER=1234567890
BANK_BRANCH=Main Branch
BANK_SWIFT_CODE=BANKCODE123
```

**Important:** Set these for **Production**, **Preview**, and **Development** environments

### Backend Deployment URL

After deployment, you'll get a URL like:
```
https://your-backend-name.vercel.app
```

All API routes will be available at:
```
https://your-backend-name.vercel.app/api/auth/login
https://your-backend-name.vercel.app/api/orders
https://your-backend-name.vercel.app/api/customers
etc.
```

---

## Frontend Deployment

### Configuration Overview

**File**: `Laundary-POS-System-Frontend/vercel.json`

#### Key Features:
- ✅ Static build deployment
- ✅ SPA routing support
- ✅ Security headers configured
- ✅ Static file caching
- ✅ Clean URLs enabled

### Deployment Steps

#### 1. Navigate to Frontend Directory
```bash
cd Laundary-POS-System-Frontend
```

#### 2. Update Environment Variables

Create `.env.production` file:
```bash
REACT_APP_API_URL=https://your-backend-name.vercel.app/api
```

#### 3. Build Locally (Optional - to test)
```bash
npm run build
```

#### 4. Deploy
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### 5. Set Environment Variables in Vercel

Go to Vercel dashboard → Project → Settings → Environment Variables

Add:
```
REACT_APP_API_URL=https://your-backend-name.vercel.app/api
```

### Frontend Deployment URL

After deployment, you'll get a URL like:
```
https://your-frontend-name.vercel.app
```

---

## Complete Deployment Workflow

### Step-by-Step Full Deployment

#### Step 1: Deploy Backend First
```bash
cd Laundary-POS-System-Backend
vercel --prod
```
Note the deployed URL: `https://laundry-backend.vercel.app`

#### Step 2: Update Frontend Environment
```bash
cd ../Laundary-POS-System-Frontend
```

Create/edit `.env.production`:
```
REACT_APP_API_URL=https://laundry-backend.vercel.app/api
```

#### Step 3: Deploy Frontend
```bash
vercel --prod
```
Note the deployed URL: `https://laundry-frontend.vercel.app`

#### Step 4: Update Backend CORS

In Vercel Backend → Environment Variables:
```
FRONTEND_URL=https://laundry-frontend.vercel.app
```

Redeploy backend:
```bash
cd ../Laundary-POS-System-Backend
vercel --prod
```

#### Step 5: Test
Visit: `https://laundry-frontend.vercel.app`

---

## Environment Variables Summary

### Backend Environment Variables (Vercel Dashboard)

**Database:**
```
MONGODB_URI=mongodb+srv://...
```

**Authentication:**
```
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d
```

**CORS:**
```
FRONTEND_URL=https://your-frontend.vercel.app
```

**Email (Optional):**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

**Bank Details:**
```
BANK_NAME=Your Bank
BANK_ACCOUNT_NAME=Company Name
BANK_ACCOUNT_NUMBER=1234567890
BANK_BRANCH=Main Branch
BANK_SWIFT_CODE=CODE123
```

### Frontend Environment Variables (Vercel Dashboard)

```
REACT_APP_API_URL=https://your-backend.vercel.app/api
```

---

## Vercel Configuration Explained

### Backend (`vercel.json`)

```json
{
  "builds": [
    {
      "src": "server.js",        // Entry point
      "use": "@vercel/node"      // Node.js runtime
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",        // All API routes
      "dest": "server.js"        // Go to server
    }
  ],
  "functions": {
    "server.js": {
      "memory": 1024,            // 1GB memory
      "maxDuration": 10          // 10 seconds timeout
    }
  }
}
```

### Frontend (`vercel.json`)

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",  // Static site build
      "config": {
        "distDir": "build"            // React build output
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"           // SPA routing
    }
  ]
}
```

---

## Troubleshooting

### Common Issues

#### 1. Backend API Not Responding
**Solution**: Check environment variables are set in Vercel dashboard

#### 2. CORS Errors
**Solution**: Ensure `FRONTEND_URL` in backend matches your frontend URL exactly

#### 3. Database Connection Failed
**Solution**: 
- Check `MONGODB_URI` is correct
- Whitelist Vercel IPs in MongoDB Atlas
- Or use `0.0.0.0/0` (allow all IPs)

#### 4. Frontend Can't Connect to Backend
**Solution**: Check `REACT_APP_API_URL` in frontend environment variables

#### 5. Build Fails
**Backend**: Check `package.json` scripts
**Frontend**: Run `npm run build` locally to test

### MongoDB Atlas Configuration

For Vercel deployment, in MongoDB Atlas:

1. Go to Network Access
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add Vercel's IP ranges
4. Save

---

## Monitoring & Logs

### View Logs

**Vercel Dashboard:**
1. Go to your project
2. Click on "Deployments"
3. Click on deployment
4. View "Runtime Logs" tab

**CLI:**
```bash
vercel logs [deployment-url]
```

---

## Custom Domains (Optional)

### Add Custom Domain

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update environment variables with new domain

### Update After Custom Domain

**Backend** `FRONTEND_URL`:
```
FRONTEND_URL=https://laundry.yourdomain.com
```

**Frontend** `REACT_APP_API_URL`:
```
REACT_APP_API_URL=https://api.yourdomain.com/api
```

---

## Performance Optimization

### Backend:
- ✅ Compression enabled
- ✅ Rate limiting configured
- ✅ 1GB memory allocated
- ✅ Connection pooling (MongoDB)

### Frontend:
- ✅ Static file caching (1 year)
- ✅ Build optimization
- ✅ Code splitting
- ✅ Asset compression

---

## Security

### Headers Configured:

**Backend:**
- CORS with credentials
- Rate limiting (100 req/15min)
- Helmet security headers

**Frontend:**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection enabled
- Static file caching

---

## Deployment Checklist

### Pre-Deployment:
- [ ] MongoDB Atlas cluster created
- [ ] MongoDB network access configured
- [ ] All environment variables prepared
- [ ] Frontend built successfully locally
- [ ] Backend tested locally

### Backend Deployment:
- [ ] `cd Laundary-POS-System-Backend`
- [ ] `vercel --prod`
- [ ] Set all environment variables
- [ ] Test API endpoint
- [ ] Check logs for errors

### Frontend Deployment:
- [ ] Update `REACT_APP_API_URL` in .env.production
- [ ] `cd Laundary-POS-System-Frontend`
- [ ] `vercel --prod`
- [ ] Set environment variables
- [ ] Test application
- [ ] Check all features work

### Post-Deployment:
- [ ] Update backend `FRONTEND_URL` with frontend URL
- [ ] Redeploy backend
- [ ] Test login functionality
- [ ] Test API calls from frontend
- [ ] Test CORS
- [ ] Verify all features work
- [ ] Monitor logs for errors

---

## Quick Deploy Commands

### Backend:
```bash
cd Laundary-POS-System-Backend
vercel --prod
```

### Frontend:
```bash
cd Laundary-POS-System-Frontend
vercel --prod
```

### Both at Once (from root):
```bash
# Deploy backend
cd Laundary-POS-System-Backend && vercel --prod && cd ..

# Deploy frontend
cd Laundary-POS-System-Frontend && vercel --prod && cd ..
```

---

## Cost Considerations

### Vercel Free Tier:
- ✅ Hobby projects
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Custom domains

### Pro Tier (if needed):
- More bandwidth
- More build time
- Team collaboration
- Advanced analytics

---

## Support & Resources

### Vercel Documentation:
- Deploying Node.js: https://vercel.com/docs/functions/serverless-functions
- Deploying React: https://vercel.com/docs/frameworks/react
- Environment Variables: https://vercel.com/docs/environment-variables

### Project Resources:
- Backend README: `Laundary-POS-System-Backend/README.md`
- Environment Example: `Laundary-POS-System-Backend/env.example`

---

## 🎉 Ready to Deploy!

Your project is now configured for Vercel deployment with proper `vercel.json` files for both backend and frontend!

**Status**: ✅ Configuration Complete
**Files**: vercel.json created for both
**Ready**: Deploy anytime!

