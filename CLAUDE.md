# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GSHOP is a TikTok Shop clone MVP with a microservices architecture:

- **Backend**: NestJS API with TypeORM and PostgreSQL
- **Admin Web Panel**: Next.js with TypeScript, Tailwind CSS, and Prisma
- **Seller Panel**: Next.js with NextAuth, seller dashboard and product management
- **Mobile App**: React Native with Expo
- **Database**: PostgreSQL with TypeORM (backend) and Prisma (admin panel)
- **Payment**: MercadoPago integration
- **Authentication**: JWT + NextAuth

## Available Skills

Use these slash commands to load detailed documentation when needed:

| Command | Description |
|---------|-------------|
| `/build` | Mobile build guide - APK generation, iOS builds, EAS, local builds |
| `/vat` | Colombian VAT (IVA) system - tax categories, calculation, compliance |
| `/storage` | File upload strategy - R2/local storage, Multer config |
| `/api-docs` | Complete API endpoints reference |
| `/live` | Live shopping - streaming, WebSocket, affiliate attribution |
| `/logistics` | Shipping, returns, guest checkout |
| `/migrations` | Database migration guide |
| `/credentials` | Test login credentials |
| `/phase3` | Marketplace, Payments V2, AI recommendations |

## Important Documentation

- **File Storage**: `docs/R2_STORAGE_SETUP.md`
- **Implementation Phases**: `docs/phases_implementations.md`
- **Colombian VAT**: `docs/PLAN_IVA_COLOMBIA.md`

## Coding Guidelines

### Internationalization (i18n)

**ALWAYS use i18n for user-facing text in frontend applications.**

```typescript
// WRONG
<h1>Producto no encontrado</h1>

// CORRECT
const t = useTranslations('products')
<h1>{t('productNotFound')}</h1>
```

**Translation Files:**
- Admin Panel: `admin-web/app/messages/es.json`
- Seller Panel: `seller-panel/messages/es.json`
- Mobile App: `mobile/locales/es.json`

## Development Commands

### Quick Setup

```bash
npm install
npm run install:all
cp .env.example .env
npm run docker:up
npm run db:migrate
npm run db:seed
```

### Development Servers

```bash
npm run dev               # All services
npm run dev:backend       # Backend on :3000
npm run dev:admin         # Admin on :3001
npm run dev:seller        # Seller on :3002
npm run dev:mobile        # Expo dev server
```

### Database

```bash
npm run db:migrate        # Run migrations
npm run db:seed          # Seed data

cd backend
npm run migration:generate -- -n MigrationName
npm run migration:run
```

### Testing

```bash
npm test                  # All tests
npm run test:backend      # Backend only
npm run test:admin        # Admin only
```

## Architecture Notes

### Monorepo Structure

- npm workspaces with individual package.json files
- Each service is self-contained

### Backend (NestJS)

- Location: `backend/src/`
- Modules: auth, users, products, orders, payments, sellers, affiliates, live, analytics
- API Docs: http://localhost:3000/api/docs (Swagger)
- Authentication: JWT with Passport

### Admin Panel (Next.js)

- Location: `admin-web/app/`
- Next.js 14 with App Router
- Tailwind CSS + Radix UI
- Prisma ORM, NextAuth, Zustand

### Seller Panel (Next.js)

- Location: `seller-panel/`
- Next.js with NextAuth
- Product and order management

### Mobile (React Native)

- Location: `mobile/src/`
- Expo with React Navigation v7
- AsyncStorage for persistence

### Environment Configuration

Copy `.env.example` to `.env` and configure:
- Database connection (PostgreSQL)
- MercadoPago credentials
- JWT secrets
- NextAuth configuration

### Development Workflow

1. Start PostgreSQL: `npm run docker:up`
2. Run migrations and seed: `npm run db:migrate && npm run db:seed`
3. Start all services: `npm run dev`
4. Access:
   - Backend API: http://localhost:3000
   - Admin Panel: http://localhost:3001
   - Seller Panel: http://localhost:3002

### Key Systems

- **Commission**: Default 7%, configurable via admin panel
- **Colombian VAT**: Always included in price (use `/vat` for details)
- **Storage**: Auto-switches between R2 (prod) and local (dev)
