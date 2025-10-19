# Quick Start: Create Admin User

## 🚀 Quick Setup (3 Steps)

### Step 1: Set Up Environment Variables

If you don't have a `.env` file, create one:

```bash
# Copy the template
cp ENV_TEMPLATE.txt .env

# Edit .env and add your MongoDB URI
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
```

### Step 2: Run the Admin Creation Script

```bash
npm run seed:admin
```

**OR**

```bash
node scripts/seedAdmin.js
```

### Step 3: Login

Use these default credentials:
- **Email:** `admin@laundry.com`
- **Password:** `admin123`

⚠️ **Change the password immediately after first login!**

---

## 📝 Customize Admin Details

To change the default admin email or password, edit `scripts/seedAdmin.js`:

```javascript
const adminData = {
  name: 'Your Name',              // Change this
  email: 'your-email@domain.com', // Change this
  password: 'YourSecurePassword', // Change this
  role: 'admin',
  isActive: true,
  phoneNumber: '1234567890'
};
```

Then run the script again.

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` |
| "MongoDB connection failed" | Check your `.env` file has correct `MONGODB_URI` |
| "Admin already exists" | Change the email in `scripts/seedAdmin.js` or use existing admin |

---

For complete documentation, see **ADMIN_USER_GUIDE.md**



