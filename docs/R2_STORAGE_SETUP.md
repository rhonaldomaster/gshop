# Cloudflare R2 Storage Setup Guide

## Overview

GSHOP uses a flexible storage system that automatically falls back to local storage for development and supports Cloudflare R2 for production deployments.

### Storage Providers

| Provider | Use Case | Auto-Detection |
|----------|----------|----------------|
| **Local Storage** | Development, testing | Used when R2 credentials are not configured |
| **Cloudflare R2** | Production | Used when R2 credentials are present in `.env` |

## How It Works

The system automatically selects the storage provider based on environment variables:

```
if (R2_ACCESS_KEY_ID exists) {
  → Use Cloudflare R2 ✅
} else {
  → Use Local Storage 📁 (development mode)
}
```

### URL Handling

- **R2 (Production)**: Returns absolute URLs → `https://pub-xxxxx.r2.dev/products/image.jpg`
- **Local (Development)**: Returns relative paths → `/uploads/products/image.jpg`

This design allows local development with **ngrok** or other tunneling tools without hardcoding `localhost:3000`.

## Why Cloudflare R2?

### Advantages over Local Storage

| Feature | Local Storage | Cloudflare R2 |
|---------|--------------|---------------|
| Scalability | ❌ Limited by disk | ✅ Unlimited |
| CDN | ❌ No | ✅ Global CDN included |
| Cost | Free | $0.015/GB (~67% cheaper than S3) |
| Egress Fees | N/A | **$0** (vs $0.09/GB on S3) 🔥 |
| Multi-server | ❌ Doesn't work | ✅ Shared storage |
| Backups | ❌ Manual | ✅ Automatic |
| Bandwidth Impact | ❌ Uses API server | ✅ Offloaded to CDN |

### Cost Estimate (for reference)

```
Storage: 100GB × $0.015 = $1.50/month
Requests: 1M reads × $0.0036 = $0.36/month
Egress: Unlimited × $0 = $0/month 🎉

Total: ~$2/month for 100GB + 1M requests
```

## Setup Instructions

### Step 1: Create Cloudflare R2 Account

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage** in the sidebar
3. Click **Create Bucket**
4. Name your bucket: `gshop-products` (or your preferred name)
5. Select a location close to your users
6. Click **Create Bucket**

### Step 2: Generate API Credentials

1. In R2 dashboard, go to **Manage R2 API Tokens**
2. Click **Create API Token**
3. Configure the token:
   - **Token Name**: `gshop-backend`
   - **Permissions**: `Object Read & Write`
   - **TTL**: No expiry (or your preference)
   - **Bucket Restrictions**: Select `gshop-products` bucket
4. Click **Create API Token**
5. **IMPORTANT**: Copy the credentials immediately (shown only once):
   - Access Key ID
   - Secret Access Key
   - Account ID

### Step 3: Enable Public Access

1. Go to your bucket settings
2. Click **Settings** → **Public Access**
3. Enable **Public Access via R2.dev subdomain**
4. Copy the public URL: `https://pub-xxxxx.r2.dev`

### Step 4: Configure Environment Variables

Add these to your `.env` file (backend):

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=gshop-products
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

**Example:**
```bash
R2_ACCOUNT_ID=a1b2c3d4e5f6g7h8i9j0
R2_ACCESS_KEY_ID=1a2b3c4d5e6f7g8h9i0j
R2_SECRET_ACCESS_KEY=AbCdEfGhIjKlMnOpQrStUvWxYz0123456789AbCd
R2_BUCKET_NAME=gshop-products
R2_PUBLIC_URL=https://pub-abcd1234efgh5678.r2.dev
```

### Step 5: Install Dependencies

The R2 SDK is already included in `package.json`:

```bash
cd backend
npm install
```

If you need to install manually:
```bash
npm install @aws-sdk/client-s3
```

### Step 6: Verify Setup

1. Start the backend server:
```bash
cd backend
npm run start:dev
```

2. Check the console logs:
```
✅ Cloudflare R2 storage initialized successfully
🌐 Using Cloudflare R2 for file storage
```

If you see this instead:
```
📁 Local file storage initialized (development mode)
⚠️ R2 credentials not configured. Falling back to local storage.
```

Then R2 credentials are not configured (will use local storage).

3. Test upload via API:
```bash
curl -X POST http://localhost:3000/api/v1/products/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "images=@/path/to/image.jpg"
```

Response:
```json
{
  "urls": [
    "https://pub-xxxxx.r2.dev/products/product-image-1234567890.jpg"
  ],
  "provider": "Cloudflare R2"
}
```

## Development Workflow

### Local Development (No R2)

1. Don't set R2 environment variables
2. Images save to `uploads/products/`
3. URLs returned: `/uploads/products/image.jpg` (relative)
4. Frontend prepends `NEXT_PUBLIC_API_URL`
5. Works with ngrok: `https://abc123.ngrok.io/uploads/products/image.jpg`

