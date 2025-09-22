# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GSHOP is a TikTok Shop clone MVP with a microservices architecture consisting of:

- **Backend**: NestJS API with TypeORM and PostgreSQL
- **Admin Web Panel**: Next.js with TypeScript, Tailwind CSS, and Prisma
- **Mobile App**: React Native with Expo
- **Database**: PostgreSQL with TypeORM (backend) and Prisma (admin panel)
- **Payment**: MercadoPago integration
- **Authentication**: JWT + NextAuth

## Development Commands

### Quick Setup
```bash
npm install
npm run install:all        # Install dependencies for all workspaces
cp .env.example .env       # Setup environment variables
npm run docker:up          # Start PostgreSQL with Docker
npm run db:migrate         # Run database migrations
npm run db:seed           # Seed database with initial data
```

### Development Servers
```bash
npm run dev               # Start all services (backend, admin, mobile)
npm run dev:backend       # Backend API on http://localhost:3000
npm run dev:admin         # Admin panel on http://localhost:3001
npm run dev:mobile        # Mobile app with Expo development server
```

### Individual Service Commands
```bash
# Backend (NestJS)
cd backend
npm run start:dev         # Development server
npm run build            # Build for production
npm test                 # Run tests

# Admin Web Panel (Next.js)
cd admin-web/app
npm run dev              # Development server
npm run build            # Build for production
npm run lint             # Run ESLint
npm test                 # Run tests

# Mobile App (React Native/Expo)
cd mobile
npm start                # Start Expo development server
npm run android          # Start Android emulator
npm run ios              # Start iOS simulator
npm run web              # Start web version
```

### Database Operations
```bash
npm run db:migrate           # Run TypeORM migrations (backend)
npm run db:seed             # Seed database with initial data

# Backend migrations
cd backend
npm run migration:generate -- -n MigrationName  # Generate new migration
npm run migration:run       # Run pending migrations
```

### Testing
```bash
npm test                    # Run all tests
npm run test:backend        # Backend tests only
npm run test:admin          # Admin panel tests only
```

### Docker Operations
```bash
npm run docker:up          # Start PostgreSQL container
npm run docker:down        # Stop containers
npm run docker:logs        # View container logs
```

## Architecture Notes

### Monorepo Structure
- Uses npm workspaces with individual package.json files
- Root package.json contains scripts for coordinating all services
- Each service (backend, admin-web, mobile) is self-contained

### Backend Architecture (NestJS)
- **Location**: `backend/src/`
- **Modules**: auth, users, products, orders, payments, database
- **Database**: TypeORM with PostgreSQL
- **API Docs**: Available at http://localhost:3000/api/docs (Swagger)
- **Authentication**: JWT with Passport strategies

### Admin Web Panel (Next.js)
- **Location**: `admin-web/app/`
- **Framework**: Next.js 14 with App Router
- **UI**: Tailwind CSS + Radix UI components
- **Database**: Prisma ORM (separate from backend TypeORM)
- **Authentication**: NextAuth.js
- **State Management**: Zustand, React Query (@tanstack/react-query)

### Mobile App (React Native)
- **Location**: `mobile/src/`
- **Framework**: Expo with React Native
- **Navigation**: React Navigation v7
- **State**: AsyncStorage for persistence

### Key Dependencies
- **Backend**: NestJS, TypeORM, PostgreSQL, JWT, Swagger
- **Admin**: Next.js, Prisma, NextAuth, Tailwind, Radix UI, Zustand
- **Mobile**: Expo, React Navigation, React Native Reanimated

### Environment Configuration
- Copy `.env.example` to `.env` and configure:
  - Database connection (PostgreSQL)
  - MercadoPago credentials (CLIENT_ID, CLIENT_SECRET, ACCESS_TOKEN)
  - JWT secrets
  - NextAuth configuration

### Development Workflow
1. Start PostgreSQL: `npm run docker:up`
2. Run migrations and seed: `npm run db:migrate && npm run db:seed`
3. Start all services: `npm run dev`
4. Access services:
   - Backend API: http://localhost:3000
   - Admin Panel: http://localhost:3001
   - Mobile: Expo DevTools in terminal

### Commission System
- Default 7% commission rate configured in backend
- Configurable through admin panel
- Applied to all orders automatically