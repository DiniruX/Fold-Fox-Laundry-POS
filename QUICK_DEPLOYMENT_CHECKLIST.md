# ⚡ Quick Deployment Checklist

Use this as a quick reference when deploying to Vercel.

---

## 🎯 Your Project Info

**Repository:** `PasinduM0056/Fox-Fold-Laundary-POS`  
**Branch:** `main`

**Your Current URLs:**
- Frontend: `fox-fold-laundary-pos-h9z9.vercel.app` (or your new deployment)
- Backend: `fox-fold-laundary-pos.vercel.app` (or your new deployment)

---

## 📦 Backend Deployment

### Vercel Settings:
- [ ] **Root Directory:** `Laundary-POS-System-Backend` ⚠️ CRITICAL
- [ ] **Framework:** Other
- [ ] **Build Command:** (leave empty)
- [ ] **Output Directory:** (leave empty)

### Environment Variables:
```
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<32+ random characters>
JWT_REFRESH_SECRET=<32+ different random characters>
```

### Verify:
- [ ] Visit: `https://your-backend.vercel.app/api/health`
- [ ] Check: `"environment": "production"`
- [ ] Check: `"corsEnabled": true`

---

## 🎨 Frontend Deployment

### Vercel Settings:
- [ ] **Root Directory:** `Laundary-POS-System-Frontend` ⚠️ CRITICAL
- [ ] **Framework:** Vite
- [ ] **Build Command:** `npm run build`
- [ ] **Output Directory:** `dist`

### Environment Variables:
```
VITE_API_URL=https://your-backend-name.vercel.app/api
```

⚠️ **MUST be your BACKEND URL, not frontend URL!**

### Verify:
- [ ] Visit your frontend URL
- [ ] Go to `/login`
- [ ] Login works without errors
- [ ] No CORS errors in console

---

## 🔄 Git Commands

```bash
# 1. Check status
git status

# 2. Add all changes
git add .

# 3. Commit
git commit -m "Production deployment ready"

# 4. Push to GitHub (triggers auto-deploy)
git push origin main
```

---

## 🐛 Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error | Check Root Directory = `Laundary-POS-System-Backend` |
| Mixed content | Change `VITE_API_URL` from HTTP to HTTPS |
| 404 error | Check `VITE_API_URL` ends with `/api` |
| Env vars not working | Redeploy after changing variables |
| Database error | Check MongoDB URI and IP whitelist |

---

## ✅ Final Checklist

- [ ] Code pushed to GitHub
- [ ] Backend Root Directory correct
- [ ] Backend environment variables set
- [ ] Backend deployed successfully
- [ ] Backend health endpoint works
- [ ] Frontend Root Directory correct
- [ ] Frontend environment variable set (with backend URL!)
- [ ] Frontend deployed successfully
- [ ] Login works
- [ ] No console errors

---

**If everything is checked ✅ you're ready to go! 🚀**

