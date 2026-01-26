# Plan de Implementacion: Follow para Afiliados y Vendedores

## Resumen Ejecutivo

Implementar un sistema de seguimiento (follow) en la app mobile que permita a los usuarios seguir a afiliados y vendedores. Cada perfil incluira tabs con informacion relevante: streams pasados, streams en vivo, y productos (solo para vendedores).

---

## Estado Actual del Sistema

### Ya Implementado

1. **Sistema de Follow para Afiliados (Backend)**
   - Entidad `AffiliateFollower` con campos: `followerId`, `followingId`, `isActive`, `receiveNotifications`
   - `CreatorProfileService` con metodos: `followAffiliate()`, `unfollowAffiliate()`, `getFollowStats()`
   - Endpoints: `POST/DELETE /creators/follow/:creatorId`

2. **Sistema de Follow para Streamers (Backend)**
   - Entidad `StreamerFollow` con campos: `followerId`, `streamerId`, `notificationsEnabled`
   - `FollowersService` con metodos completos de follow/unfollow
   - Endpoints en `/followers/`

3. **Componentes Mobile Existentes**
   - `FollowButton` component (`/components/live/FollowButton.tsx`)
   - `useFollowStreamer` hook (`/hooks/useFollowStreamer.ts`)
   - `FollowingScreen` (`/screens/social/FollowingScreen.tsx`)
   - Servicio `followers.service.ts` y `affiliates.service.ts`

### Pendiente de Implementar

1. **Sellers** - No tienen soporte de follow actualmente
2. **Paginas de Perfil Publico** - No existen para afiliados ni vendedores
3. **Tabs de Contenido** - Streams pasados, en vivo, productos

---

## Arquitectura Propuesta

### Backend

#### 1. Extender Entidad Seller

```typescript
// backend/src/sellers/entities/seller.entity.ts
// Agregar campos:
@Column({ type: 'int', default: 0 })
followersCount: number;

@Column({ type: 'boolean', default: true })
isProfilePublic: boolean;
```

#### 2. Nueva Entidad SellerFollower

```typescript
// backend/src/sellers/entities/seller-follower.entity.ts
@Entity('seller_followers')
@Unique(['followerId', 'sellerId'])
export class SellerFollower {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  followerId: string;  // User que sigue

  @Column('uuid')
  sellerId: string;    // Seller seguido

  @Column({ default: true })
  notificationsEnabled: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'followerId' })
  follower: User;

  @ManyToOne(() => Seller)
  @JoinColumn({ name: 'sellerId' })
  seller: Seller;
}
```

#### 3. Nuevo SellerFollowService

```typescript
// backend/src/sellers/services/seller-follow.service.ts
@Injectable()
export class SellerFollowService {
  async followSeller(userId: string, sellerId: string): Promise<void>
  async unfollowSeller(userId: string, sellerId: string): Promise<void>
  async isFollowing(userId: string, sellerId: string): Promise<boolean>
  async toggleNotifications(userId: string, sellerId: string, enabled: boolean): Promise<void>
  async getFollowers(sellerId: string, page: number, limit: number): Promise<PaginatedResult>
  async getFollowersCount(sellerId: string): Promise<number>
}
```

#### 4. Nuevos Endpoints

```
POST   /api/v1/sellers/:sellerId/follow           - Seguir vendedor
DELETE /api/v1/sellers/:sellerId/follow           - Dejar de seguir
GET    /api/v1/sellers/:sellerId/is-following     - Verificar si sigue
PUT    /api/v1/sellers/:sellerId/notifications    - Toggle notificaciones
GET    /api/v1/sellers/:sellerId/followers        - Lista de seguidores
GET    /api/v1/sellers/:sellerId/public-profile   - Perfil publico del vendedor
GET    /api/v1/sellers/:sellerId/streams          - Streams del vendedor (pasados y en vivo)
GET    /api/v1/sellers/:sellerId/products/public  - Productos publicos del vendedor
```

#### 5. Endpoints Adicionales para Afiliados

```
GET    /api/v1/creators/:affiliateId/public-profile  - Perfil publico del afiliado
GET    /api/v1/creators/:affiliateId/streams         - Streams del afiliado (pasados y en vivo)
```

#### 6. Migracion de Base de Datos

```bash
npm run migration:generate -- -n AddSellerFollowersAndPublicProfile
```

