# Vercel Deployment - Quick Start

## 🚀 Deploy in 5 Minutes!

Quick guide to deploy your Laundry POS System on Vercel.

---

## Prerequisites

✅ Vercel account (free): https://vercel.com/signup
✅ MongoDB Atlas account (free): https://www.mongodb.com/cloud/atlas/register
✅ Both backend and frontend code ready

---

## Step 1: Prepare MongoDB Atlas (2 minutes)

### 1.1 Create Database
1. Go to MongoDB Atlas
2. Create a free cluster (if you haven't)
3. Create database user
4. Get connection string

### 1.2 Configure Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Save

### 1.3 Get Connection String
```
mongodb+srv://username:password@cluster.mongodb.net/laundry-pos?retryWrites=true&w=majority
```

---

## Step 2: Deploy Backend (2 minutes)

### 2.1 Open Terminal in Backend Folder
```bash
cd Laundary-POS-System-Backend
```

### 2.2 Deploy
```bash
# Using Vercel CLI
vercel --prod

# Or using npx (no installation)
npx vercel --prod
```

### 2.3 Follow Prompts
- Login to Vercel (if first time)
- Select account
- Confirm settings
- Wait for deployment

### 2.4 Note Your Backend URL
```
✅ Deployed to: https://laundry-backend-xyz.vercel.app
```

### 2.5 Set Environment Variables

Go to Vercel Dashboard → Your Backend Project → Settings → Environment Variables

**Add these (Required):**
```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/laundry-pos
JWT_SECRET = your-secure-random-string-at-least-32-characters
JWT_EXPIRE = 7d
FRONTEND_URL = https://your-frontend-will-be-here.vercel.app
```

**Add these (Optional - for email notifications):**
```
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = your-email@gmail.com
EMAIL_PASSWORD = your-app-password
EMAIL_FROM = your-email@gmail.com
```

**Add these (For bank transfers):**
```
BANK_NAME = Your Bank Name
BANK_ACCOUNT_NAME = Your Company Name
BANK_ACCOUNT_NUMBER = 1234567890
BANK_BRANCH = Main Branch
BANK_SWIFT_CODE = BANKCODE123
```

### 2.6 Redeploy After Setting Variables
```bash
vercel --prod
```

---

## Step 3: Deploy Frontend (1 minute)

### 3.1 Create Production Environment File
```bash
cd ../Laundary-POS-System-Frontend
```

Create `.env.production` file:
```
REACT_APP_API_URL=https://your-backend-xyz.vercel.app/api
```

**Replace with your actual backend URL from Step 2.4!**

### 3.2 Deploy
```bash
vercel --prod
```

### 3.3 Note Your Frontend URL
```
✅ Deployed to: https://laundry-frontend-abc.vercel.app
```

### 3.4 Update Backend CORS

Go back to Backend project in Vercel Dashboard:
- Settings → Environment Variables
- Update `FRONTEND_URL` to your frontend URL
- Redeploy backend:

```bash
cd ../Laundary-POS-System-Backend
vercel --prod
```

---

## Step 4: Test Your Deployment

### 4.1 Visit Frontend
```
https://your-frontend-abc.vercel.app
```

### 4.2 Test Login
- Use default credentials (if seeded)
- Or create first user via API

### 4.3 Test Features
- ✅ Login works
- ✅ Dashboard loads
- ✅ Can create orders
- ✅ Can manage customers
- ✅ All pages work

---

## Default Admin User (If Seeded)

If you ran the seed script:
```
Email: admin@laundry.com
Password: admin123
```

**⚠️ Change this immediately after first login!**

---

## Quick Troubleshooting

### Problem: Can't login
**Solution**: Check `MONGODB_URI` and `JWT_SECRET` in backend env vars

### Problem: API errors
**Solution**: Check backend logs in Vercel dashboard

### Problem: CORS errors
**Solution**: Verify `FRONTEND_URL` in backend matches your frontend URL exactly

### Problem: Database connection failed
**Solution**: 
- Check MongoDB Atlas network access (0.0.0.0/0)
- Verify connection string is correct

---

## Environment Variables Checklist

### Backend (Vercel Dashboard):
- [ ] `MONGODB_URI`
- [ ] `JWT_SECRET`
- [ ] `JWT_EXPIRE`
- [ ] `FRONTEND_URL`
- [ ] `EMAIL_*` variables (if using email)
- [ ] `BANK_*` variables (for payments)

### Frontend (Vercel Dashboard):
- [ ] `REACT_APP_API_URL`

---

## CLI Commands Reference

### Deploy to Production:
```bash
vercel --prod
```

### Deploy to Preview (test):
```bash
vercel
```

### Check Deployment Status:
```bash
vercel ls
```

### View Logs:
```bash
vercel logs [deployment-url]
```

### Remove Deployment:
```bash
vercel remove [deployment-name]
```

---

## Cost: FREE! 🎉

Both backend and frontend can be deployed on Vercel's free tier:
- ✅ Free hosting
- ✅ Automatic HTTPS
- ✅ Automatic deployments
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments

MongoDB Atlas free tier:
- ✅ 512MB storage
- ✅ Shared cluster
- ✅ Perfect for getting started

---

## Next Steps After Deployment

1. ✅ Test all features thoroughly
2. ✅ Change default admin password
3. ✅ Set up custom domain (optional)
4. ✅ Configure email notifications
5. ✅ Monitor usage and logs
6. ✅ Set up automatic deployments (connect to Git)

---

## Git Integration (Recommended)

### Connect to GitHub

1. Push code to GitHub repository
2. In Vercel dashboard: "Import Project"
3. Select your GitHub repo
4. Vercel auto-deploys on every push!

**Benefits:**
- Automatic deployments on push
- Preview deployments for PRs
- Rollback to previous versions
- Team collaboration

---

## 🎊 You're Ready to Deploy!

Follow the steps above and your Laundry POS System will be live in minutes!

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- MongoDB Docs: https://docs.mongodb.com/
- Project Documentation: See other .md files

**Status**: ✅ Ready to Deploy
**Time**: ~5 minutes total
**Cost**: FREE (hobby tier)

