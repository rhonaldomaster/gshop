# 🚂 Railway Deployment Guide - GSHOP Backend

## Prerequisites

- Railway account (https://railway.app)
- PostgreSQL database (Railway provides one)
- MercadoPago credentials
- This repository pushed to GitHub/GitLab

## Quick Deploy Steps

### 1. Create New Project in Railway

1. Go to https://railway.app/new
2. Select "Deploy from GitHub repo"
3. Choose your GSHOP repository
4. Railway will auto-detect the Node.js project

### 2. Configure Service Settings

**Root Directory & Build Commands:**

```
Root Directory: backend
Install Command: npm ci
Build Command: npm run build
Start Command: npm run start:prod
```

Or use the automated deploy command:

```
Build Command: npm run deploy:prod
Start Command: npm run start:prod
```

### 3. Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will provision a PostgreSQL instance
4. Copy the `DATABASE_URL` connection string

### 4. Configure Environment Variables

Add these environment variables in Railway Settings → Variables:

```bash
# Database (from Railway PostgreSQL service)
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# MercadoPago Integration
MERCAPAGO_CLIENT_ID=your-mercadopago-client-id
MERCAPAGO_CLIENT_SECRET=your-mercadopago-client-secret
MERCAPAGO_ACCESS_TOKEN=your-mercadopago-access-token

# Stripe Integration (if using)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Cloudflare R2 Storage (optional - uses local storage if not set)
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Node Environment
NODE_ENV=production
PORT=3000
```

### 5. Run Database Migrations

Railway will automatically run migrations if you use the `deploy:prod` command.

If you need to run migrations manually:

1. Go to Railway project → backend service
2. Click on "Deployments" tab
3. Click "..." → "Run Command"
4. Execute: `npm run migration:run`

### 6. Seed Database (Optional)

To create initial admin, seller, and buyer accounts:

```bash
# In Railway console
npm run seed:prod
```

**Default credentials after seeding:**
- Admin: `john@doe.com` / `johndoe123`
- Seller: `seller@gshop.com` / `seller123`
- Buyer: `buyer@gshop.com` / `buyer123`

## Post-Deployment

### Check Logs

```bash
# Railway automatically shows logs in the dashboard
# Or use Railway CLI:
railway logs
```

### Health Check Endpoints

Once deployed, verify these endpoints:

- **Health Check**: `https://your-app.railway.app/`
- **API Docs (Swagger)**: `https://your-app.railway.app/api/docs`
- **Auth Test**: `POST https://your-app.railway.app/api/v1/auth/login`

### Database Migrations

Migrations run automatically with `npm run deploy:prod`.

To manually manage migrations:

```bash
# Generate new migration (locally)
npm run migration:generate -- -n MigrationName

# Run pending migrations (Railway console)
npm run migration:run

# Revert last migration (Railway console)
npm run migration:revert

# Show migration status (Railway console)
npm run migration:show
```

## Connecting Frontend Applications

Update your frontend `.env` files to point to Railway backend:

### Admin Panel (`admin-web/.env.local`)

```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
NEXTAUTH_URL=https://your-admin.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret
```

### Seller Panel (`seller-panel/.env.local`)

```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
NEXTAUTH_URL=https://your-seller.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret
```

### Mobile App (`mobile/.env`)

```bash
EXPO_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
```

## Custom Domain (Optional)

1. Go to Railway project → backend service
2. Click "Settings" → "Domains"
3. Click "Generate Domain" or add custom domain
4. Update DNS records if using custom domain

## Troubleshooting

### Build Fails

**Error: "Module not found"**
- Check that all dependencies are in `package.json` (not just `devDependencies`)
- Run `npm install` locally to verify

**Error: "Migration failed"**
- Ensure `DATABASE_URL` is correctly set
- Check database connection in Railway PostgreSQL service

### Runtime Errors

**Error: "Cannot connect to database"**
- Verify `DATABASE_URL` environment variable
- Check PostgreSQL service is running

**Error: "JWT must be provided"**
- Ensure `JWT_SECRET` is set in environment variables

### Performance Issues

**Slow API responses:**
- Check Railway plan (upgrade if needed)
- Enable connection pooling in TypeORM config
- Add Redis for caching (optional)

## Railway CLI (Optional)

Install Railway CLI for easier management:

```bash
# Install
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Run commands
railway run npm run migration:run
```

## Cost Optimization

- **Free Tier**: $5 credit/month (good for testing)
- **Hobby Plan**: $5/month + usage (recommended for production)
- **PostgreSQL**: ~$5/month for 1GB database
- **Estimated Total**: ~$10-15/month for small-scale production

## Security Checklist

- ✅ Change default JWT_SECRET
- ✅ Use environment variables (never commit secrets)
- ✅ Enable HTTPS (Railway provides automatically)
- ✅ Set NODE_ENV=production
- ✅ Update default admin/seller passwords after seeding
- ✅ Configure CORS for your frontend domains
- ✅ Enable rate limiting for API endpoints

## Support

- **Railway Docs**: https://docs.railway.app
- **GSHOP Issues**: https://github.com/your-repo/issues
- **Railway Discord**: https://discord.gg/railway

---

**Happy Deploying! 🚂✨**
