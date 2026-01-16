# Plan de Implementacion de Rate Limiting - GSHOP Backend

## Resumen Ejecutivo

Este documento detalla el plan para implementar y desplegar rate limiting en el backend de GSHOP. El objetivo es proteger la API de abusos, ataques DDoS, y uso excesivo de recursos.

## Estado Actual

### Lo que ya existe

El proyecto ya cuenta con una implementacion base de rate limiting:

| Archivo | Descripcion |
|---------|-------------|
| `backend/src/common/guards/rate-limit.guard.ts` | Guard con algoritmo sliding window |
| `backend/src/common/cache/cache-mock.service.ts` | Cache en memoria (mock de Redis) |

### Caracteristicas actuales

- Algoritmo sliding window para tracking de requests
- Identificacion por usuario autenticado o IP
- Headers HTTP estandar (`X-RateLimit-*`)
- Decorador `@RateLimit(ttl, limit)` disponible
- Respuesta HTTP 429 con `retryAfter`

### Limitaciones actuales

1. **Cache en memoria**: No persiste entre reinicios, no escala horizontalmente
2. **No esta en uso**: Ningun endpoint tiene rate limiting aplicado
3. **Sin configuracion global**: Solo funciona por endpoint individual
4. **Sin bypass para servicios internos**: No hay whitelist de IPs/tokens

---

## Plan de Implementacion

### Fase 1: Mejoras al Sistema Base

#### 1.1 Migracion a @nestjs/throttler (Recomendado)

**Por que**: El modulo oficial de NestJS es mas robusto, tiene mejor soporte, y se integra nativamente.

```bash
npm install @nestjs/throttler
```

**Beneficios**:
- Soporte nativo para Redis
- Throttling global y por endpoint
- Skip condicional (whitelist)
- Mejor rendimiento
- Mantenido por el equipo de NestJS

#### 1.2 Estructura de configuracion propuesta

```typescript
// backend/src/config/rate-limit.config.ts
export const rateLimitConfig = {
  // Limites globales por defecto
  global: {
    ttl: 60000,      // 1 minuto
    limit: 100,      // 100 requests/minuto
  },

  // Limites por tipo de endpoint
  endpoints: {
    auth: {
      login: { ttl: 60000, limit: 5 },      // 5 intentos/minuto
      register: { ttl: 3600000, limit: 3 }, // 3 registros/hora
      forgotPassword: { ttl: 3600000, limit: 3 },
    },
    api: {
      read: { ttl: 60000, limit: 100 },     // Lectura: 100/min
      write: { ttl: 60000, limit: 30 },     // Escritura: 30/min
      upload: { ttl: 60000, limit: 10 },    // Upload: 10/min
    },
    payments: {
      create: { ttl: 60000, limit: 5 },     // 5 pagos/minuto
      webhook: { ttl: 1000, limit: 100 },   // Webhooks sin limite real
    },
    search: {
      default: { ttl: 60000, limit: 30 },   // Busquedas: 30/min
    },
  },

  // IPs/tokens en whitelist (sin rate limit)
  whitelist: {
    ips: ['127.0.0.1'],
    tokens: [], // API keys internas
  },
};
```

### Fase 2: Implementacion por Modulo

#### 2.1 Endpoints criticos (Alta prioridad)

| Modulo | Endpoint | Limite Sugerido | Razon |
|--------|----------|-----------------|-------|
| Auth | `POST /auth/login` | 5/min por IP | Prevenir brute force |
| Auth | `POST /auth/register` | 3/hora por IP | Prevenir spam de cuentas |
| Auth | `POST /auth/forgot-password` | 3/hora por email | Prevenir abuso |
| Payments | `POST /payments` | 5/min por usuario | Prevenir fraude |
| Orders | `POST /orders` | 10/min por usuario | Control de compras |

#### 2.2 Endpoints de lectura (Media prioridad)

| Modulo | Endpoint | Limite Sugerido | Razon |
|--------|----------|-----------------|-------|
| Products | `GET /products` | 100/min | Prevenir scraping |
| Search | `GET /search` | 30/min | Carga de busquedas |
| Analytics | `GET /analytics/*` | 20/min | Queries costosas |
| Recommendations | `GET /recommendations/*` | 50/min | ML intensivo |

#### 2.3 Endpoints de escritura (Alta prioridad)

| Modulo | Endpoint | Limite Sugerido | Razon |
|--------|----------|-----------------|-------|
| Products | `POST /products` | 20/min | Control de creacion |
| Products | `POST /products/upload` | 10/min | Uploads costosos |
| Reviews | `POST /reviews` | 5/min | Prevenir spam |
| Live | `POST /live/streams` | 5/hora | Streams limitados |

### Fase 3: Integracion con Redis (Produccion)

#### 3.1 Configuracion de Redis

```typescript
// backend/src/app.module.ts
import { ThrottlerModule, ThrottlerStorageRedisService } from '@nestjs/throttler';
import Redis from 'ioredis';

ThrottlerModule.forRoot({
  throttlers: [{ ttl: 60000, limit: 100 }],
  storage: new ThrottlerStorageRedisService(
    new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
    }),
  ),
}),
```

#### 3.2 Variables de entorno requeridas

```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Rate limiting
RATE_LIMIT_TTL=60000
RATE_LIMIT_DEFAULT=100
RATE_LIMIT_AUTH=5
RATE_LIMIT_UPLOADS=10
```

### Fase 4: Manejo de Errores y Logging

