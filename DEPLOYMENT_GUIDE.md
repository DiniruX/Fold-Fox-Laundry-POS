# Deployment Guide - Laundry POS System

## Understanding the CORS Error

The CORS error occurs when your frontend (deployed on one domain) tries to access your backend API (deployed on another domain), and the backend doesn't recognize the frontend's origin as allowed.

## Quick Fix

### Option 1: Using the Updated Code (Recommended)

I've updated the backend code to automatically allow all `*.vercel.app` domains in production. This means:

1. **Commit and push the changes** to your backend repository
2. **Redeploy** your backend on Vercel (it will auto-deploy if connected to Git)
3. **Test** your login - it should now work!

### Option 2: Set Environment Variables Manually

If you prefer more control, you can set specific allowed origins:

#### Backend Environment Variables (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your **backend project** (`fox-fold-laundary-pos-test1`)
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `FRONTEND_URL` | `https://fox-fold-laundary-pos.vercel.app` | Production |
| `MONGODB_URI` | Your MongoDB connection string | All |
| `JWT_SECRET` | Your secret key | All |
| `JWT_REFRESH_SECRET` | Your refresh secret key | All |
| `NODE_ENV` | `production` | Production |

5. Click **Save** and **Redeploy**

#### Frontend Environment Variables (Vercel)

1. Select your **frontend project** (`fox-fold-laundary-pos`)
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_API_URL` | `https://fox-fold-laundary-pos-test1.vercel.app/api` | Production |

4. Click **Save** and **Redeploy**

## Deployment Checklist

### Backend Deployment
- [ ] MongoDB database is accessible from Vercel's servers
- [ ] All environment variables are set in Vercel
- [ ] `NODE_ENV=production` is set
- [ ] Latest code is pushed and deployed

### Frontend Deployment
- [ ] `VITE_API_URL` points to your backend URL
- [ ] Latest code is pushed and deployed
- [ ] Test the login page

## Testing After Deployment

1. **Open your frontend URL** in a browser
2. **Open Developer Console** (F12)
3. Go to the **Network** tab
4. Try to **login**
5. Check for:
   - ✅ Status 200/201 on login request = Success!
   - ❌ CORS error = Backend doesn't allow your frontend origin
   - ❌ 401 Unauthorized = Wrong credentials
   - ❌ 500 Server error = Backend configuration issue

## Common Issues & Solutions

### Issue 1: CORS Error Persists
**Solution:** 
- Ensure you've deployed the latest backend code with the CORS fix
- Check Vercel deployment logs for the backend
- Verify `NODE_ENV=production` is set in backend environment variables

### Issue 2: Cannot Connect to Database
**Solution:**
- Check MongoDB Atlas Network Access settings
- Add `0.0.0.0/0` to IP whitelist (for development)
- Verify connection string includes password and database name

### Issue 3: 404 Not Found on API Calls
**Solution:**
- Verify `VITE_API_URL` in frontend includes `/api` at the end
- Example: `https://your-backend.vercel.app/api`

### Issue 4: Environment Variables Not Working
**Solution:**
- After adding/changing environment variables, you MUST redeploy
- Environment variables are only loaded during build time
- Go to Deployments → Click ⋯ → Redeploy

## Vercel Configuration Files

### Backend: `vercel.json`
```json
{
  "version": 2,
  "name": "laundry-pos-backend",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Frontend: `vercel.json`
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Security Best Practices

1. **Never commit `.env` files** to Git
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Whitelist specific IPs** in MongoDB Atlas for production
4. **Enable MongoDB Atlas authentication**
5. **Use HTTPS** for all API calls (Vercel provides this by default)

## Monitoring

After deployment, monitor:
- Vercel deployment logs
- MongoDB Atlas logs
- Browser console errors
- Network requests in DevTools

## Support

If you encounter issues:
1. Check Vercel deployment logs (Backend and Frontend)
2. Check browser console for errors
3. Verify all environment variables are set
4. Test API endpoints directly using Postman or curl

## Current Deployment URLs

- **Frontend:** https://fox-fold-laundary-pos.vercel.app
- **Backend API:** https://fox-fold-laundary-pos-test1.vercel.app/api

---

**Note:** The backend code has been updated to automatically allow all Vercel deployments (*.vercel.app) in production mode. This should resolve your CORS issue once you deploy the updated code!