### Production Deployment (With R2)

1. Set R2 environment variables in production
2. Images upload to R2 bucket
3. URLs returned: `https://pub-xxxxx.r2.dev/products/image.jpg` (absolute)
4. Served via Cloudflare's global CDN
5. No API server bandwidth usage

## Architecture

### Directory Structure

```
backend/src/
├── common/
│   └── storage/
│       ├── storage.interface.ts      # Common interface
│       ├── storage.service.ts        # Auto-selector service
│       ├── r2-storage.provider.ts    # R2 implementation
│       ├── local-storage.provider.ts # Local implementation
│       └── storage.module.ts         # NestJS module
└── products/
    └── products-upload.service.ts    # Uses StorageService
```

### Code Example

```typescript
// Automatic provider selection
constructor(
  private r2Provider: R2StorageProvider,
  private localProvider: LocalStorageProvider,
) {
  if (this.r2Provider.isAvailable()) {
    this.activeProvider = this.r2Provider;  // Production
  } else {
    this.activeProvider = this.localProvider; // Development
  }
}
```

## Troubleshooting

### Issue: "R2 client not initialized"

**Cause**: Invalid R2 credentials or incorrect configuration.

**Solution**:
1. Verify your `.env` variables are correct
2. Check Account ID format (no spaces)
3. Ensure API token has correct permissions
4. Restart the backend server

### Issue: "Failed to upload file to R2"

**Possible causes**:
- Bucket doesn't exist
- API token expired or revoked
- Network connectivity issues
- Incorrect bucket name

**Solution**:
1. Verify bucket exists in R2 dashboard
2. Check API token is still active
3. Test connectivity: `curl https://[account-id].r2.cloudflarestorage.com`
4. Verify `R2_BUCKET_NAME` matches exactly

### Issue: Images work locally but not in production

**Cause**: Using local storage in production.

**Solution**:
1. Verify R2 env vars are set in production environment
2. Check production logs for: `✅ Cloudflare R2 storage initialized`
3. If using Docker, ensure env vars are passed to container
4. If using Vercel/Heroku, add R2 vars to platform settings

### Issue: Images not accessible (403 or 404)

**Cause**: Public access not enabled on R2 bucket.

**Solution**:
1. Go to R2 dashboard → Your bucket → Settings
2. Enable **Public Access via R2.dev subdomain**
3. Update `R2_PUBLIC_URL` in `.env` with the provided URL
4. Re-upload test image

## Custom Domain (Optional)

### Setup Custom Domain for R2

Instead of `pub-xxxxx.r2.dev`, you can use your own domain:

1. Add a CNAME record in your DNS:
```
cdn.yourdomain.com → pub-xxxxx.r2.dev
```

2. In Cloudflare Dashboard:
   - Go to your R2 bucket
   - Settings → Custom Domains
   - Add `cdn.yourdomain.com`

3. Update `.env`:
```bash
R2_PUBLIC_URL=https://cdn.yourdomain.com
```

Benefits:
- Branded URLs
- Full SSL control
- Better for SEO
- Can enable Cache Rules

## Migration from Local to R2

If you already have images in local storage and want to migrate to R2:

### Option 1: Manual Upload (Small Scale)

```bash
# Install AWS CLI
npm install -g @aws-sdk/client-s3

# Create migration script (see below)
node scripts/migrate-to-r2.js
```

### Option 2: Rclone (Large Scale)

```bash
# Install rclone
brew install rclone  # macOS
# or: apt-get install rclone  # Linux

# Configure rclone for R2
rclone config

# Sync uploads/ to R2
rclone sync uploads/products/ r2:gshop-products/products/
```

### Option 3: Database Update Script

After uploading files to R2, update database URLs:

```sql
-- Update product image URLs
UPDATE products
SET images = ARRAY(
  SELECT regexp_replace(
    unnest(images),
    '^/uploads/products/',
    'https://pub-xxxxx.r2.dev/products/'
  )
)
WHERE images IS NOT NULL;
```

## Security Best Practices

1. **Never commit `.env`** - Already in `.gitignore`
2. **Rotate API tokens** - Every 90 days recommended
3. **Use separate buckets** - Development vs Production
4. **Enable versioning** - Recover deleted files
5. **Set CORS rules** - Restrict to your domains only
6. **Monitor usage** - Set up billing alerts
7. **Restrict token permissions** - Read/Write only, no Admin

## Additional Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [AWS S3 SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [R2 API Compatibility](https://developers.cloudflare.com/r2/api/s3/api/)

## Support

For issues related to:
- **GSHOP Storage System**: Open an issue in the repository
- **Cloudflare R2**: [Cloudflare Community](https://community.cloudflare.com/)
- **Billing**: [Cloudflare Support](https://dash.cloudflare.com/?to=/:account/support)

---

**Note**: The storage system is production-ready and battle-tested. Local storage fallback ensures zero friction for new developers joining the project.
