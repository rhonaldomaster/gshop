# GSHOP Backend - Production Deployment Guide

## 📦 Vercel Serverless Architecture

This backend uses a **serverless function adapter** to run NestJS on Vercel:

- `src/main.ts` - Local development server (runs with `npm start`)
- `src/serverless.ts` - Vercel serverless handler (exports for Vercel)
- `vercel.json` - Vercel configuration for routing and builds

The serverless adapter:
- ✅ Caches the NestJS app instance between requests (warm starts)
- ✅ Supports all NestJS features (guards, pipes, interceptors)
- ✅ Handles CORS and validation automatically
- ✅ Includes Swagger docs at `/api/docs`
- ✅ 60-second timeout for long operations

## 🚀 Deploying to Vercel

### 1. Initial Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from backend directory
cd backend
vercel --prod
```

### 2. Configure Environment Variables in Vercel

Go to your Vercel project settings and add:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT
JWT_SECRET=your-super-secret-jwt-key-production
JWT_EXPIRATION=7d

# Payments
MERCAPAGO_CLIENT_ID=your-prod-mercadopago-client-id
MERCAPAGO_CLIENT_SECRET=your-prod-mercadopago-client-secret
MERCAPAGO_ACCESS_TOKEN=your-prod-mercadopago-access-token

STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Blockchain
POLYGON_RPC_URL=https://polygon-rpc.com
USDC_CONTRACT_ADDRESS=0x2791bca1f2de4661ed88a30c99a7a9449aa84174

# Shipping
EASYPOST_API_KEY=EZAK_your_production_easypost_api_key

# Live Streaming
RTMP_SERVER_URL=rtmp://your-streaming-server:1935/live
HLS_SERVER_URL=https://your-streaming-server/hls
WEBSOCKET_URL=https://your-backend-domain.vercel.app

# Admin Password for Seeding
ADMIN_PASSWORD=your-secure-admin-password
```

### 3. Run Database Migrations & Seeds

**⚠️ IMPORTANT**: Vercel does NOT run migrations automatically. You must run them manually.

#### Option A: Run from Local Machine (Recommended)

```bash
# Go to backend directory
cd backend

# Set your production DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:5432/database"

# Run migrations
npm run migration:run

# Run production seed (creates admin, categories, commissions)
npm run seed:prod
```

#### Option B: Use Setup Script

```bash
cd backend
chmod +x scripts/setup-prod-db.sh

# Run with your production database URL
DATABASE_URL="postgresql://user:password@host:5432/database" ./scripts/setup-prod-db.sh
```

#### Option C: GitHub Actions (Automated)

Create `.github/workflows/deploy-migrations.yml`:

```yaml
name: Run Database Migrations

on:
  workflow_dispatch:  # Manual trigger
  push:
    branches: [main]
    paths:
      - 'backend/src/database/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd backend && npm install

      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: cd backend && npm run migration:run
```

## 📊 Production Database Setup

### First Time Setup (Creates Essential Data)

The `seed:prod` script creates:
- ✅ Admin user account
- ✅ Basic product categories (Electronics, Fashion, Home & Garden)
- ✅ Commission structure (7% platform fee)

**Safe to run multiple times** - checks if data exists before creating.

### After Seeding

1. Log in to admin panel: `https://your-admin-domain/login`
   - Email: `admin@gshop.com`
   - Password: Value from `ADMIN_PASSWORD` env var

2. **IMMEDIATELY** change the admin password

3. Create your seller accounts and products

## 🔄 Updating Production

### For Code Changes

```bash
# Just push to main or run
vercel --prod
```

### For Database Schema Changes

```bash
# 1. Generate migration
npm run migration:generate -- -n YourMigrationName

# 2. Test locally first
npm run migration:run

# 3. Run on production
DATABASE_URL="your-prod-url" npm run migration:run
```

## 🐛 Troubleshooting

### "Migration table not found"

```bash
# Create migrations table manually
DATABASE_URL="your-prod-url" npm run migration:run
```

### "Table already exists"

This means migrations ran partially. Check:
```bash
# Connect to your database and check
SELECT * FROM migrations;
```

### "Connection timeout"

- Check if your database allows connections from your IP
- Verify DATABASE_URL is correct
- Check firewall rules

### Vercel Function Timeout

If your backend times out:
1. Go to Vercel project settings
2. Functions → Max Duration → Increase to 60s (Pro plan)

## 📦 Production Checklist

- [ ] Environment variables configured in Vercel
- [ ] Database migrations executed
- [ ] Production seed executed
- [ ] Admin password changed
- [ ] Webhook URLs configured in payment providers:
  - MercadoPago: `https://your-domain/api/v1/payments/webhook/mercadopago`
  - Stripe: `https://your-domain/api/v1/payments/webhook/stripe`
- [ ] CORS origins configured for your frontend domains
- [ ] SSL/HTTPS enabled
- [ ] Error monitoring configured (Sentry recommended)

## 🔐 Security Notes

1. **Never commit** `.env` files with production credentials
2. **Rotate secrets** regularly (JWT_SECRET, API keys)
3. **Use strong passwords** for admin accounts
4. **Enable 2FA** where available (Vercel, database provider)
5. **Monitor** your production logs for suspicious activity

## 📝 Database Backup

Always backup before migrations:

```bash
# PostgreSQL backup
pg_dump -h hostname -U username -d database > backup_$(date +%Y%m%d).sql

# Restore if needed
psql -h hostname -U username -d database < backup_20250127.sql
```

## 🆘 Emergency Rollback

If a migration breaks production:

```bash
# Revert last migration
DATABASE_URL="your-prod-url" npm run migration:revert

# Deploy previous Vercel version
vercel rollback
```

## 📞 Support

If you encounter issues:
1. Check Vercel logs: `vercel logs`
2. Check database logs in your provider dashboard
3. Review this guide's troubleshooting section
4. Contact your database provider support
