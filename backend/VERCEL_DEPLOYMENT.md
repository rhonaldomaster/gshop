# 🚀 Vercel Deployment Guide for GSHOP Backend

## ⚠️ Important Notes

### File Upload Limitation
- **Vercel's filesystem is READ-ONLY** except for `/tmp` directory
- `/tmp` storage is **EPHEMERAL** - files are deleted after each request/cold start
- Current config uses `/tmp/uploads` for Vercel (automatic detection via `process.env.VERCEL`)
- **For production**: Use cloud storage (AWS S3, Cloudflare R2, or similar) instead of local filesystem

### Serverless Function Limits
- **Max Duration**: 30 seconds (configured in vercel.json)
- **Max Memory**: 3008 MB (configured in vercel.json)
- **Cold Starts**: First request may be slower due to NestJS initialization

## 📦 What Was Changed

### 1. Fixed Marketplace Module
- **File**: `src/marketplace/marketplace.module.ts`
- **Change**: Upload directory now uses `/tmp/uploads` on Vercel, `./uploads` locally
- **Why**: Vercel serverless functions have read-only filesystem except `/tmp`

### 2. Created Serverless Handler
- **File**: `src/serverless.ts`
- **Purpose**: Export NestJS app as serverless function for Vercel
- **Difference from main.ts**: Doesn't call `app.listen()`, exports Express handler

### 3. Vercel Configuration
- **File**: `vercel.json`
- **Routes**: All requests go to `dist/serverless.js`
- **Memory**: 3008 MB (maximum for serverless functions)
- **Timeout**: 30 seconds

### 4. Vercel Ignore
- **File**: `.vercelignore`
- **Purpose**: Exclude unnecessary files from deployment (node_modules, src, test, etc.)

## 🔧 Deployment Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Configure Environment Variables in Vercel
Go to your Vercel project dashboard → Settings → Environment Variables

Add the following variables:

#### Required Variables
```bash
# Database (use your production PostgreSQL URL)
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT
JWT_SECRET=your-production-jwt-secret-here
JWT_EXPIRES_IN=7d

# API Configuration
NODE_ENV=production
API_PORT=3000
API_PREFIX=api/v1
API_URL=https://your-vercel-domain.vercel.app

# MercadoPago
MERCAPAGO_CLIENT_ID=your-mercadopago-client-id
MERCAPAGO_CLIENT_SECRET=your-mercadopago-client-secret
MERCAPAGO_ACCESS_TOKEN=your-mercadopago-access-token
MERCAPAGO_WEBHOOK_SECRET=your-webhook-secret
MERCAPAGO_ENVIRONMENT=production

# App Configuration
APP_NAME=GSHOP
DEFAULT_COMMISSION_RATE=7
```

#### Optional Variables (if using)
```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key

# EasyPost
EASYPOST_API_KEY=EZAK_your_production_key

# Blockchain (Polygon)
POLYGON_RPC_URL=https://polygon-rpc.com
USDC_CONTRACT_ADDRESS=0x2791bca1f2de4661ed88a30c99a7a9449aa84174

# Live Streaming
RTMP_SERVER_URL=rtmp://your-streaming-server/live
HLS_SERVER_URL=https://your-streaming-server/hls
WEBSOCKET_URL=https://your-vercel-domain.vercel.app

# Email (if configured)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
FROM_EMAIL=noreply@gshop.com
```

### 4. Build and Deploy
```bash
# From the backend directory
cd /Users/rhonalf.martinez/projects/gshop/backend

# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

### 5. Verify Deployment
After deployment, test these endpoints:

```bash
# Health check (replace with your Vercel URL)
curl https://your-project.vercel.app/api/v1

# Swagger docs
https://your-project.vercel.app/api/docs

