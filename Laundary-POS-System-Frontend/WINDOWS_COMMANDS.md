# 🪟 Windows PowerShell Commands for Vite Project

Quick reference for Windows users working with the migrated Vite frontend.

---

## 🚀 Common Commands

### Development
```powershell
# Start development server (Vite will run on port 3000)
npm run dev
# or
npm start
```

### Production
```powershell
# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🧹 Clean Install (If Needed)

When you need to reinstall dependencies from scratch:

```powershell
# Navigate to frontend folder
cd Laundary-POS-System-Frontend

# Remove node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Reinstall dependencies
npm install
```

---

## 📁 File Operations

### Copy Environment File
```powershell
# Copy env.example to .env
copy env.example .env
```

### Remove Build Artifacts
```powershell
# Remove Vite's dist folder
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# Remove old CRA build folder (if it exists)
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
```

### View File Contents
```powershell
# View a file
Get-Content package.json
# or
cat package.json
```

---

## 🔍 Verification Commands

### Check Versions
```powershell
# Check Node version
node --version

# Check npm version
npm --version

# Check Vite version
npx vite --version
```

### Check Installation Status
```powershell
# List installed packages
npm list --depth=0

# Check for outdated packages
npm outdated

# Verify specific package
npm list vite
npm list react
```

---

## 🐛 Troubleshooting Commands

### Check for Errors
```powershell
# Run npm audit
npm audit

# Fix vulnerabilities (use carefully)
npm audit fix

# Check for linting errors (if eslint is configured)
npx eslint src/
```

### Clear Caches
```powershell
# Clear npm cache
npm cache clean --force

# Remove all build artifacts and reinstall
Remove-Item -Recurse -Force node_modules, package-lock.json, dist -ErrorAction SilentlyContinue
npm install
```

---

## 📝 Environment Variables

### Edit .env File
```powershell
# Open in default editor
notepad .env

# Or in VS Code
code .env
```

### Check Environment Variables
```powershell
# View all env vars (in your code, use import.meta.env)
Get-Content .env
```

**Remember:** 
- All environment variables must start with `VITE_`
- Restart dev server after changing `.env`
- Use `import.meta.env.VITE_VARIABLE_NAME` in your code

---

## 🎯 Quick Start Workflow

```powershell
# 1. Navigate to frontend folder
cd "C:\Users\M ZONE PC Solutions\Desktop\MY PROJECTS\CCL Projects\Laundary-POS-System\Laundary-POS-System-Frontend"

# 2. Ensure you have a .env file
if (!(Test-Path .env)) { copy env.example .env }

# 3. Install dependencies (already done!)
# npm install

# 4. Start development server
npm run dev

# 5. Open browser to http://localhost:3000
```

---

## 📦 Package Management

### Install New Package
```powershell
# Install as dependency
npm install package-name

# Install as dev dependency
npm install -D package-name

# Install specific version
npm install package-name@1.2.3
```

### Remove Package
```powershell
npm uninstall package-name
```

### Update Packages
```powershell
# Update all packages (respecting semver)
npm update

# Update specific package
npm update package-name
```

---

## 🔗 Project Structure

```
Laundary-POS-System-Frontend/
├── index.html              ← Root HTML (Vite entry)
├── vite.config.js          ← Vite configuration
├── package.json            ← Dependencies and scripts
├── .env                    ← Environment variables (create from env.example)
├── env.example             ← Environment template
├── tailwind.config.js      ← Tailwind CSS config
├── postcss.config.js       ← PostCSS config
├── src/
│   ├── index.js            ← JavaScript entry point
│   ├── App.js              ← Root component
│   ├── components/         ← React components
│   ├── pages/              ← Page components
│   ├── services/           ← API services
│   └── constants/          ← Constants (includes API_BASE_URL)
├── public/                 ← Static assets
└── dist/                   ← Build output (created after npm run build)
```

---

## ⚠️ Important Notes for Windows Users

### PowerShell vs Command Prompt
- These commands are for **PowerShell** (default in VS Code)
- Command Prompt (`cmd`) uses different syntax
- If using Git Bash, use Unix commands instead

### Common Mistakes
```powershell
# ❌ WRONG (Unix syntax doesn't work in PowerShell)
rm -rf node_modules
cp env.example .env

# ✅ CORRECT (PowerShell syntax)
Remove-Item -Recurse -Force node_modules
copy env.example .env
```

### Path Separators
```powershell
# Windows uses backslashes, but forward slashes usually work too
cd Laundary-POS-System-Frontend   # Works
cd Laundary-POS-System-Frontend/  # Also works
cd "Laundary-POS-System-Frontend" # Best (handles spaces)
```

---

## 🎉 You're All Set!

The migration is complete and dependencies are installed. Just run:

```powershell
npm run dev
```

And visit: **http://localhost:3000** 🚀

---

*For detailed migration information, see `VITE_MIGRATION_GUIDE.md`*