Cambios:
- Nueva tabla `seller_followers`
- Agregar `followersCount` a tabla `sellers`
- Agregar `isProfilePublic` a tabla `sellers`
- Indices para optimizar queries de followers

---

### Mobile App

#### 1. Nuevos Servicios

```typescript
// mobile/src/services/seller-follow.service.ts
export const sellerFollowService = {
  followSeller(sellerId: string): Promise<void>,
  unfollowSeller(sellerId: string): Promise<void>,
  isFollowing(sellerId: string): Promise<boolean>,
  toggleNotifications(sellerId: string, enabled: boolean): Promise<void>,
  getSellerPublicProfile(sellerId: string): Promise<SellerPublicProfile>,
  getSellerStreams(sellerId: string, status?: 'live' | 'ended'): Promise<Stream[]>,
  getSellerProducts(sellerId: string, page: number): Promise<PaginatedProducts>
};

// mobile/src/services/affiliate-profile.service.ts (extension)
export const affiliateProfileService = {
  getPublicProfile(affiliateId: string): Promise<AffiliatePublicProfile>,
  getStreams(affiliateId: string, status?: 'live' | 'ended'): Promise<Stream[]>
};
```

#### 2. Nuevos Hooks

```typescript
// mobile/src/hooks/useFollowSeller.ts
export function useFollowSeller(sellerId: string) {
  return {
    isFollowing: boolean,
    notificationsEnabled: boolean,
    isLoading: boolean,
    follow: () => Promise<void>,
    unfollow: () => Promise<void>,
    toggleNotifications: () => Promise<void>
  };
}
```

#### 3. Nuevas Pantallas

##### AffiliateProfileScreen
```
/mobile/src/screens/profiles/AffiliateProfileScreen.tsx

Layout:
+------------------------------------------+
|  [Back]           [Share]                |
|                                          |
|    [Avatar]                              |
|    Display Name                          |
|    @username                             |
|    Bio text here...                      |
|                                          |
|    Followers: 1.2K | Views: 45K          |
|                                          |
|    [Follow Button] [Notifications Bell]  |
|                                          |
|  +--------------------------------------+|
|  | En Vivo | Streams Pasados |          ||
|  +--------------------------------------+|
|                                          |
|  [Grid/List of streams]                  |
|                                          |
+------------------------------------------+
```

##### SellerProfileScreen
```
/mobile/src/screens/profiles/SellerProfileScreen.tsx

Layout:
+------------------------------------------+
|  [Back]           [Share]                |
|                                          |
|    [Logo/Avatar]                         |
|    Business Name                         |
|    Verificado [check icon]               |
|    Descripcion de la tienda...           |
|                                          |
|    Followers: 5K | Productos: 150        |
|    Rating: 4.8 (234 reviews)             |
|                                          |
|    [Follow Button] [Notifications Bell]  |
|                                          |
|  +--------------------------------------+|
|  | Productos | En Vivo | Streams Pasados||
|  +--------------------------------------+|
|                                          |
|  [Grid of products/streams]              |
|                                          |
+------------------------------------------+
```

#### 4. Componentes Reutilizables

```typescript
// mobile/src/components/profiles/ProfileHeader.tsx
// Header comun para ambos tipos de perfil

// mobile/src/components/profiles/ProfileTabs.tsx
// Sistema de tabs configurable

// mobile/src/components/profiles/StreamGrid.tsx
// Grid de streams (pasados o en vivo)

// mobile/src/components/profiles/ProductGrid.tsx
// Grid de productos (solo sellers)

// mobile/src/components/profiles/FollowStats.tsx
// Muestra followers, views, etc.
```

#### 5. Navegacion

```typescript
// Agregar a ProfileNavigator o crear ProfilesNavigator
AffiliateProfileScreen: {
  affiliateId: string;
}
SellerProfileScreen: {
  sellerId: string;
}

// Desde LiveStreamScreen, ProductDetails, etc.
navigation.navigate('AffiliateProfile', { affiliateId: stream.affiliateId });
navigation.navigate('SellerProfile', { sellerId: product.sellerId });
```

---

## Interfaces TypeScript

### Backend DTOs

