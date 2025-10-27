# Quick Vercel Deployment Guide

## 🚨 Fixed the Serverless Crash Issue

The original crash was because NestJS needs a special serverless adapter for Vercel.

### What Changed:
- ✅ Created `src/serverless.ts` - Vercel serverless handler
- ✅ Created `vercel.json` - Vercel configuration
- ✅ Created `.vercelignore` - Exclude unnecessary files
- ✅ App now caches between requests (faster cold starts)

## 📝 Quick Deploy Steps

### 1. Commit and Push Changes

```bash
cd /Users/rhonalf.martinez/projects/gshop/backend

git add .
git commit -m "feat: add Vercel serverless adapter for NestJS"
git push origin main
```

Vercel will **automatically redeploy** when you push to main.

### 2. Or Deploy Manually with Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy
vercel --prod
```

### 3. Verify Environment Variables in Vercel

Make sure these are set in your Vercel project settings:

```bash
DATABASE_URL=postgres://postgres.zxfolairysqjmdygbqzu:iRGuYSdYeKSX8ZuX@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
NODE_ENV=production
JWT_SECRET=your-jwt-secret
ADMIN_PASSWORD=GShop2025!Admin
```

### 4. Test Your Deployment

After deployment completes:

```bash
# Test health endpoint
curl https://your-backend.vercel.app/api/v1/health

# Check Swagger docs
open https://your-backend.vercel.app/api/docs
```

## 🔧 Troubleshooting

### Check Vercel Logs

Go to your Vercel dashboard:
1. Select your project
2. Go to "Deployments"
3. Click on the latest deployment
4. Check "Functions" tab for errors

### Common Issues

**"Module not found" errors:**
- Make sure `npm install` runs before build
- Check that all dependencies are in `dependencies`, not `devDependencies`

**"Connection timeout" errors:**
- Verify DATABASE_URL in Vercel env vars
- Check that Supabase allows connections from Vercel IPs

**"Cold start timeout":**
- Increase function timeout in `vercel.json` (already set to 60s)
- Consider upgrading to Vercel Pro for longer timeouts

## 📊 Expected Behavior

### First Request (Cold Start)
- Takes 3-10 seconds
- NestJS app initializes
- Logs: "✅ NestJS app initialized for Vercel serverless"

### Subsequent Requests (Warm)
- Takes 50-300ms
- Reuses cached app instance
- Fast and responsive

## 🎯 Next Steps

1. ✅ Migrations already run (done earlier)
2. ✅ Seed data already created (admin user, categories)
3. Configure webhook URLs in payment providers
4. Test API endpoints
5. Connect mobile app to production API