#### 4.1 Respuesta personalizada HTTP 429

```typescript
// Respuesta estandar para rate limit excedido
{
  "statusCode": 429,
  "message": "Has excedido el limite de solicitudes. Intenta de nuevo mas tarde.",
  "error": "Too Many Requests",
  "retryAfter": 45,  // segundos
  "limit": 100,
  "remaining": 0,
  "resetAt": "2024-01-15T10:30:00.000Z"
}
```

#### 4.2 Logging para monitoreo

```typescript
// Log cuando se excede el limite
[RATE_LIMIT] IP: 192.168.1.100 exceeded limit on POST /api/v1/auth/login
[RATE_LIMIT] User: user_123 exceeded limit on POST /api/v1/orders
```

#### 4.3 Integracion con sistema de audit existente

- Registrar intentos de rate limit excedido en `AuditLogService`
- Alertas para patrones sospechosos (ej: mismo IP, multiples endpoints)

### Fase 5: Testing

#### 5.1 Tests unitarios

- Verificar que el guard permite requests dentro del limite
- Verificar respuesta 429 cuando se excede
- Verificar reset despues del TTL
- Verificar whitelist funciona correctamente

#### 5.2 Tests de integracion

- Simular multiples requests concurrentes
- Verificar headers `X-RateLimit-*`
- Probar fallback cuando Redis no esta disponible

#### 5.3 Tests de carga

```bash
# Usando artillery o k6
npm run test:load -- --endpoint /api/v1/auth/login --rps 50
```

---

## Arquitectura Final

```
                    +------------------+
                    |   Load Balancer  |
                    +--------+---------+
                             |
              +-------------+-------------+
              |                           |
     +--------v--------+        +--------v--------+
     |   Backend #1    |        |   Backend #2    |
     |   (NestJS)      |        |   (NestJS)      |
     +--------+--------+        +--------+--------+
              |                           |
              +-------------+-------------+
                            |
                   +--------v--------+
                   |     Redis       |
                   | (Rate Limit DB) |
                   +-----------------+
```

---

## Cronograma Sugerido

### Sprint 1: Base ✅ COMPLETADO
- [x] Instalar `@nestjs/throttler`
- [x] Crear configuracion de rate limiting
- [x] Implementar throttler global
- [x] Agregar whitelist para servicios internos

### Sprint 2: Endpoints Criticos ✅ COMPLETADO
- [x] Aplicar rate limiting a auth endpoints
- [x] Aplicar rate limiting a payments
- [x] Aplicar rate limiting a orders
- [x] Configurar logging y audit (incluido en CustomThrottlerGuard)

### Sprint 3: Cobertura Completa + Logging ✅ COMPLETADO
- [x] Aplicar a endpoints de productos (GET 100/min, POST 20/min, upload 10/min)
- [x] Aplicar a endpoints de busqueda (30/min)
- [x] Aplicar a endpoints de analytics (20/min - controller level)
- [x] Documentar en Swagger (descripcion general + @ApiRateLimit decorator)
- [x] Filtro de excepciones con respuesta HTTP 429 mejorada
- [x] Integracion con AuditLogService
- [x] Estadisticas de rate limit violations

### Sprint 4: Produccion ✅ PARCIALMENTE COMPLETADO
- [x] Configurar Redis (RedisThrottlerStorage con auto-deteccion)
- [x] Migrar de cache en memoria a Redis (fallback automatico)
- [x] Tests unitarios (34 tests passing)
- [ ] Tests de carga
- [ ] Monitoreo y alertas

---

## Consideraciones de Seguridad

### Bypass Protection
- No exponer logica de rate limiting en respuestas
- Usar headers estandar pero no revelar detalles internos
- Implementar CAPTCHA como fallback para endpoints criticos

### IP Spoofing
- Validar headers `X-Forwarded-For` correctamente
- Confiar solo en IPs del load balancer conocido
- Considerar rate limiting por fingerprint adicional

### Distributed Attacks
- Redis permite coordinacion entre instancias
- Considerar rate limiting a nivel de CDN/WAF tambien
- Implementar circuit breaker para endpoints costosos

---

## Metricas y Monitoreo

### KPIs a trackear
- Requests bloqueados por rate limit (por endpoint, por hora)
- IPs/usuarios mas frecuentemente limitados
- Tiempo promedio de respuesta cuando se aplica rate limit
- Tasa de reintentos exitosos

### Alertas recomendadas
- Mas de X requests bloqueados en Y minutos
- Mismo IP excediendo limite en multiples endpoints
- Pico inusual de requests en endpoint especifico

---

## Recursos y Referencias

- [NestJS Throttler Documentation](https://docs.nestjs.com/security/rate-limiting)
- [OWASP Rate Limiting Guidelines](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [Redis Rate Limiting Patterns](https://redis.io/commands/incr#pattern-rate-limiter)

---

## Apendice: Codigo de Ejemplo

### Uso basico del decorador

```typescript
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(@Body() dto: LoginDto) {
    // Maximo 5 intentos por minuto
  }

  @Get('profile')
  @SkipThrottle() // Sin rate limit para este endpoint
  async getProfile() {
    // ...
  }
}
```

### Guard global en AppModule

```typescript
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

---

**Documento creado**: Enero 2026
**Ultima actualizacion**: Enero 2026
**Estado**: IMPLEMENTADO - Sprints 1, 2, 3 y 4 completados (tests de carga y monitoreo pendientes)
