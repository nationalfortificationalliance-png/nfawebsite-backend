# Railway Volume Setup for File Uploads

## ✅ You've Configured Railway Volume

Since you're using Railway's volume storage at `/app/public/uploads`, your uploaded files (images, PDFs, etc.) will persist across deployments.

## Verification Checklist

### 1. Confirm Volume is Added in Railway

1. Go to your Railway project dashboard
2. Click on your **Strapi service** (nfawebsite-backend)
3. Go to **Settings** tab
4. Scroll to **Volumes** section
5. Verify you have a volume with:
   - **Mount Path**: `/app/public/uploads`
   - **Size**: Whatever you chose (e.g., 5GB, 10GB)

### 2. Strapi Configuration

Strapi uses **local file storage by default**, which will now use the volume. No additional plugin needed!

The configuration is already set in `config/plugins.ts` to use local storage.

### 3. After Deployment

Once deployed, test the upload:

1. Access Strapi admin: `https://your-railway-url.railway.app/admin`
2. Go to **Media Library**
3. Upload a test image
4. **Redeploy** your app (to test persistence)
5. Go back to Media Library - the image should still be there ✅

## Volume vs Cloudinary Comparison

| Feature | Railway Volume (Your Choice) | Cloudinary |
|---------|------------------------------|------------|
| **Setup** | ✅ Simple | Requires external account |
| **Cost** | ~$0.25/GB/month | Free tier: 25GB storage |
| **CDN** | ❌ No | ✅ Yes (faster globally) |
| **Persistence** | ✅ Yes | ✅ Yes |
| **Transformations** | ❌ No | ✅ Yes (resize, optimize) |
| **Backups** | Manual | ✅ Automatic |

## Important Notes

### ⚠️ Volume Costs
- Railway volumes cost approximately **$0.25/GB/month**
- Monitor your usage in Railway dashboard
- You can resize the volume if needed

### ⚠️ No CDN
- Files are served from Railway's servers (slower than CDN)
- For global audiences, Cloudinary might perform better
- For local/regional apps, this is fine

### ⚠️ Backups
- Railway doesn't automatically backup volumes
- Consider periodic manual backups of important files
- You can use Strapi's export feature

## Alternative: Switch to Cloudinary Later

If you want to switch to Cloudinary in the future (for CDN, image optimization, etc.):

1. Install the provider:
   ```bash
   npm install @strapi/provider-upload-cloudinary
   ```

2. Configure in `config/plugins.ts`

3. See `CLOUDINARY_SETUP.md` for full instructions

## Troubleshooting

### Files Disappear After Deploy
- **Cause**: Volume not properly mounted
- **Fix**: Check Settings → Volumes, ensure mount path is exactly `/app/public/uploads`

### "Permission Denied" Errors
- **Cause**: Volume permissions issue
- **Fix**: Usually resolves after first deployment. Redeploy once.

### Running Out of Space
- Go to Settings → Volumes
- You can resize the volume (this may cause brief downtime)

## Current Setup Summary

✅ Volume mount path: `/app/public/uploads`  
✅ Strapi config: Default local provider (no external plugin)  
✅ Persistence: Files survive redeployments  
✅ No environment variables needed for uploads  

Your setup is complete! Files will be stored in the Railway volume.
