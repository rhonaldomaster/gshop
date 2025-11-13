# 🔑 GSHOP Test Credentials

This file contains test credentials for development and testing purposes.

## Prerequisites

Run the database seed script to create these accounts:

```bash
cd backend
npm run seed
```

## Test Accounts

### 👨‍💼 Admin Panel
**URL**: http://localhost:3001

- **Email**: `john@doe.com`
- **Password**: `johndoe123`
- **Role**: ADMIN
- **Access**: Full platform management, analytics, user management, settings

---

### 🏪 Seller Panel
**URL**: http://localhost:3002

- **Email**: `seller@gshop.com`
- **Password**: `seller123`
- **Role**: SELLER
- **Business Name**: Electronics Store
- **Owner**: Maria Rodriguez
- **Access**: Product management, order management, commission tracking, withdrawal requests

---

### 📱 Mobile App / Buyer
**URL**: Expo development server

- **Email**: `buyer@gshop.com`
- **Password**: `buyer123`
- **Role**: BUYER
- **Name**: Carlos Martinez
- **Access**: Product browsing, shopping cart, checkout, order tracking

---

## Seeded Data

The seed script also creates:

- ✅ **7 Categories**: Electronics, Fashion, Home & Garden (with subcategories)
- ✅ **3 Products**: iPhone 15 Pro Max, MacBook Air M3, Premium Cotton T-Shirt
- ✅ **3 Commission Settings**: Platform fee (7%), Seller premium (2%), Referral bonus (1%)

## API Testing

### Authentication

```bash
# Login as Admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@doe.com",
    "password": "johndoe123"
  }'

# Login as Seller
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@gshop.com",
    "password": "seller123"
  }'

# Login as Buyer
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@gshop.com",
    "password": "buyer123"
  }'
```

### Using JWT Token

After login, use the `access_token` from the response:

```bash
# Example API call with authentication
curl -X GET http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Security Notes

⚠️ **WARNING**: These credentials are for **DEVELOPMENT ONLY**

- Do NOT use these credentials in production
- Change all default passwords before deploying
- Use strong, unique passwords for production environments
- Enable MFA (Multi-Factor Authentication) for admin accounts in production
- Regularly rotate credentials and API keys

## Reset Database

If you need to reset the database and recreate test accounts:

```bash
cd backend
npm run seed
```

This will:
1. Clear all existing data
2. Create fresh test accounts
3. Seed sample products and categories
4. Configure default commission settings

---

**Last Updated**: 2025-11-13
