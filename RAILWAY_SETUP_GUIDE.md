# 🚂 Railway Deployment - Detailed Setup Guide

**Recommended Platform:** Railway  
**Why?** Easiest, best free tier, full-stack support  
**Time:** 5-10 minutes  
**Cost:** Free (with $5 credit)

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before starting, ensure:

- [ ] GitHub account created
- [ ] CrypTalk code pushed to GitHub
- [ ] `.env` files are in `.gitignore`
- [ ] No sensitive keys in code
- [ ] `README.md` looks good
- [ ] All tests passing locally

---

## 🎯 STEP 1: CREATE RAILWAY ACCOUNT

### Method A: GitHub Sign-up (Recommended)

1. Go to: https://railway.app
2. Click **"Sign up"** button
3. Click **"Continue with GitHub"**
4. GitHub will ask for authorization
5. Click **"Authorize Railway"**
6. Choose username
7. Click **"Next"**
8. ✅ Account created!

### Method B: Email Sign-up

1. Go to: https://railway.app
2. Click **"Sign up"**
3. Enter email
4. Create password
5. Verify email
6. ✅ Account created!

---

## 🏗️ STEP 2: CREATE NEW PROJECT

### Navigate to Dashboard

1. After login, you'll see Railway dashboard
2. Click **"+ New Project"** button (top right)
3. You'll see options:
   - Deploy from GitHub repo ← **Select this**
   - Deploy from template
   - Create empty project

### Connect GitHub Repository

1. Click **"Deploy from GitHub repo"**
2. Search for: `Secure-Chat-WebAuthn`
3. Click on repository in results
4. Click **"Connect repository"**
5. Railway asks: *"Authorize railway to access this repository?"*
6. Click **"Authorize"**
7. ✅ Repository connected!

---

## 🗄️ STEP 3: ADD MONGODB DATABASE

### Method 1: Railway Marketplace (Easiest)

1. In Railway dashboard, click **"Add Service"** (blue button)
2. Click **"Add from Marketplace"**
3. Search: `mongodb`
4. Click **"MongoDB"** in results
5. Click **"Add"**
6. Railway automatically:
   - ✅ Creates MongoDB instance
   - ✅ Sets up connection string
   - ✅ Initializes database
7. Wait ~1 minute for setup...
8. ✅ MongoDB ready!

### Method 2: MongoDB Atlas (Alternative)

If you want external MongoDB:

1. Go to: https://www.mongodb.com/cloud/atlas
2. Create account
3. Create cluster (M0 free tier)
4. Get connection string
5. In Railway, add environment variable:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/cryptalk
   ```

**Recommendation:** Use Railway Marketplace (simpler)

---

## ⚙️ STEP 4: CONFIGURE BACKEND SERVICE

### Access Backend Environment Variables

1. In Railway dashboard, click **"Backend"** service
2. Click **"Variables"** tab (should show empty)
3. You'll see input box for variables

### Add Environment Variables

**Copy each line below and paste into Railway:**

```
NODE_ENV=production
JWT_SECRET=change-me-to-a-random-32-char-string
FRONTEND_URL=${{ services.frontend.public_url }}
CORS_ORIGIN=${{ services.frontend.public_url }}
PORT=5000
```

**For MongoDB (auto-connected):**
```
MONGODB_URI=${{ services.mongodb.connectionString }}
```

**If using Groq AI (optional):**
```
GROQ_API_KEY=your-groq-api-key-here
```

### Save Variables

1. For each variable, click **"Add"**
2. Type key: `NODE_ENV`
3. Type value: `production`
4. Press **Enter**
5. Repeat for all variables
6. ✅ All variables saved!

### Generate JWT Secret

```powershell
# Run this in PowerShell to generate random string:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Output will be something like: aBcDeFgHiJkLmNoPqRsT1234567890uV

# Use this as JWT_SECRET value
```

---

## 🎨 STEP 5: CONFIGURE FRONTEND SERVICE

### Click Frontend Service

1. In Railway, click **"Frontend"** service
2. Click **"Variables"** tab
3. Add variables:

```
VITE_API_URL=${{ services.backend.public_url }}/api
VITE_ENV=production
```

### Configure Build Settings

1. Click **"Settings"** tab
2. **Build Command:** 
   ```
   cd frontend && npm run build
   ```
3. **Start Command:** (leave empty for static)
4. **Root Directory:** 
   ```
   frontend/dist
   ```
5. Click **"Save"**

---

## 🚀 STEP 6: DEPLOY APPLICATION

### Automatic Deployment

Railway automatically deploys when:
1. You push to GitHub main branch
2. Changes detected in repository
3. Build + deploy starts automatically

### Manual Trigger

To force deploy:

```powershell
# Make small change
echo "# Updated" >> README.md