```typescript
// Seller Public Profile Response
interface SellerPublicProfileDto {
  id: string;
  businessName: string;
  logo?: string;
  description?: string;
  isVerified: boolean;
  followersCount: number;
  productsCount: number;
  rating: number;
  totalReviews: number;
  createdAt: Date;
}

// Affiliate Public Profile Response
interface AffiliatePublicProfileDto {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  profileImage?: string;
  followersCount: number;
  totalViews: number;
  isVerified: boolean;
  createdAt: Date;
}

// Stream Summary (for profile tabs)
interface StreamSummaryDto {
  id: string;
  title: string;
  thumbnail?: string;
  status: 'live' | 'ended';
  viewerCount: number;
  startedAt: Date;
  endedAt?: Date;
  hostType: 'seller' | 'affiliate';
}
```

### Mobile Interfaces

```typescript
// mobile/src/types/profiles.ts
export interface SellerPublicProfile {
  id: string;
  businessName: string;
  logo?: string;
  description?: string;
  isVerified: boolean;
  followersCount: number;
  productsCount: number;
  rating: number;
  totalReviews: number;
  isFollowing: boolean;
  notificationsEnabled: boolean;
}

export interface AffiliatePublicProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  profileImage?: string;
  followersCount: number;
  totalViews: number;
  isVerified: boolean;
  isFollowing: boolean;
  notificationsEnabled: boolean;
}

export type ProfileTab = 'products' | 'live' | 'past_streams';
```

---

## Flujos de Usuario

### 1. Descubrir y Seguir Afiliado

```
Usuario ve live stream
  -> Toca avatar/nombre del afiliado
  -> Abre AffiliateProfileScreen
  -> Ve perfil, streams pasados, stream actual
  -> Toca "Seguir"
  -> Opcionalmente activa notificaciones
```

### 2. Descubrir y Seguir Vendedor

```
Usuario ve producto
  -> Toca nombre de la tienda
  -> Abre SellerProfileScreen
  -> Ve productos, rating, streams
  -> Toca "Seguir"
  -> Puede explorar mas productos
```

### 3. Ver Seguidos

```
Usuario va a FollowingScreen (ya existe)
  -> Tabs: Todos | Vendedores | Afiliados
  -> Lista de seguidos con estado "En Vivo"
  -> Toca perfil -> Abre ProfileScreen correspondiente
```

---

## Archivos a Crear/Modificar

### Backend (Crear)

| Archivo | Descripcion |
|---------|-------------|
| `backend/src/sellers/entities/seller-follower.entity.ts` | Nueva entidad |
| `backend/src/sellers/services/seller-follow.service.ts` | Logica de follow |
| `backend/src/sellers/controllers/seller-follow.controller.ts` | Endpoints |
| `backend/src/sellers/dto/seller-public-profile.dto.ts` | DTOs |
| `backend/src/database/migrations/XXXX-AddSellerFollowers.ts` | Migracion |

### Backend (Modificar)

| Archivo | Cambios |
|---------|---------|
| `backend/src/sellers/entities/seller.entity.ts` | Agregar `followersCount`, `isProfilePublic` |
| `backend/src/sellers/sellers.module.ts` | Registrar nuevos servicios/controllers |
| `backend/src/affiliates/services/creator-profile.service.ts` | Agregar `getPublicProfile()` |
| `backend/src/affiliates/creators.controller.ts` | Endpoint de perfil publico |
| `backend/src/live/live.service.ts` | Metodo para obtener streams por host |

### Mobile (Crear)

| Archivo | Descripcion |
|---------|-------------|
| `mobile/src/screens/profiles/AffiliateProfileScreen.tsx` | Pantalla perfil afiliado |
| `mobile/src/screens/profiles/SellerProfileScreen.tsx` | Pantalla perfil vendedor |
| `mobile/src/services/seller-follow.service.ts` | Servicio follow sellers |
| `mobile/src/hooks/useFollowSeller.ts` | Hook para follow seller |
| `mobile/src/hooks/useSellerProfile.ts` | Hook para cargar perfil seller |
| `mobile/src/hooks/useAffiliateProfile.ts` | Hook para cargar perfil affiliate |
| `mobile/src/components/profiles/ProfileHeader.tsx` | Header compartido |
| `mobile/src/components/profiles/ProfileTabs.tsx` | Sistema de tabs |
| `mobile/src/components/profiles/StreamGrid.tsx` | Grid de streams |
| `mobile/src/components/profiles/ProductGrid.tsx` | Grid de productos |
| `mobile/src/types/profiles.ts` | Interfaces TypeScript |

