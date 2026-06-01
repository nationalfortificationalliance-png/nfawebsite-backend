# Deploying Strapi Backend to Railway

## Prerequisites
- Railway account (https://railway.app)
- Railway CLI (optional): `npm install -g @railway/cli`

## Deployment Steps

### Option 1: Deploy via Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**
   - Visit https://railway.app
   - Click "New Project"

2. **Add PostgreSQL Database**
   - Click "Add Service" → "Database" → "PostgreSQL"
   - Railway will automatically create a PostgreSQL instance and set the `DATABASE_URL` environment variable

3. **Deploy Backend**
   - Click "Add Service" → "GitHub Repo"
   - Select your repository
   - Set the root directory to `wfp-nfp-backend`

4. **Configure Environment Variables**
   In the Railway dashboard, add these environment variables:
   
   ```
   NODE_ENV=production
   HOST=0.0.0.0
   PORT=1337
   DATABASE_CLIENT=postgres
   DATABASE_SSL=false
   ```

   **Generate secure secrets** (use a password generator or run these commands locally):
   ```bash
   # Generate random secrets
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

   Add these with generated values:
   ```
   APP_KEYS=<generated-key-1>,<generated-key-2>,<generated-key-3>,<generated-key-4>
   API_TOKEN_SALT=<generated-salt>
   ADMIN_JWT_SECRET=<generated-secret>
   TRANSFER_TOKEN_SALT=<generated-salt>
   JWT_SECRET=<generated-secret>
   ```

5. **Deploy**
   - Railway will automatically detect the `railway.json` configuration
   - The build and deployment will start automatically
   - Wait for the deployment to complete

6. **Access Your Strapi Admin**
   - Click on your service in Railway
   - Copy the public URL (e.g., https://your-app.railway.app)
   - Visit `https://your-app.railway.app/admin`
   - Create your first admin user

### Option 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Link to existing project (if already created)
railway link

# Add PostgreSQL
railway add --database postgres

# Set environment variables
railway variables set NODE_ENV=production
railway variables set DATABASE_CLIENT=postgres
railway variables set HOST=0.0.0.0
railway variables set PORT=1337
# ... add all other environment variables

# Deploy
railway up
```

## Post-Deployment

### 1. Configure CORS (Important!)
Update `config/middlewares.ts` to allow your frontend domain:

```typescript
export default [
  // ...
  {
    name: 'strapi::cors',
    config: {
      origin: ['https://your-frontend-domain.com', 'http://localhost:3000'],
    },
  },
];
```

### 2. Update Frontend API URL
In your Next.js frontend, update the API URL to point to your Railway backend:

```typescript
// In your frontend .env or .env.production
NEXT_PUBLIC_API_URL=https://your-app.railway.app
```

### 3. Test the Deployment
- Visit your admin panel: `https://your-app.railway.app/admin`
- Test API endpoints: `https://your-app.railway.app/api/<content-type>`

## Troubleshooting

### Build Fails
- Check Railway logs in the dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version matches `engines` in package.json

### Database Connection Issues
- Ensure `DATABASE_CLIENT=postgres` is set
- Check that PostgreSQL service is running
- Verify `DATABASE_URL` is automatically set by Railway

### Application Won't Start
- Check that `PORT=1337` and `HOST=0.0.0.0` are set
- Review Railway deployment logs
- Ensure all required environment variables are set

## Important Notes

1. **Database**: Railway's ephemeral filesystem means SQLite won't persist data. Always use PostgreSQL in production.

2. **Environment Variables**: Never commit real secrets to git. Use Railway's environment variable management.

3. **Media Files**: For production, consider using a cloud storage provider (AWS S3, Cloudinary) for uploaded media files, as Railway's filesystem is ephemeral.

4. **Backups**: Regularly backup your PostgreSQL database using Railway's backup features.

## Next Steps

- [ ] Configure cloud storage for media uploads (recommended: Cloudinary or AWS S3)
- [ ] Set up custom domain in Railway
- [ ] Configure SSL certificate (automatic with Railway)
- [ ] Set up monitoring and alerts
- [ ] Configure automated backups
