# 🚀 GSHOP Backend Deployment Guide

## How Database Migrations Work

### TypeORM Migration System

TypeORM automatically tracks which migrations have been executed using a special table called `migrations` in your database. This means:

✅ **First deployment**: All migrations run automatically
✅ **Subsequent deployments**: Only NEW migrations run
✅ **No manual tracking needed**: TypeORM handles everything
✅ **Safe to run multiple times**: Already-executed migrations are skipped

### Migration Table Structure

TypeORM creates a `migrations` table with:
- `id` - Auto-increment ID
- `timestamp` - Migration timestamp (from filename)
- `name` - Migration name
- `executed_at` - When it was executed

## Deployment Methods

### Method 1: Using npm scripts (Simple)

```bash
# First time setup (just migrations)
npm run deploy:init

# Full deployment (build + migrations + start)
npm run deploy:prod
```

### Method 2: Using deploy.sh script (Recommended)

```bash
# First time setup
./deploy.sh init

# Run only pending migrations
./deploy.sh migrate

# Full deployment
./deploy.sh deploy

# Just build
./deploy.sh build

# Just start (without migrations)
./deploy.sh start
```

## Production Deployment Steps

### Initial Setup (First Time)

```bash
# 1. Clone repository and install dependencies
git clone <your-repo>
cd backend
npm install

# 2. Set environment variables
export DATABASE_URL="postgresql://user:password@host:5432/dbname"
export JWT_SECRET="your-secret-key"

# 3. Initialize database
./deploy.sh init

# 4. (Optional) Seed production data
npm run seed:prod

# 5. Start application
./deploy.sh start
```

### Updates (Subsequent Deployments)

```bash
# 1. Pull latest changes
git pull

# 2. Install new dependencies (if any)
npm install

# 3. Run full deployment
./deploy.sh deploy
```

## Environment Variables Required

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
# OR individual variables:
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=gshop_user
DB_PASSWORD=gshop_password
DB_DATABASE=gshop_db

# App
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this

# MercadoPago
MERCAPAGO_CLIENT_ID=your-client-id
MERCAPAGO_CLIENT_SECRET=your-client-secret
MERCAPAGO_ACCESS_TOKEN=your-access-token
```

## Docker Deployment Example

### Using docker-compose

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/gshop
      - JWT_SECRET=production-secret
      - NODE_ENV=production
    depends_on:
      - db
    command: ["./deploy.sh", "deploy"]

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=gshop
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Make deploy script executable
RUN chmod +x deploy.sh

# Expose port
EXPOSE 3000

# Default command: full deployment
CMD ["./deploy.sh", "deploy"]
```

## Platform-Specific Guides

### Heroku

```bash
# Add buildpack
heroku buildpacks:set heroku/nodejs

# Set environment variables
heroku config:set DATABASE_URL="your-database-url"
heroku config:set JWT_SECRET="your-secret"

# Deploy
git push heroku main

# Run migrations (if not automatic)
heroku run npm run migration:run
```

Add to `package.json`:
```json
{
  "scripts": {
    "heroku-postbuild": "npm run build && npm run migration:run"
  }
}
```

### Railway

```bash
# Set environment variables in Railway dashboard
DATABASE_URL=<provided-by-railway>
JWT_SECRET=your-secret

# Add start command in Railway settings:
npm run deploy:prod
```

### Vercel (Serverless)

⚠️ **Note**: Vercel is serverless and not ideal for NestJS with database migrations.
Consider using Railway, Heroku, or DigitalOcean instead.

### DigitalOcean App Platform

```yaml
# app.yaml
name: gshop-backend
services:
  - name: api
    github:
      repo: your-org/gshop
      branch: main
      deploy_on_push: true
    build_command: npm run build
    run_command: ./deploy.sh deploy
    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        value: ${db.DATABASE_URL}
      - key: JWT_SECRET
        scope: RUN_TIME
        type: SECRET
databases:
  - name: db
    engine: PG
    version: "15"
```

## Migration Management

### Check pending migrations

```bash
npm run migration:show
```

### Create new migration

```bash
# After modifying entities, generate migration
npm run migration:generate -- -n DescriptiveName
```

### Revert last migration (if needed)

```bash
npm run migration:revert
```

### Production migration tips

✅ **DO:**
- Test migrations locally first
- Backup database before running migrations
- Review generated migration files
- Use transactions in migrations

❌ **DON'T:**
- Enable `synchronize: true` in production (data loss risk!)
- Skip migration testing
- Modify already-deployed migrations
- Delete migration files

## Troubleshooting

### "Migration has already been executed"

✅ **Normal behavior** - This means TypeORM detected the migration was already run. No action needed.

### "QueryFailedError: relation does not exist"

❌ **Migrations not run** - Run `npm run migration:run`

### "Cannot find module"

❌ **Dependencies not installed** - Run `npm install`

### "Connection refused"

❌ **Database not running** - Check DATABASE_URL and database server

## Monitoring

### Check migration status

```bash
# Show all migrations and their status
npm run migration:show

# Example output:
# [X] CreateUsersTable1234567890123
# [X] AddVatFieldsToProducts1761860408199
# [ ] NewMigration1763000000000  <- Pending
```

## Best Practices

1. **Always test migrations locally first**
   ```bash
   npm run migration:run  # Test locally
   npm run migration:revert  # Revert if needed
   ```

2. **Backup database before deployment**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Use CI/CD pipelines**
   - Run migrations automatically on deployment
   - Run tests before deploying
   - Keep deployment logs

4. **Monitor migration execution time**
   - Large migrations may lock tables
   - Consider running heavy migrations during low-traffic hours

## Support

For issues or questions:
- Check logs: `./deploy.sh migrate`
- Review migration files: `backend/src/database/migrations/`
- TypeORM docs: https://typeorm.io/migrations