### Mobile (Modificar)

| Archivo | Cambios |
|---------|---------|
| `mobile/src/navigation/ProfileNavigator.tsx` | Agregar nuevas pantallas |
| `mobile/src/navigation/types.ts` | Tipos de navegacion |
| `mobile/src/screens/live/LiveStreamScreen.tsx` | Link a perfil del host |
| `mobile/src/screens/products/ProductDetailsScreen.tsx` | Link a perfil del seller |
| `mobile/src/screens/social/FollowingScreen.tsx` | Integrar navegacion a perfiles |
| `mobile/src/services/affiliates.service.ts` | Agregar metodo de perfil publico |

---

## Orden de Implementacion

### Fase 1: Backend - Sellers Follow System [COMPLETADO]
1. [x] Crear entidad `SellerFollower` - `backend/src/sellers/entities/seller-follower.entity.ts`
2. [x] Modificar entidad `Seller` (agregar campos) - `followersCount`, `isProfilePublic`, `profileDescription`, `logoUrl`
3. [x] Crear migracion - `backend/src/database/migrations/1769500000000-AddSellerFollowersSystem.ts`
4. [x] Crear `SellerFollowService` - `backend/src/sellers/services/seller-follow.service.ts`
5. [x] Crear `SellerFollowController` con endpoints - `backend/src/sellers/controllers/seller-follow.controller.ts`
6. [x] Crear DTOs - `backend/src/sellers/dto/seller-follow.dto.ts`, `seller-public-profile.dto.ts`
7. [x] Registrar en `SellersModule`
8. [x] Registrar entidad en `typeorm.config.ts`

### Fase 2: Backend - Public Profiles & Streams
1. Crear endpoint perfil publico de seller
2. Crear endpoint streams de seller
3. Crear endpoint perfil publico de afiliado (si no existe)
4. Crear endpoint streams de afiliado

### Fase 3: Mobile - Services & Hooks
1. Crear `seller-follow.service.ts`
2. Crear `useFollowSeller` hook
3. Crear `useSellerProfile` hook
4. Crear `useAffiliateProfile` hook
5. Crear tipos en `profiles.ts`

### Fase 4: Mobile - Components
1. Crear `ProfileHeader`
2. Crear `ProfileTabs`
3. Crear `StreamGrid`
4. Crear `ProductGrid`

### Fase 5: Mobile - Screens
1. Crear `AffiliateProfileScreen`
2. Crear `SellerProfileScreen`
3. Actualizar navegacion

### Fase 6: Mobile - Integration
1. Agregar links a perfiles desde `LiveStreamScreen`
2. Agregar links a perfiles desde `ProductDetailsScreen`
3. Actualizar `FollowingScreen` con navegacion

---

## Consideraciones de UI/UX

### Animaciones
- Transicion suave al cambiar tabs
- Animacion del boton Follow (like Instagram)
- Skeleton loading para perfiles y grids

### Indicadores Visuales
- Badge "EN VIVO" en miniatura de stream activo
- Badge verificado para sellers/afiliados verificados
- Icono de campana para estado de notificaciones

### Estados Vacios
- "No hay productos" para sellers sin productos
- "No hay streams" cuando no tiene historial
- "No hay transmisiones en vivo" cuando no esta transmitiendo

### Accesibilidad
- Labels descriptivos para screen readers
- Contraste adecuado en badges y botones
- Tamanos de touch target minimo 44x44

---

## Testing

### Backend Tests
- Unit tests para `SellerFollowService`
- E2E tests para endpoints de follow
- Tests de integracion para contadores

### Mobile Tests
- Unit tests para hooks
- Component tests para ProfileHeader, Tabs
- Integration tests para flujo completo de follow

---

## Metricas de Exito

1. **Adopcion**: % de usuarios que siguen al menos 1 seller/afiliado
2. **Engagement**: Tiempo en pantallas de perfil
3. **Conversion**: Compras desde perfiles seguidos vs no seguidos
4. **Retencion**: Usuarios que regresan por notificaciones de seguidos

---

## Notas Adicionales

- Los vendedores NO tienen cuentas en la app mobile (solo panel web)
- Los usuarios solo pueden ser compradores (buyers) o afiliados
- Un usuario puede seguir tanto a vendedores como afiliados
- Las notificaciones de "En Vivo" ya existen en el sistema de StreamerFollow