# Push to GitHub
git add .
git commit -m "chore: trigger railway deployment"
git push origin main

# Railway detects push and auto-deploys
```

### Watch Deployment

1. Go to Railway dashboard
2. Click **"Deployments"** tab
3. You'll see live deployment logs:
   ```
   ✅ Cloning repository...
   ✅ Installing dependencies...
   ✅ Building application...
   ✅ Starting services...
   ✅ Deployment successful!
   ```

### Deployment Time

- Backend: ~5-7 minutes
- Frontend: ~3-5 minutes
- MongoDB: ~2 minutes
- **Total:** ~10-12 minutes ⏱️

---

## 🔗 STEP 7: GET YOUR URLS

### Backend URL

1. In Railway, click **"Backend"** service
2. Click **"Deployments"** tab
3. Look for **"Deployment URL"**
4. Click to copy
5. Example: `https://cryptalk-api-prod-xyz.railway.app`

### Frontend URL

1. In Railway, click **"Frontend"** service
2. Click **"Deployments"** tab
3. Look for **"Deployment URL"**
4. Click to copy
5. Example: `https://cryptalk-chat-prod-xyz.railway.app`

### Test URLs

```powershell
# Backend health check
curl https://cryptalk-api-prod-xyz.railway.app/api/health

# Should return:
# {"status":"ok"}

# Frontend
# Open in browser: https://cryptalk-chat-prod-xyz.railway.app
# Should show CrypTalk login page
```

---

## 🧪 STEP 8: TEST DEPLOYMENT

### 1. Test Backend API

```powershell
# Health check
Invoke-WebRequest -Uri "https://your-api-url/api/health" -Method GET

# Get users (should be empty)
Invoke-WebRequest -Uri "https://your-api-url/api/users" -Method GET
```

### 2. Test Frontend

1. Open: `https://your-frontend-url` in browser
2. You should see:
   - ✅ CrypTalk login page
   - ✅ Biometric authentication option
   - ✅ Responsive design

### 3. Test Full Flow

1. Click **"Register"**
2. Enter username & email
3. Click **"Register with Biometric"**
4. Follow WebAuthn flow
5. Create another user
6. Send encrypted message
7. ✅ Message should appear (decrypted)

### 4. Check Logs

If something doesn't work:

1. Railway dashboard → Backend service
2. Click **"Logs"** tab
3. Look for error messages
4. Common issues:
   - ❌ `Cannot connect to MongoDB` → Check MONGODB_URI
   - ❌ `JWT_SECRET not set` → Add JWT_SECRET variable
   - ❌ `CORS error` → Check CORS_ORIGIN variable

---

## 💾 STEP 9: CONFIGURE PERSISTENT STORAGE (Optional)

### Why?

By default, Railway stores files in memory. If service restarts, data is lost.

### Setup PostgreSQL (Alternative to MongoDB)

1. Click **"Add Service"**
2. Click **"Add from Marketplace"**
3. Search: `postgres`
4. Click **"PostgreSQL"**
5. Railway auto-creates database
6. Connection string available in MongoDB service

### Volumes (for file storage)

1. Click **"Backend"** service
2. Click **"Settings"** tab
3. Scroll to **"Volumes"**
4. Click **"Add Volume"**
5. Mount path: `/app/uploads`
6. Size: `10GB` (free tier)
7. ✅ File storage ready!

---

## 🔒 STEP 10: SETUP DOMAIN (Optional)

### Add Custom Domain

1. Click **"Frontend"** service
2. Click **"Settings"** tab
3. Scroll to **"Domains"**
4. Click **"+ Add Custom Domain"**
5. Enter: `mycryptak.com`
6. Click **"Add"**
7. Railway shows DNS instructions
8. Update DNS at your domain provider
9. Wait 5-10 minutes for DNS propagation
10. ✅ Custom domain active!

### Use Railway Subdomain (Automatic)

- Railway gives you subdomain automatically
- Example: `cryptalk-chat.railway.app`
- No configuration needed!
- Perfect for portfolio 👌

---

## 📊 MONITORING & LOGS

### View Logs

1. Click service (Backend/Frontend)
2. Click **"Logs"** tab
3. See real-time logs as users interact
4. Search for errors

### Memory Usage

1. Click service
2. Click **"Analytics"** tab
3. See CPU, memory, network usage
4. Current free tier: 512MB RAM

### Costs

1. Dashboard → **"Usage"** (top right)
2. See monthly usage
3. See breakdown by service
4. Current credit: $5/month
5. After credit expires: Pay-as-you-go (~$0.25/GB memory)

---

## 🔄 CONTINUOUS DEPLOYMENT

