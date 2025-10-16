# Frontend Environment Variables Setup Guide

## Environment Variables

### Required Variables

```env
# Backend API URL
VITE_API_URL=https://fox-fold-laundary-pos-test1.vercel.app/api
```

## Setting Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **frontend project** (fox-fold-laundary-pos)
3. Go to **Settings** → **Environment Variables**
4. Add the variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://fox-fold-laundary-pos-test1.vercel.app/api`
   - **Environments**: Select all (Production, Preview, Development)
5. Click **Save**
6. Go to **Deployments** tab
7. Click **Redeploy** on the latest deployment

## Local Development

For local development, create a `.env` file in the frontend root:

```env
VITE_API_URL=http://localhost:5000/api
```

Or if you want to use the production backend locally:

```env
VITE_API_URL=https://fox-fold-laundary-pos-test1.vercel.app/api
```

⚠️ **Note**: Never commit `.env` files to version control!

## Environment-Specific Configuration

### Development
```env
VITE_API_URL=http://localhost:5000/api
```

### Staging
```env
VITE_API_URL=https://your-staging-backend.vercel.app/api
```

### Production
```env
VITE_API_URL=https://fox-fold-laundary-pos-test1.vercel.app/api
```

## Verifying Setup

After setting environment variables:

1. Redeploy the application
2. Open browser developer console (F12)
3. Try to login
4. Check the Network tab - the request should go to your backend URL
5. If CORS error appears, check the backend environment variables

## How Vite Environment Variables Work

- All environment variables must start with `VITE_` to be exposed to the client
- Variables are replaced at **build time**, not runtime
- After changing environment variables, you **must redeploy**
- Access in code: `import.meta.env.VITE_API_URL`

## Troubleshooting

### API requests going to wrong URL?

1. Check `VITE_API_URL` in Vercel settings
2. Verify you redeployed after adding the variable
3. Clear browser cache
4. Check the constant file: `src/constants/index.js`

### Environment variable not working?

1. Make sure it starts with `VITE_`
2. Restart the dev server if running locally
3. Redeploy if on Vercel
4. Check build logs for errors

### CORS errors?

1. Verify backend has your frontend URL in `FRONTEND_URL`
2. Verify frontend has correct `VITE_API_URL`
3. Both applications must be redeployed after environment changes