# Test a simple endpoint
curl https://your-project.vercel.app/api/v1/products
```

## 🔄 Continuous Deployment

### GitHub Integration (Recommended)
1. Go to Vercel Dashboard → Add New Project
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Add all environment variables
5. Deploy

Every push to `main` branch will trigger automatic deployment.

## ⚠️ Known Limitations on Vercel

### 1. File Uploads (CRITICAL)
- **Problem**: `/tmp` storage is ephemeral and limited to 500MB
- **Impact**: Uploaded images will be lost after function execution
- **Solution**: Implement cloud storage

#### Recommended: Cloudflare R2 (S3-compatible, zero egress fees)
```typescript
// Install package
npm install @aws-sdk/client-s3 multer-s3

// Update marketplace.module.ts
import { S3Client } from '@aws-sdk/client-s3';
import * as multerS3 from 'multer-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

MulterModule.register({
  storage: multerS3({
    s3: s3,
    bucket: process.env.R2_BUCKET_NAME,
    acl: 'public-read',
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
}),
```

### 2. Database Connections
- **Problem**: Each serverless function creates new DB connections
- **Impact**: May hit PostgreSQL connection limits
- **Solution**: Use connection pooling (already handled by TypeORM, but monitor limits)

### 3. WebSocket Support
- **Problem**: Vercel doesn't support WebSocket connections well
- **Impact**: Live shopping features may not work
- **Solution**: Use external WebSocket service (Pusher, Ably, or separate server)

### 4. Long-Running Tasks
- **Problem**: 30-second timeout limit
- **Impact**: Heavy processing (video transcoding, large exports) will fail
- **Solution**: Use background jobs (Vercel Cron, queue system, or separate worker)

## 🎯 Production Recommendations

### 1. Use Vercel Postgres or External Database
```bash
# Recommended providers:
- Vercel Postgres (integrated)
- Supabase (PostgreSQL with extras)
- Neon (serverless PostgreSQL)
- Railway (simple PostgreSQL)
```

### 2. Implement Cloud Storage
```bash
# Options:
- Cloudflare R2 (recommended - S3 compatible, no egress fees)
- AWS S3 (industry standard)
- UploadThing (developer-friendly)
- Uploadcare (managed service)
```

### 3. Monitor Performance
```bash
# Add to Vercel dashboard:
- Function duration metrics
- Error rates
- Cold start frequency
- Database connection pool usage
```

### 4. Set Up Error Tracking
```bash
# Recommended:
npm install @sentry/node @sentry/nestjs
```

## 🐛 Troubleshooting

### "EROFS: read-only file system" Error
- ✅ Fixed! We changed upload directory to `/tmp/uploads`
- If still happening, check other file write operations in your code

### "Module not found" Error
- Run `npm run build` locally first to check for compilation errors
- Check `vercel.json` points to correct files
- Verify all dependencies are in `dependencies`, not `devDependencies`

### Swagger Docs Not Loading
- Check `src/serverless.ts` has Swagger setup (it does)
- Visit: `https://your-domain.vercel.app/api/docs`
- Enable CORS if accessing from different domain

### Database Connection Errors
- Verify `DATABASE_URL` in Vercel environment variables
- Check if database allows connections from Vercel IPs
- Enable SSL if required by your database provider

### Function Timeout
- Check Vercel logs for slow queries
- Optimize database queries with indexes
- Consider caching frequent requests
- Move heavy processing to background jobs

## 📊 Vercel Logs

View logs in real-time:
```bash
vercel logs [deployment-url]
```

Or check in Vercel Dashboard → Deployments → View Function Logs

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [NestJS on Vercel Guide](https://vercel.com/guides/deploying-nestjs-with-vercel)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

---

## 📝 Next Steps

1. ✅ Deploy to Vercel
2. ⚠️ **Implement cloud storage for file uploads** (CRITICAL)
3. 🔍 Monitor error rates and performance
4. 🔐 Set up proper CORS for your frontend domains
5. 📧 Configure email service for notifications
6. 🧪 Test all API endpoints on production

Good luck with deployment! 🚀
