# Environment Variables Setup

## Backend Environment Variables (Vercel)

Set these in your backend Vercel project settings:

### Required Variables

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/laundry-pos?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Environment
NODE_ENV=production

# Frontend URL (Optional - code now auto-allows *.vercel.app)
FRONTEND_URL=https://fox-fold-laundary-pos.vercel.app

# Port (Optional - Vercel handles this)
PORT=5000
```

### Optional Variables (if using these features)

```env
# Email Service (if using email notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# SMS Service (Twilio - if using SMS notifications)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# File Upload
MAX_FILE_SIZE=10485760
```

---

## Frontend Environment Variables (Vercel)

Set these in your frontend Vercel project settings:

### Required Variables

```env
# API Configuration
VITE_API_URL=https://fox-fold-laundary-pos-test1.vercel.app/api
```

### Optional Variables

```env
# Application Settings
VITE_APP_NAME=Fold Fox Laundry POS
VITE_APP_VERSION=1.0.0
```

---

## Local Development (.env files)

### Backend `.env` (Laundary-POS-System-Backend/.env)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/laundry-pos
# OR use MongoDB Atlas for development too
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/laundry-pos-dev

# JWT
JWT_SECRET=dev-secret-key-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Environment
NODE_ENV=development
PORT=5000

# CORS - Frontend URLs
FRONTEND_URL=http://localhost:5173,http://localhost:3000
```

### Frontend `.env` (Laundary-POS-System-Frontend/.env)

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
```

---

## How to Set Environment Variables in Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and login
2. Select your project (backend or frontend)
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)
5. Click **Add New**
6. Enter:
   - **Key:** Variable name (e.g., `MONGODB_URI`)
   - **Value:** Variable value (e.g., your MongoDB connection string)
   - **Environments:** Select where to use (Production, Preview, Development)
7. Click **Save**
8. **Important:** Redeploy your application after adding variables!

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set environment variable
vercel env add MONGODB_URI

# You'll be prompted to enter the value and select environments
```

---

## Important Notes

1. **Never commit `.env` files** to Git (they're in `.gitignore`)
2. **Always redeploy** after changing environment variables
3. **Use different values** for development and production
4. **Keep secrets secure** - don't share them in public repositories
5. **JWT secrets should be long and random** (minimum 32 characters)

---

## Generating Secure Secrets

### Using Node.js

```javascript
// Run in Node.js console
require('crypto').randomBytes(32).toString('hex')
```

### Using Online Tool

Visit: https://www.grc.com/passwords.htm

### Using OpenSSL

```bash
openssl rand -base64 32
```

---

## Testing Environment Variables

### Backend

Create a test endpoint (already exists):
```
GET https://fox-fold-laundary-pos-test1.vercel.app/api/health
```

Response should show:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-...",
  "environment": "production"
}
```

### Frontend

Check in browser console:
```javascript
console.log(import.meta.env.VITE_API_URL)
```

---

## Troubleshooting

### "Environment variable not found"
- **Solution:** Make sure you redeployed after adding the variable
- Variables are loaded at build time, not runtime

### "Database connection failed"
- **Solution:** Check MongoDB Atlas network access
- Add `0.0.0.0/0` to IP whitelist
- Verify connection string format

### "JWT error" / "Invalid token"
- **Solution:** Make sure `JWT_SECRET` matches between all instances
- Ensure secrets are set in production environment

---

## Current Deployment Configuration

| Service | URL | Required Variables |
|---------|-----|-------------------|
| **Frontend** | https://fox-fold-laundary-pos.vercel.app | `VITE_API_URL` |
| **Backend** | https://fox-fold-laundary-pos-test1.vercel.app | `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV` |

---

## Next Steps

1. ✅ Set backend environment variables in Vercel
2. ✅ Set frontend environment variables in Vercel
3. ✅ Commit and push the updated code (CORS fix)
4. ✅ Redeploy both frontend and backend
5. ✅ Test login functionality
6. ✅ Monitor Vercel logs for any errors

