# File Upload & Storage System

GSHOP uses a **dual-provider storage system** with automatic detection.

## How It Works

```typescript
// Multer uses memoryStorage()
MulterModule.register({
  storage: memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }  // 20MB max
})

// StorageService auto-selects provider
if (R2_ACCESS_KEY_ID exists) → Cloudflare R2 (Production)
else → Local Storage (Development)
```

## Storage Providers

| Provider | Environment | Location | URLs |
|----------|-------------|----------|------|
| Local Storage | Development | `backend/uploads/products/` | `/uploads/products/image.jpg` |
| Cloudflare R2 | Production | R2 Bucket | `https://pub-xxxxx.r2.dev/products/image.jpg` |

## Upload Endpoints

```bash
# Upload product images (up to 10, 20MB each)
POST /api/v1/products/upload
Headers: Authorization: Bearer <token>
Body: multipart/form-data (field: images[])
Response: { urls: string[], provider: "Cloudflare R2" | "Local Storage" }

# Delete image
DELETE /api/v1/products/images/:filename
```

## Architecture

```
backend/src/
├── common/storage/
│   ├── storage.interface.ts       # Common interface
│   ├── storage.service.ts         # Auto-selector
│   ├── r2-storage.provider.ts     # R2 implementation
│   ├── local-storage.provider.ts  # Local implementation
│   └── storage.module.ts
├── products/
│   ├── products.module.ts         # memoryStorage()
│   └── products-upload.service.ts
└── sellers/
    ├── sellers.module.ts          # diskStorage()
    └── sellers-upload.service.ts  # KYC documents
```

## Multer Configuration

**IMPORTANT**: Always use the correct storage type:

```typescript
// For StorageService integration
import { memoryStorage } from 'multer';
MulterModule.register({ storage: memoryStorage() })  // Correct

// WRONG - causes "_handleFile is not a function" error
MulterModule.register({ storage: 'memory' })
```

- Use `memoryStorage()` for services using StorageService
- Use `diskStorage()` for direct disk writes (seller documents)

## Key Features

- Zero Configuration: Works without R2 credentials
- Automatic Fallback: No code changes between dev/prod
- CDN Integration: R2 provides global CDN
- Cost Effective: $0 egress fees with R2

## Documentation

See `docs/R2_STORAGE_SETUP.md` for full Cloudflare R2 configuration.
