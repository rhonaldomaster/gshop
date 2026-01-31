---
name: migrations
description: Database migration guide for TypeORM
---

# Database Migrations Guide

**ALWAYS create a migration when modifying database entities or schema.**

## When Migrations Are Required

- Adding or removing columns
- Changing column types, nullability, or defaults
- Adding or removing tables (new entities)
- Modifying constraints, indexes, or relationships
- Changing enum values or types

## Steps to Create a Migration

```bash
cd backend

# 1. Make changes to entity files (*.entity.ts)

# 2. Generate migration with descriptive name
npm run migration:generate -- -n AddUserPhoneNumber

# 3. Review generated file in src/database/migrations/

# 4. Run the migration
npm run migration:run

# 5. Test everything works
```

## Example Workflow

```typescript
// 1. Modify entity: src/database/entities/user.entity.ts
@Column({ nullable: true })
phoneNumber: string;  // New field

// 2. Generate migration
npm run migration:generate -- -n AddPhoneNumberToUsers

// 3. File created:
// src/database/migrations/1234567890123-AddPhoneNumberToUsers.ts

// 4. Run migration
npm run migration:run
```

## Commands

```bash
npm run db:migrate              # Run TypeORM migrations
npm run db:seed                 # Seed database

cd backend
npm run migration:generate -- -n Name  # Generate migration
npm run migration:run                  # Run pending migrations
```

## What Does NOT Require Migrations

- Changes to services, controllers, or business logic
- API endpoint changes
- Frontend changes
- Configuration changes

## Migration File Location

`backend/src/database/migrations/`

## Tips

- Use descriptive names: `AddVatFieldsToProducts`, `CreateLiveStreamTables`
- Always review generated SQL before running
- Test migrations on development first
- Back up production data before running migrations
