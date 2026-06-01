# Railway Deployment Checklist ✅

Use this checklist to ensure your Strapi backend is properly deployed to Railway.

## Prerequisites

- [ ] Railway account created at https://railway.app
- [ ] GitHub repository set up: `git@github.com:nationalfortificationalliance-png/nfawebsite-backend.git`
- [ ] Code pushed to GitHub

## Step 1: Create Railway Project

- [ ] Go to https://railway.app/new
- [ ] Click **"Deploy from GitHub repo"**
- [ ] Select repository: `nationalfortificationalliance-png/nfawebsite-backend`
- [ ] Railway creates the project

## Step 2: Add PostgreSQL Database

- [ ] In Railway project, click **"+ New"**
- [ ] Select **"Database"** → **"Add PostgreSQL"**
- [ ] Wait for PostgreSQL to provision (~30 seconds)

## Step 3: Link Database to Strapi

- [ ] Go to **Strapi service** → **Variables** tab
- [ ] Find `DATABASE_URL` variable
- [ ] **Delete** it if it shows `postgresql://postgres:password@hostname:5432/railway`
- [ ] Click **"+ New Variable"** → **"Add Reference"**
- [ ] Variable name: `DATABASE_URL`
- [ ] Reference: Select **PostgreSQL service**
- [ ] Variable to reference: `DATABASE_URL` or `POSTGRES_URL`
- [ ] Click **Save**

**OR** manually copy the real connection string from PostgreSQL service.

## Step 4: Add Volume for File Uploads

- [ ] Go to **Strapi service** → **Settings** tab
- [ ] Scroll to **"Volumes"** section
- [ ] Click **"+ New Volume"**
- [ ] Configure:
  - **Mount Path**: `/app/public/uploads`
  - **Size**: 5GB (or your preferred size)
- [ ] Click **"Add"**

## Step 5: Set Environment Variables

Go to **Strapi service** → **Variables** tab and add/update:

### Required Variables

- [ ] `NODE_ENV=production`
- [ ] `HOST=0.0.0.0`
- [ ] `PORT=1337`
- [ ] `DATABASE_CLIENT=postgres`
- [ ] `DATABASE_SSL=false`
- [ ] `DATABASE_URL` (reference to PostgreSQL - see Step 3)

### Security Secrets

Generate secrets locally:
```bash
node generate-secrets.js
```

Then add to Railway:

- [ ] `APP_KEYS=` (4 comma-separated keys)
- [ ] `API_TOKEN_SALT=` (generated secret)
- [ ] `ADMIN_JWT_SECRET=` (generated secret)
- [ ] `TRANSFER_TOKEN_SALT=` (generated secret)
- [ ] `JWT_SECRET=` (generated secret)
- [ ] `ENCRYPTION_KEY=` (generated secret)

### Optional Variables

- [ ] `FRONTEND_URL=` (your Next.js frontend URL for CORS)

## Step 6: Deploy

- [ ] Click **"Deploy"** in Railway
- [ ] Wait for build to complete (~2-5 minutes)
- [ ] Check **Deploy Logs** for errors

## Step 7: Verify Deployment

- [ ] Go to Strapi service → **Settings** → **Networking**
- [ ] Copy the public URL (e.g., `https://nfawebsite-backend-production.up.railway.app`)
- [ ] Visit `https://your-url.railway.app/admin`
- [ ] Create your first admin user
- [ ] Login to Strapi admin panel

## Step 8: Test File Uploads

- [ ] In Strapi admin, go to **Media Library**
- [ ] Upload a test image
- [ ] Click **"Deploy"** to trigger a redeployment
- [ ] After redeploy, check Media Library - image should still be there ✅

## Step 9: Test API Endpoints

- [ ] Visit `https://your-url.railway.app/api/news-events` (or any content type)
- [ ] Should return JSON data (might be empty array if no content yet)
- [ ] No errors = API is working ✅

## Common Issues & Solutions

### ❌ Error: `getaddrinfo ENOTFOUND hostname`
**Cause**: DATABASE_URL is set to placeholder  
**Fix**: Follow Step 3 to properly link PostgreSQL

### ❌ Error: `getaddrinfo ENOTFOUND base`
**Cause**: DATABASE_URL is malformed  
**Fix**: Use Railway's variable reference (Step 3)

### ❌ Build fails
**Cause**: Dependencies or Node version issue  
**Fix**: Check Railway build logs, ensure Node version matches `package.json` engines

### ❌ Files disappear after deploy
**Cause**: Volume not mounted  
**Fix**: Verify mount path in Step 4 is exactly `/app/public/uploads`

### ❌ CORS errors from frontend
**Cause**: FRONTEND_URL not set  
**Fix**: Add FRONTEND_URL variable with your frontend domain

## Post-Deployment

### Update Frontend
In your Next.js frontend, update the API URL:

```env
# .env.production or .env
NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app
```

### Set Up Custom Domain (Optional)
- [ ] Go to Strapi service → **Settings** → **Networking**
- [ ] Click **"Add Custom Domain"**
- [ ] Follow Railway's instructions to add DNS records

### Enable Monitoring
- [ ] Check **Metrics** tab regularly
- [ ] Set up monitoring/alerting if needed
- [ ] Monitor volume usage (Settings → Volumes)

## Security Checklist

- [ ] All secret environment variables are set (not placeholders)
- [ ] `.env` file is in `.gitignore` (never committed)
- [ ] CORS is configured for your frontend domain only
- [ ] Admin panel has strong password
- [ ] API tokens are properly secured

## Backup Strategy

- [ ] Set up regular PostgreSQL backups via Railway
- [ ] Document how to export/import Strapi data
- [ ] Consider periodic volume snapshots

---

## 🎉 Deployment Complete!

Once all checkboxes are complete, your Strapi backend is fully deployed on Railway!

**Your Strapi Admin**: `https://your-railway-url.railway.app/admin`  
**Your API Base URL**: `https://your-railway-url.railway.app/api`

## Next Steps

1. Configure your content types in Strapi admin
2. Set up API permissions (Settings → Roles → Public)
3. Connect your Next.js frontend to the Railway backend
4. Test the full application flow

---

## Useful Commands

```bash
# Push code to GitHub
git push origin main

# Generate new secrets
node generate-secrets.js

# Test API locally
npm run develop

# Build for production
npm run build
npm start
```

## Documentation References

- [Railway Deployment Guide](RAILWAY_DEPLOYMENT.md)
- [Volume Setup Guide](RAILWAY_VOLUME_SETUP.md)
- [Cloudinary Alternative](CLOUDINARY_SETUP.md) (if you decide to switch)