### How it Works

1. You push code to GitHub
2. GitHub sends webhook to Railway
3. Railway:
   - ✅ Clones latest code
   - ✅ Installs dependencies
   - ✅ Runs build
   - ✅ Deploys new version
   - ✅ Restarts services
   - ✅ Keeps data (MongoDB persists)

### Update Workflow

```powershell
# Make changes locally
# Edit code...

# Commit
git add .
git commit -m "feat: add new feature"

# Push
git push origin main

# Railway auto-deploys!
# Check deployment in Railway dashboard
```

---

## 🆘 TROUBLESHOOTING

### ❌ Frontend shows blank page

**Fix:**
1. Check browser console (F12) for errors
2. Check if VITE_API_URL is correct
3. Check backend health: `https://api-url/api/health`
4. Check CORS_ORIGIN in backend variables

**Solution:**
```powershell
# Update frontend variables
# VITE_API_URL should be: https://backend-url/api

# Redeploy
git add .
git commit -m "fix: update api url"
git push origin main
```

### ❌ Backend returns 500 error

**Fix:**
1. Click Backend service → Logs
2. Look for error message
3. Common causes:
   - Missing environment variable
   - MongoDB connection failed
   - JWT_SECRET not set

**Solution:**
```powershell
# Add missing variables in Railway
# Check MongoDB connection:
# MONGODB_URI should be: ${{ services.mongodb.connectionString }}

# Redeploy
git push origin main
```

### ❌ Database connection failed

**Fix:**
1. Check MongoDB is running in Railway
2. Check MONGODB_URI variable is correct
3. Ensure backend can reach MongoDB

**Solution:**
```powershell
# In Railway Backend service:
# Add variable:
# MONGODB_URI=${{ services.mongodb.connectionString }}

# Redeploy
git push origin main
```

### ❌ Deployment stuck/hanging

**Fix:**
1. Cancel deployment
2. Check logs for what's hanging
3. Usually npm install timeout

**Solution:**
```powershell
# Delete node_modules locally
rm -r backend/node_modules
rm -r frontend/node_modules

# Update lock files
git add .
git commit -m "chore: regenerate lock files"
git push origin main

# Railway will reinstall fresh
```

---

## 📈 AFTER DEPLOYMENT

### Share Your Project

**On LinkedIn:**
```
🚀 Just deployed CrypTalk - Secure Encrypted Chat Platform!

🔐 Features:
✅ WebAuthn passwordless auth
✅ NaCl end-to-end encryption  
✅ Real-time messaging
✅ Full test coverage
✅ GitHub Actions CI/CD
✅ Docker containerized

Live: [frontend-url]
GitHub: [github-url]

Built with: React, Node.js, MongoDB, Socket.IO
Deployed on: Railway

#Portfolio #WebDev #Security
```

**Update README.md:**
```markdown
## 🚀 Live Demo

- **Frontend:** https://cryptalk-chat.railway.app
- **API:** https://cryptalk-api.railway.app
- **GitHub:** https://github.com/yourusername/Secure-Chat-WebAuthn

## 🏗️ Deployment

Deployed on **Railway** with automatic GitHub Actions CI/CD.
Auto-deploys on every push to main branch.
```

### Next Steps

1. ✅ Project #1 deployed (CrypTalk)
2. ⏳ Build Project #2
3. ⏳ Deploy Project #2
4. ⏳ Build 18 more projects
5. 🎯 Create portfolio website linking all projects

---

## 💡 QUICK TIPS

### Use Railway CLI (Optional)

```powershell
# Install
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs

# View variables
railway variables

# Redeploy
railway up
```

### Monitor Performance

1. Railway dashboard → Analytics
2. Watch CPU/memory during usage
3. Optimize if hitting limits:
   - Compress images
   - Optimize database queries
   - Enable caching

### Scale Services

1. Click service
2. Click **"Settings"**
3. **CPU:** Upgrade from shared to dedicated
4. **Memory:** Increase if needed
5. Click **"Save"**

---

## 🎉 SUCCESS INDICATORS

After deployment, you should have:

- ✅ GitHub repository with all code
- ✅ Live frontend URL (accessible in browser)
- ✅ Live API URL (responds to requests)
- ✅ WebAuthn login working
- ✅ Encrypted messaging working
- ✅ MongoDB storing data
- ✅ Logs showing no errors
- ✅ Portfolio piece to showcase

---

**Status:** 🟢 READY TO DEPLOY  
**Time:** 10-15 minutes total  
**Cost:** FREE  

**Railway Documentation:** https://docs.railway.app  
**Support:** https://railway.app/support

---

**Next:** Share on LinkedIn, Twitter, and GitHub! 🚀
