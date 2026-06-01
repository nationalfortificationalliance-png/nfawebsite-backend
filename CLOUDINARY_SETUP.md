# Cloudinary Setup for File Uploads

## Why Cloudinary?

Railway uses ephemeral filesystems - any files uploaded to `/public/uploads` will be deleted on redeploy. Cloudinary provides:

- ✅ Persistent cloud storage
- ✅ Free tier (25GB storage, 25GB bandwidth/month)
- ✅ Built-in CDN for fast global delivery
- ✅ Image transformations (resize, crop, optimize)
- ✅ No volume storage costs
- ✅ Automatic backups

## Setup Steps

### 1. Create Cloudinary Account

1. Go to https://cloudinary.com/users/register_free
2. Sign up for a free account
3. Verify your email

### 2. Get API Credentials

1. After login, go to your **Dashboard**
2. You'll see your credentials:
   ```
   Cloud Name: your-cloud-name
   API Key: 123456789012345
   API Secret: abcdefghijklmnopqrstuvwxyz123
   ```

### 3. Add to Railway Environment Variables

In your Railway Strapi service **Variables** tab, add:

```
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_KEY=123456789012345
CLOUDINARY_SECRET=abcdefghijklmnopqrstuvwxyz123
```

**Important:** Replace with your actual values from Cloudinary dashboard!

### 4. Deploy

After adding the variables, click **Deploy** in Railway. Your uploads will now go to Cloudinary!

## Testing

1. Access your Strapi admin: `https://your-railway-url.railway.app/admin`
2. Go to **Media Library**
3. Upload a test image
4. Check your Cloudinary dashboard - you should see the image there
5. The image URL will be something like: `https://res.cloudinary.com/your-cloud-name/image/upload/...`

## Alternative: AWS S3

If you prefer AWS S3:

```bash
npm install @strapi/provider-upload-aws-s3
```

Then update `config/plugins.ts` with S3 configuration.

## Alternative: DigitalOcean Spaces

If you prefer DO Spaces:

```bash
npm install @strapi/provider-upload-aws-s3  # Same provider works for DO Spaces
```

Configure with Spaces endpoint in `config/plugins.ts`.

## Volume Option (Not Recommended)

If you absolutely want to use Railway volumes instead:

1. Go to Strapi service → Settings → Volumes
2. Add volume with mount path: `/app/public/uploads`
3. Size: 5-10GB to start

**Downsides:**
- Costs money beyond free tier
- No CDN (slower for users)
- No automatic optimization
- Manual backups required
- Size limits

## Cost Comparison

| Solution | Free Tier | After Free Tier |
|----------|-----------|-----------------|
| **Cloudinary** | 25GB storage, 25GB bandwidth/month | $0.0008/GB storage/month |
| **AWS S3** | 5GB for 12 months | $0.023/GB storage + transfer |
| **Railway Volume** | Limited | ~$0.25/GB/month |

**Recommendation:** Start with Cloudinary free tier. It's generous for most small-to-medium apps.
