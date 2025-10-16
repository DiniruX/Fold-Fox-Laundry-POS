# 🚀 Complete Vercel Deployment Guide
## Fox Fold Laundry POS System

This guide will walk you through deploying both frontend and backend to Vercel from scratch.

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ GitHub account with your code pushed
- ✅ Vercel account (sign up at [vercel.com](https://vercel.com))
- ✅ MongoDB Atlas account with a database created
- ✅ Your MongoDB connection string ready

---

## 🗂️ Project Structure

Your repository has this structure:
```
Fox-Fold-Laundary-POS/
├── Laundary-POS-System-Backend/    ← Backend API
│   ├── api/
│   ├── src/
│   ├── vercel.json
│   ├── package.json
│   └── ENV_TEMPLATE.txt            ← Your environment variable reference
│
└── Laundary-POS-System-Frontend/   ← Frontend React App
    ├── src/
    ├── public/
    ├── vercel.json
    ├── package.json
    └── ENV_TEMPLATE.txt            ← Your environment variable reference
```

---

## 🔧 PART 1: Deploy Backend API

### Step 1: Import Backend Project to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository: `PasinduM0056/Fox-Fold-Laundary-POS`
4. Vercel will detect it's a monorepo

### Step 2: Configure Backend Project

**Build & Development Settings:**
- **Project Name:** `fox-fold-laundary-pos-backend` (or your choice)
- **Framework Preset:** Other
- **Root Directory:** `Laundary-POS-System-Backend` ⚠️ **CRITICAL!**
- **Build Command:** (leave empty - serverless function)
- **Output Directory:** (leave empty)
- **Install Command:** `npm install`

### Step 3: Add Environment Variables

Click on **"Environment Variables"** and add these:

| Variable Name | Value | Where to get it |
|--------------|-------|-----------------|
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas → Connect → Connect your application |
| `JWT_SECRET` | Random 32+ char string | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Different random 32+ char string | Generate same way as above |

**Important:**
- Select **"Production"** environment for all variables
- Do NOT add `NODE_ENV` - it's already in `vercel.json`
- Do NOT add `FRONTEND_URL` - code auto-allows all Vercel domains

### Step 4: Deploy Backend

1. Click **"Deploy"**
2. Wait 1-2 minutes for deployment
3. You'll get a URL like: `https://fox-fold-laundary-pos-backend.vercel.app`
4. **SAVE THIS URL** - you'll need it for frontend!

### Step 5: Verify Backend Works

Open in browser: `https://your-backend-url.vercel.app/api/health`

You should see:
```json
{
  "success": true,
  "message": "Server is running",
  "environment": "production",
  "corsEnabled": true,
  "allowedOriginsCount": 3
}
```

✅ If `environment` is `"production"` and `corsEnabled` is `true`, you're good!

❌ If not, check:
- Root Directory is set to `Laundary-POS-System-Backend`
- Deployment logs for errors

---

## 🎨 PART 2: Deploy Frontend

### Step 1: Import Frontend Project to Vercel

1. Go back to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import **the same repository**: `PasinduM0056/Fox-Fold-Laundary-POS`
4. Vercel will ask you to configure it

### Step 2: Configure Frontend Project

**Build & Development Settings:**
- **Project Name:** `fox-fold-laundary-pos` (or your choice)
- **Framework Preset:** Vite
- **Root Directory:** `Laundary-POS-System-Frontend` ⚠️ **CRITICAL!**
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 3: Add Environment Variables

Click on **"Environment Variables"** and add:

| Variable Name | Value | Example |
|--------------|-------|---------|
| `VITE_API_URL` | `https://your-backend-url.vercel.app/api` | `https://fox-fold-laundary-pos-backend.vercel.app/api` |

**Critical Points:**
- ✅ Use **HTTPS** (not HTTP)
- ✅ Use your **BACKEND URL** (not frontend URL!)
- ✅ Must end with `/api`
- ✅ Select **"Production"** environment

### Step 4: Deploy Frontend

1. Click **"Deploy"**
2. Wait 2-3 minutes for build and deployment
3. You'll get a URL like: `https://fox-fold-laundary-pos.vercel.app`

### Step 5: Test Your Application

1. Open your frontend URL
2. Go to `/login`
3. Try logging in with demo credentials:
   - **Admin:** `admin@laundry.com` / `password123`
   - **Cashier:** `cashier@laundry.com` / `password123`

✅ If login works, congratulations! 🎉

❌ If you get CORS errors, check:
- Frontend `VITE_API_URL` points to **backend** URL (not frontend)
- Backend Root Directory is `Laundary-POS-System-Backend`
- Backend health endpoint shows `corsEnabled: true`

---

## 🔄 PART 3: Updating Your Deployment

### When You Make Code Changes:

1. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Vercel auto-deploys** (if connected to Git)
   - No manual action needed!
   - Check deployment status in Vercel dashboard

### When You Change Environment Variables:

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Edit the variable
3. **IMPORTANT:** Click **"Redeploy"** (variables don't apply until redeployment)

---

## 🐛 Troubleshooting

### Problem: CORS Error

**Error:** `Access to XMLHttpRequest... blocked by CORS policy`

**Solutions:**
1. Check backend health endpoint shows `corsEnabled: true`
2. Verify frontend `VITE_API_URL` uses HTTPS and points to backend
3. Check backend Root Directory is `Laundary-POS-System-Backend`
4. Redeploy backend after verifying settings

### Problem: Mixed Content Error

**Error:** `Mixed Content: The page... was loaded over HTTPS, but requested an insecure XMLHttpRequest`

**Solution:**
- Change `VITE_API_URL` from `http://` to `https://`
- Redeploy frontend

### Problem: 404 Not Found

**Error:** API calls return 404

**Solutions:**
1. Verify `VITE_API_URL` ends with `/api`
2. Check backend is deployed successfully
3. Test backend health endpoint directly

### Problem: Database Connection Error

**Error:** Cannot connect to database

**Solutions:**
1. Check `MONGODB_URI` is correct in backend environment variables
2. In MongoDB Atlas → Network Access → Add `0.0.0.0/0` to IP whitelist
3. Verify MongoDB connection string includes password and database name

### Problem: Environment Variables Not Working

**Solution:**
- **Always redeploy** after changing environment variables
- Environment variables are loaded at build time, not runtime

---

## 📊 Monitoring Your Deployment

### View Deployment Logs

1. Vercel Dashboard → Your Project → Deployments
2. Click on a deployment
3. View:
   - **Build Logs:** See build process
   - **Function Logs:** See backend runtime logs (for API)
   - **Runtime Logs:** See any errors

### Check Deployment Status

- **Green checkmark:** Successful
- **Red X:** Failed (click to see error logs)
- **Building...:** In progress

---

## 🔒 Security Best Practices

### ✅ Do:
- Use strong, random JWT secrets (32+ characters)
- Keep `.env` files in `.gitignore`
- Use HTTPS for all API calls
- Whitelist specific IPs in MongoDB Atlas for production
- Regularly update dependencies

### ❌ Don't:
- Commit `.env` files to Git
- Use weak or default secrets
- Share environment variables publicly
- Use `0.0.0.0/0` MongoDB whitelist in final production (use specific IPs)

---

## 📝 Environment Variables Quick Reference

### Backend (Required)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/laundry-pos
JWT_SECRET=<32+ random characters>
JWT_REFRESH_SECRET=<32+ different random characters>
```

### Frontend (Required)
```
VITE_API_URL=https://your-backend.vercel.app/api
```

---

## 🆘 Still Having Issues?

### Check These:

1. ✅ Both projects deployed successfully (no red X in Vercel)
2. ✅ Backend Root Directory: `Laundary-POS-System-Backend`
3. ✅ Frontend Root Directory: `Laundary-POS-System-Frontend`
4. ✅ Backend health endpoint accessible and shows production mode
5. ✅ All required environment variables added
6. ✅ Redeployed after adding environment variables
7. ✅ Frontend `VITE_API_URL` points to backend (not frontend URL!)
8. ✅ Using HTTPS in all production URLs

### View Logs:
- Vercel Dashboard → Project → Deployments → Click deployment → View logs
- Look for errors in console
- Check Function Logs for backend API errors

---

## 🎉 Success Checklist

- [ ] Backend deployed successfully
- [ ] Backend health endpoint works and shows production mode
- [ ] Frontend deployed successfully
- [ ] Can access landing page
- [ ] Can login successfully
- [ ] No CORS errors in browser console
- [ ] Dashboard loads after login
- [ ] Can create/view customers, orders, etc.

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Vercel deployment logs
3. Check browser console for errors
4. Verify all environment variables are correct

**Common Mistakes:**
- ❌ Wrong Root Directory (most common!)
- ❌ Frontend URL instead of backend URL in `VITE_API_URL`
- ❌ HTTP instead of HTTPS
- ❌ Forgot to redeploy after changing environment variables
- ❌ Missing required environment variables

---

**Good luck with your deployment! 🚀**

