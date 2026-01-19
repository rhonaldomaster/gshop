# Plan: Streaming Nativo desde Mobile App + Soporte OBS

## Progreso de Implementación

| Fase | Estado | Fecha |
|------|--------|-------|
| FASE 1: Infraestructura Base | ✅ COMPLETADA | 2026-01-16 |
| FASE 2: Streaming Nativo Mobile | ✅ COMPLETADA | 2026-01-16 |
| FASE 3: Seller Mode Mobile | ✅ COMPLETADA | 2026-01-16 |
| FASE 4: UI Carrito TikTok Style | ✅ COMPLETADA | 2026-01-16 |
| FASE 5: Mantener Soporte OBS | ✅ COMPLETADA | 2026-01-16 |
| FASE 6: VOD/Replays | ✅ COMPLETADA | 2026-01-19 |
| FASE 7: Profile Actions (Notificaciones y Soporte) | ✅ COMPLETADA | 2026-01-19 |
| FASE 8: Push Notifications para Lives | ✅ COMPLETADA | 2026-01-19 |
| FASE 9: Picture-in-Picture Mode | ✅ COMPLETADA | 2026-01-19 |

---

## Resumen Ejecutivo

Implementar streaming nativo desde la app mobile para afiliados, manteniendo la opción de OBS para usuarios avanzados. Resolver el acceso de sellers al streaming mobile mediante una versión "Seller Mode" de la app.

## Situación Actual

### Lo que ya existe:
- **Backend completo** con AWS IVS (mock en dev, real en prod)
- **WebSocket Gateway** para chat, viewers, reacciones
- **6 entidades** de live streaming bien estructuradas
- **Seller Panel** (Next.js) con gestión de streams + config OBS
- **Mobile App** con pantallas de visualización de streams
- **Endpoints REST** para sellers y affiliates

### Problema identificado:
- Affiliates tienen app mobile pero **no pueden transmitir desde ella**
- Sellers **solo tienen panel web**, no app mobile
- El streaming actual **requiere OBS** (barrera técnica alta)

## Propuesta de Solución

### Enfoque Dual:
1. **Streaming Nativo** desde app mobile (cámara del dispositivo → AWS IVS)
2. **Streaming OBS** mantenido para usuarios avanzados

### Para Sellers:
- Crear "Seller Mode" en la app mobile (cambio de rol con toggle)
- O crear app separada "GSHOP Seller" (más limpio pero más mantenimiento)

---

## Fases de Implementación

### FASE 1: Infraestructura Base (2-3 días)

#### 1.1 Backend - Nuevos Endpoints de Streaming Nativo

**Archivo:** `backend/src/live/live.controller.ts`

Agregar endpoints para obtener credenciales de streaming:

```typescript
// Obtener credenciales para streaming nativo (mobile)
GET /api/v1/live/streams/:id/native-credentials

// Response:
{
  ingestEndpoint: "rtmps://xxx.global-contribute.live-video.net:443/app",
  streamKey: "sk_xxx",
  channelArn: "arn:aws:ivs:...",
  playbackUrl: "https://xxx.ivs.us-east-1.amazonaws.com/..."
}
```

#### 1.2 Backend - Servicio AWS IVS Real

**Archivo:** `backend/src/live/aws-ivs.service.ts`

Asegurar que el servicio real de AWS IVS esté completamente funcional:
- Crear canales con configuración de baja latencia
- Obtener ingest endpoints
- Manejar stream keys
- Soporte para grabación (opcional)

#### 1.3 Configuración de Ambiente

```bash
# .env additions
AWS_IVS_ENABLED=true
AWS_IVS_ACCESS_KEY_ID=xxx
AWS_IVS_SECRET_ACCESS_KEY=xxx
AWS_IVS_REGION=us-east-1
AWS_IVS_LATENCY_MODE=LOW  # LOW or NORMAL
```

---

### FASE 2: Streaming Nativo Mobile - Affiliates (3-4 días)

#### 2.1 Dependencias Mobile

```bash
cd mobile
npx expo install expo-camera expo-av react-native-live-stream
# O alternativamente:
npm install react-native-nodemediaclient  # Para RTMP push
```

#### 2.2 Nueva Pantalla de Broadcasting

**Archivo:** `mobile/src/screens/live/NativeBroadcastScreen.tsx`

Componentes principales:
- Preview de cámara (frontal/trasera toggle)
- Botón Start/Stop streaming
- Indicador de conexión y bitrate
- Panel de productos para destacar
- Chat overlay
- Viewer count en tiempo real

```typescript
// Estructura del componente
const NativeBroadcastScreen = () => {
  // Estados
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [streamCredentials, setStreamCredentials] = useState(null);

  // Obtener credenciales al montar
  useEffect(() => {
    fetchNativeCredentials(streamId);
  }, []);

  // Iniciar stream RTMP
  const startStreaming = async () => {
    // Conectar a ingestEndpoint con streamKey
    // Iniciar captura de cámara y audio
    // Push RTMP stream
  };

  return (
    <View>
      <CameraPreview facing={cameraFacing} />
      <StreamControls onStart={startStreaming} onStop={stopStreaming} />
      <ProductOverlay streamId={streamId} />
      <ChatOverlay streamId={streamId} />
      <ViewerCount count={viewerCount} />
    </View>
  );
};
```

#### 2.3 Componente de Streaming RTMP

**Archivo:** `mobile/src/components/live/RTMPPublisher.tsx`

Opciones de implementación:
1. **react-native-nodemediaclient** - Maduro, probado
2. **amazon-ivs-broadcast-sdk** - Oficial de AWS (recomendado)
3. **Custom con expo-av** - Más control, más trabajo

#### 2.4 Navegación Actualizada

**Archivo:** `mobile/src/navigation/LiveStackNavigator.tsx`

```typescript
// Agregar nueva ruta
<Stack.Screen
  name="NativeBroadcast"
  component={NativeBroadcastScreen}
  options={{ headerShown: false }}
/>
```

---

### FASE 3: Seller Mode en Mobile App (2-3 días)

#### 3.1 Sistema de Roles en Mobile

**Archivo:** `mobile/src/contexts/UserRoleContext.tsx`

```typescript
interface UserRoleContext {
  currentRole: 'buyer' | 'seller' | 'affiliate';
  switchRole: (role: string) => void;
  canStream: boolean;
  canManageProducts: boolean;
}
```

#### 3.2 Pantalla de Cambio de Rol

**Archivo:** `mobile/src/screens/settings/RoleSwitcherScreen.tsx`

- Si el usuario tiene cuenta seller verificada → permitir cambiar a "Seller Mode"
- Si el usuario es affiliate → permitir acceso a streaming
- Buyer normal → solo visualización

#### 3.3 Dashboard Seller Mobile

**Archivo:** `mobile/src/screens/seller/SellerDashboardScreen.tsx`

Vista simplificada del seller panel:
- Lista de productos
- Crear/gestionar streams
- Ver estadísticas básicas
- Acceso a streaming nativo

#### 3.4 Navegación Condicional

```typescript
// En el navigator principal
{currentRole === 'seller' && (
  <Tab.Screen name="SellerDashboard" component={SellerDashboardScreen} />
)}
{(currentRole === 'seller' || currentRole === 'affiliate') && (
  <Tab.Screen name="GoLive" component={GoLiveScreen} />
)}
```

---

### FASE 4: UI de Carrito Estilo TikTok Shop (3-4 días)

#### 4.1 Overlay de Productos Mejorado

**Archivo:** `mobile/src/components/live/ProductOverlayTikTok.tsx`

Características:
- Producto "pinneado" animado (bounce, glow)
- Contador de compras en tiempo real
- Timer de oferta especial
- Deslizar para ver más productos
- Quick-add to cart con haptic feedback

#### 4.2 Checkout Modal Mejorado

**Archivo:** `mobile/src/components/live/LiveCheckoutModal.tsx`

- No salir del live para comprar
- Selección rápida de talla/color/variante
- Dirección pre-seleccionada
- Pago con método guardado (1-tap)
- Animación de "compra exitosa" que aparece en el stream

#### 4.3 Eventos WebSocket Nuevos

```typescript
// Backend - agregar a live.gateway.ts
@SubscribeMessage('pinProduct')
handlePinProduct(client: Socket, payload: { streamId: string, productId: string }) {
  // Broadcast producto destacado a todos los viewers
  this.server.to(payload.streamId).emit('productPinned', {
    productId: payload.productId,
    timestamp: new Date()
  });
}

@SubscribeMessage('purchaseMade')
handlePurchaseMade(client: Socket, payload: { streamId: string, productName: string }) {
  // Broadcast notificación de compra
  this.server.to(payload.streamId).emit('newPurchase', {
    productName: payload.productName,
    buyerName: 'Usuario***',  // Anonimizado
    timestamp: new Date()
  });
}
```

#### 4.4 Feedback Visual

- Sonido al comprar (configurable)
- Animación de confetti/corazones
- Banner "Alguien acaba de comprar [producto]!"
- Contador de ventas en tiempo real

---

### FASE 5: Mantener Soporte OBS (1 día)

#### 5.1 Selector de Método de Streaming

**Archivo:** `mobile/src/screens/live/StreamMethodSelector.tsx`

```typescript
const StreamMethodSelector = ({ onSelect }) => (
  <View>
    <TouchableOpacity onPress={() => onSelect('native')}>
      <Icon name="smartphone" />
      <Text>Transmitir desde este dispositivo</Text>
      <Text>Usa tu cámara del teléfono</Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={() => onSelect('obs')}>
      <Icon name="desktop" />
      <Text>Transmitir con OBS/Equipo externo</Text>
      <Text>Para streamers profesionales</Text>
    </TouchableOpacity>
  </View>
);
```

#### 5.2 Pantalla de Configuración OBS (Mobile)

**Archivo:** `mobile/src/screens/live/OBSSetupScreen.tsx`

- Mostrar RTMP URL
- Mostrar Stream Key (con botón copiar)
- QR code para escanear desde PC
- Link a guía de configuración
- Verificador de conexión

---

### FASE 6: VOD/Replays - Almacenamiento de Streams (2-3 días)

#### 6.1 Opciones de Almacenamiento

| Proveedor | Pros | Contras | Costo Estimado |
|-----------|------|---------|----------------|
| **Cloudflare R2** | Ya lo usan para productos, $0 egress, integrado | No tiene transcoding nativo, hay que procesar manualmente | $0.015/GB storage |
| **AWS S3 + CloudFront** | Integración nativa con IVS Recording, auto-transcode | Egress costoso ($0.09/GB), vendor lock-in con AWS | $0.023/GB storage + egress |
| **AWS IVS Recording** | Grabación automatica durante el stream, 0 codigo extra | Solo funciona con IVS, formato HLS | Incluido en costo IVS + S3 |
| **Cloudflare Stream** | Transcoding automatico, adaptive bitrate, CDN incluido | Servicio separado, costo por minuto de video | $1/1000 min viewed |

#### 6.2 Recomendacion: Hibrido R2 + IVS Recording

```
Durante el Live:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │────▶│   AWS IVS   │────▶│  IVS Auto   │
│  Broadcast  │     │   Ingest    │     │  Recording  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
Post-Stream (Webhook):                  ┌─────────────┐
┌─────────────┐     ┌─────────────┐     │   AWS S3    │
│   Backend   │◀────│  IVS Event  │◀────│  (temporal) │
│   Worker    │     │  Webhook    │     └─────────────┘
└──────┬──────┘     └─────────────┘
       │
       ▼ Copiar a R2
┌─────────────┐     ┌─────────────┐
│ Cloudflare  │────▶│   Mobile    │
│     R2      │     │   Playback  │
└─────────────┘     └─────────────┘
```

#### 6.3 Implementacion Backend

**Archivo:** `backend/src/live/vod.service.ts`

```typescript
@Injectable()
export class VodService {
  // Webhook de IVS cuando termina la grabacion
  async handleRecordingComplete(event: IVSRecordingEvent) {
    const { stream_id, recording_s3_bucket, recording_s3_key } = event;

    // Copiar de S3 a R2
    const r2Key = await this.storageService.copyFromS3ToR2(
      recording_s3_bucket,
      recording_s3_key,
      `vod/${stream_id}/`
    );

    // Actualizar stream con URL del VOD
    await this.liveService.updateStream(stream_id, {
      vodUrl: this.storageService.getPublicUrl(r2Key),
      vodStatus: 'available'
    });
  }
}
```

#### 6.4 Entidad VOD

**Archivo:** `backend/src/live/vod.entity.ts`

```typescript
@Entity('live_stream_vods')
export class LiveStreamVod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LiveStream)
  stream: LiveStream;

  @Column()
  storageProvider: 'r2' | 's3' | 'cloudflare_stream';

  @Column()
  videoUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column()
  duration: number; // segundos

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 'processing' })
  status: 'processing' | 'available' | 'failed';

  @CreateDateColumn()
  createdAt: Date;
}
```

#### 6.5 Mobile - Pantalla de VOD

**Archivo:** `mobile/src/screens/live/VodScreen.tsx`

- Lista de streams pasados del seller/affiliate
- Reproductor de video con controles
- Productos que se mostraron durante el stream
- Opcion de "comprar ahora" en productos del VOD

#### 6.6 Configuracion AWS IVS Recording

```bash
# .env additions
AWS_IVS_RECORDING_ENABLED=true
AWS_IVS_RECORDING_S3_BUCKET=gshop-ivs-recordings
VOD_STORAGE_PROVIDER=r2  # r2 | s3 | cloudflare_stream
```

---

### FASE 7: UX Adicional (Opcional - futuro)

#### 7.1 Notificaciones Push
- "Tu streamer favorito está en vivo"
- "El producto que te gustó está en oferta en un live"

#### 7.2 Modo Picture-in-Picture
- Seguir viendo el live mientras navegas la app
- Mini player flotante

#### 7.3 Filtros de Cámara (futuro)
- Filtros de belleza básicos
- Fondos virtuales

---

## Archivos a Crear/Modificar

### Backend (10 archivos)
```
backend/src/live/
├── live.controller.ts          # Modificar - agregar endpoints
├── live.service.ts             # Modificar - nuevos métodos
├── live.gateway.ts             # Modificar - nuevos eventos WS
├── aws-ivs.service.ts          # Verificar implementación completa
├── vod.service.ts              # Crear - manejo de grabaciones
├── vod.entity.ts               # Crear - entidad VOD
├── vod.controller.ts           # Crear - endpoints VOD
├── dto/native-stream.dto.ts    # Crear - DTOs nuevos
├── dto/vod.dto.ts              # Crear - DTOs VOD
└── interfaces/stream-method.ts # Crear - tipos
```

### Mobile (18+ archivos)
```
mobile/src/
├── screens/live/
│   ├── NativeBroadcastScreen.tsx      # Crear - streaming desde camara
│   ├── StreamMethodSelector.tsx        # Crear - elegir metodo
│   ├── OBSSetupScreen.tsx             # Crear - config OBS
│   ├── GoLiveScreen.tsx               # Crear - entry point
│   └── VodScreen.tsx                  # Crear - ver streams pasados
├── screens/seller/
│   ├── SellerDashboardScreen.tsx      # Crear
│   └── SellerProductsScreen.tsx       # Crear
├── components/live/
│   ├── RTMPPublisher.tsx              # Crear - push RTMP
│   ├── ProductOverlayTikTok.tsx       # Crear - UI productos
│   ├── LiveCheckoutModal.tsx          # Modificar
│   ├── StreamControls.tsx             # Crear - controles broadcast
│   ├── PurchaseNotification.tsx       # Crear - notif compras
│   └── VodPlayer.tsx                  # Crear - reproductor VOD
├── contexts/
│   └── UserRoleContext.tsx            # Crear - roles buyer/seller/affiliate
├── hooks/
│   ├── useStreamBroadcast.ts          # Crear - hook streaming
│   └── useVod.ts                      # Crear - hook VOD
└── navigation/
    └── LiveStackNavigator.tsx         # Modificar
```

### Seller Panel (2 archivos)
```
seller-panel/app/dashboard/live/
├── page.tsx                    # Modificar - info de app mobile
└── [id]/page.tsx              # Modificar - mostrar opciones nativas
```

---

## Dependencias Nuevas

### Mobile
```json
{
  "amazon-ivs-broadcast": "^1.x",  // SDK oficial AWS IVS
  "expo-camera": "~14.x",
  "expo-av": "~14.x",
  "@react-native-clipboard/clipboard": "^1.x"
}
```

### Backend
```json
{
  "@aws-sdk/client-ivs": "^3.x"  // Ya debería estar
}
```

---

## Estimación de Esfuerzo

| Fase | Descripción | Esfuerzo | Prioridad |
|------|-------------|----------|-----------|
| 1 | Infraestructura Base | Medio | Alta |
| 2 | Streaming Nativo Mobile (Affiliates) | Alto | Alta |
| 3 | Seller Mode Mobile | Medio | Alta |
| 4 | UI Carrito TikTok Style | Alto | Media |
| 5 | Mantener OBS | Bajo | Alta |
| 6 | VOD/Replays (R2 + IVS Recording) | Medio | Media |
| 7 | UX Adicional (PiP, Notificaciones) | Bajo | Baja |

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| SDK de broadcast puede ser inestable en algunos dispositivos | Pruebas en múltiples dispositivos, fallback a OBS |
| Latencia alta en streaming mobile | Usar modo LOW_LATENCY de IVS, optimizar bitrate |
| Consumo de batería alto | Mostrar advertencia, modo ahorro de energía |
| Costo AWS IVS | Monitorear uso, establecer límites de duración |

---

## Diagrama de Flujo: Streaming Nativo

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Mobile App     │────▶│  AWS IVS     │────▶│   Viewers   │
│  (Broadcaster)  │     │  (Ingest)    │     │   (HLS)     │
└─────────────────┘     └──────────────┘     └─────────────┘
        │                                           │
        │              ┌──────────────┐             │
        └─────────────▶│   Backend    │◀────────────┘
                       │  (WebSocket) │
                       │  Chat/Events │
                       └──────────────┘
```

---

## Próximos Pasos

1. ~~Definir preferencias sobre Seller Mode vs App Separada~~ ✅
2. ~~Priorizar fases según necesidades del negocio~~ ✅
3. Configurar cuenta AWS IVS para producción
4. ~~Comenzar implementación Fase 1~~ ✅

---

## Registro de Implementación

### FASE 1: Infraestructura Base - ✅ COMPLETADA (2026-01-16)

**Archivos creados:**
- `backend/src/live/dto/native-stream.dto.ts` - DTOs para credenciales nativas y OBS

**Archivos modificados:**
- `backend/src/live/dto/index.ts` - Export de nuevos DTOs
- `backend/src/live/live.service.ts` - Nuevos métodos:
  - `getNativeStreamCredentials()` - Obtener credenciales RTMP para mobile
  - `getOBSSetupInfo()` - Obtener info de configuración OBS
  - `verifyStreamOwnership()` - Verificar permisos
  - `regenerateStreamKey()` - Regenerar clave comprometida
- `backend/src/live/live.controller.ts` - Nuevos endpoints:
  - `GET /api/v1/live/streams/:id/native-credentials` (Seller)
  - `GET /api/v1/live/affiliate/streams/:id/native-credentials` (Affiliate)
  - `GET /api/v1/live/streams/:id/obs-setup` (Seller)
  - `GET /api/v1/live/affiliate/streams/:id/obs-setup` (Affiliate)
  - `POST /api/v1/live/streams/:id/regenerate-key` (Seller)
  - `POST /api/v1/live/affiliate/streams/:id/regenerate-key` (Affiliate)

**Verificación:**
- Backend compila sin errores
- Servicio AWS IVS Mock funcional
- Servicio AWS IVS Real preparado (requiere credenciales AWS)

### FASE 2: Streaming Nativo Mobile (Affiliates) - ✅ COMPLETADA (2026-01-16)

**Archivos creados:**
- `mobile/src/services/live.service.ts` - Servicio completo para:
  - Obtener credenciales nativas (seller y affiliate)
  - Obtener info OBS (seller y affiliate)
  - Regenerar stream keys
  - CRUD de streams
  - Gestión de productos en stream
  - Stats de streaming
- `mobile/src/screens/live/NativeBroadcastScreen.tsx` - Pantalla de broadcast con:
  - Preview de cámara (expo-camera CameraView)
  - Permisos de cámara y micrófono
  - Modal de credenciales RTMP (copiar, compartir)
  - Instrucciones para apps externas (Larix, Prism)
  - Controles de cámara (flip, flash, mic)
  - Chat overlay en vivo
  - Panel de productos con highlight
  - Analytics en tiempo real
  - Integración WebSocket para stats

**Archivos modificados:**
- `mobile/package.json` - Agregado `expo-clipboard: ~7.0.1`
- `mobile/src/navigation/LiveNavigator.tsx` - Nueva ruta `NativeBroadcast`
- `mobile/src/screens/live/CreateAffiliateLiveStreamScreen.tsx`:
  - Usa `liveService` en lugar de `affiliatesService`
  - Navega a `NativeBroadcast` con `hostType: 'affiliate'`
- `mobile/src/screens/live/CreateLiveStreamScreen.tsx`:
  - Usa `liveService` para crear streams
  - Navega a `NativeBroadcast` con `hostType: 'seller'`
- `mobile/src/i18n/locales/es.json` - Nuevas traducciones:
  - `live.preview`, `live.loadingCredentials`, `live.failedToFetchCredentials`
  - `live.permissionsRequired`, `live.useExternalAppHint`, `live.streamCredentials`
  - `live.rtmpUrl`, `live.streamKey`, `live.copiedToClipboard`
  - `live.recommendedSettings`, `live.resolution`, `live.bitrate`, `live.maxBitrate`
  - `live.shareCredentials`, `live.openStreamingApp`, `live.selectStreamingApp`
  - `live.howToStream`, `live.instructionStep1-4`, `live.noProducts`

**Nota sobre RTMP Publishing:**
Dado que Expo managed workflow no soporta directamente RTMP publishing nativo,
la implementación actual usa un enfoque híbrido:
1. La app proporciona credenciales RTMP y preview de cámara
2. El usuario utiliza una app externa de streaming (Larix, Prism) con las credenciales
3. La app de GSHOP monitorea el estado del stream y maneja chat/productos/analytics

Para RTMP nativo completo, se requeriría:
- Eject de Expo a bare workflow, o
- Uso de `react-native-live-stream` con native modules

**Verificación:**
- Backend compila sin errores
- Nuevos archivos siguen patrones existentes del proyecto
- Navegación actualizada con nueva ruta
- Traducciones agregadas para UI completa

### FASE 3: Seller Mode Mobile - ✅ COMPLETADA (2026-01-16)

**Archivos creados:**
- `mobile/src/contexts/UserRoleContext.tsx` - Contexto para manejo de roles:
  - Estados: `currentRole`, `availableRoles`, `isSellerVerified`, `isAffiliateActive`
  - Métodos: `switchRole()`, `refreshRoleStatus()`
  - Permisos derivados: `canStream`, `canManageProducts`, `canAccessSellerDashboard`, `canAccessAffiliateDashboard`
  - Persistencia de rol seleccionado en AsyncStorage
- `mobile/src/screens/settings/RoleSwitcherScreen.tsx` - Pantalla de cambio de rol:
  - Visualización de roles disponibles (buyer/seller/affiliate)
  - Opciones bloqueadas para roles no disponibles
  - Lista de features por cada rol
  - Opciones para convertirse en affiliate o seller
  - Navegación a registro de affiliate
- `mobile/src/screens/seller/SellerDashboardScreen.tsx` - Dashboard de seller simplificado:
  - Estadísticas: ventas de hoy, ventas totales, pedidos, productos
  - Banner "Ir en vivo" para iniciar streaming
  - Rating y reseñas del vendedor
  - Acciones rápidas: agregar producto, ver productos, pedidos, analytics
  - Consejo del día para sellers
- `mobile/src/services/seller.service.ts` - Servicio para operaciones de seller:
  - `getStats()` - Estadísticas del dashboard
  - `getProducts()` / `getProduct()` - Listar/obtener productos
  - `createProduct()` / `updateProduct()` / `deleteProduct()` - CRUD de productos
  - `uploadProductImages()` - Subida de imágenes
  - `getOrders()` / `updateOrderStatus()` - Gestión de pedidos
  - `addTracking()` - Agregar tracking a pedidos
- `mobile/src/navigation/SellerNavigator.tsx` - Navegador para pantallas de seller:
  - Rutas preparadas para: productos, agregar producto, pedidos, analytics

**Archivos modificados:**
- `mobile/App.tsx`:
  - Import y uso de `UserRoleProvider` envolviendo la app
- `mobile/src/navigation/AppNavigator.tsx`:
  - Import de `useUserRole` y `SellerNavigator`
  - Nueva tab `SellerDashboard` (condicional según `canAccessSellerDashboard`)
  - Icono de storefront para la tab de seller
- `mobile/src/navigation/ProfileNavigator.tsx`:
  - Nueva ruta `RoleSwitcher` para cambio de modo
  - Import de `RoleSwitcherScreen`
- `mobile/src/i18n/locales/es.json`:
  - Sección `roleSwitch`: traducciones para pantalla de cambio de rol
  - Sección `sellerDashboard`: traducciones para dashboard de seller

**Características principales:**
- **Sistema de roles**: Los usuarios pueden cambiar entre buyer/seller/affiliate según sus permisos
- **Tab condicional**: La tab de "Tienda" solo aparece para sellers verificados
- **Dashboard simplificado**: Vista móvil optimizada del panel de seller
- **Navegación unificada**: Acceso a streaming desde el dashboard de seller

**Verificación:**
- Archivos nuevos compilan sin errores de TypeScript
- Navegación condicional funciona según rol del usuario
- Traducciones completas en español
- Patrones consistentes con el resto del proyecto

### FASE 4: UI Carrito TikTok Style - ✅ COMPLETADA (2026-01-16)

**Archivos creados:**
- `mobile/src/components/live/ProductOverlayTikTok.tsx` - Overlay de productos estilo TikTok:
  - Producto "pinneado" con animaciones (bounce, glow, pulse)
  - Contador de compras en tiempo real (ej: "🔥 47 vendidos durante este live")
  - Timer de oferta especial con countdown visual
  - Mini carousel de productos deslizable
  - Quick-buy con haptic feedback
  - Long-press para pin (hosts)
  - Animaciones con Animated API de React Native
- `mobile/src/components/live/LiveCheckoutModal.tsx` - Modal de checkout sin salir del live:
  - 3 pasos: selección de variante → checkout → éxito
  - Selección rápida de talla/color/variante
  - Preview de dirección guardada
  - Botón de compra rápida con precio total
  - Animación de confetti en compra exitosa
  - Slide-up modal con backdrop blur
- `mobile/src/components/live/PurchaseNotification.tsx` - Sistema de notificaciones de compra:
  - `PurchaseNotification` - Notificaciones toast con slide-in desde la derecha
  - `PurchaseAnimation` - Partículas animadas (emojis flotantes)
  - `PurchaseCelebration` - Banner celebratorio para compras grandes
  - `usePurchaseNotifications()` hook para fácil integración
  - Cola de notificaciones con procesamiento secuencial
  - Haptic feedback en cada compra

**Archivos modificados:**
- `backend/src/live/live.gateway.ts` - Nuevos eventos WebSocket:
  - `pinProduct` - Host pinnea un producto destacado
  - `unpinProduct` - Host quita el pin de producto
  - `purchaseMade` - Viewer realiza una compra
  - `getStreamPurchaseStats` - Obtener estadísticas de compras
  - `startFlashSale` - Iniciar oferta flash con timer
  - Eventos emitidos: `productPinned`, `productUnpinned`, `newPurchase`, `flashSaleStarted`, `flashSaleEnded`, `purchaseAnimation`
- `backend/src/live/live.service.ts` - Nuevos métodos para TikTok style:
  - `incrementStreamPurchaseCount()` - Contador de compras por producto
  - `getStreamPurchaseStats()` - Estadísticas totales y por producto
  - `clearStreamPurchaseCounts()` - Limpiar contadores al terminar stream
  - `getPinnedProduct()` - Obtener producto pinneado actual
  - `getActiveStreamProducts()` - Obtener productos activos del stream
  - Sistema de cache en memoria para contadores (Map<streamId, Map<productId, count>>)
- `mobile/src/screens/live/LiveStreamScreen.tsx` - Integración para viewers:
  - Import de nuevos componentes TikTok style
  - Estados: `pinnedProductId`, `purchaseStats`, `timerEndTime`
  - Hook `usePurchaseNotifications()` para notificaciones
  - Socket listeners: `productPinned`, `productUnpinned`, `newPurchase`, `flashSaleStarted`, `flashSaleEnded`
  - Handler `handleCheckoutSuccess` que emite `purchaseMade` al WebSocket
  - Render de `ProductOverlayTikTok`, `PurchaseNotification`, `PurchaseCelebration`
  - Cambio de `QuickCheckoutModal` a `LiveCheckoutModal`
- `mobile/src/screens/live/NativeBroadcastScreen.tsx` - Integración para hosts:
  - Import de componentes TikTok style + expo-haptics
  - Estados TikTok: `pinnedProductId`, `purchaseStats`, `timerEndTime`
  - Hook `usePurchaseNotifications()` para ver compras en tiempo real
  - Socket listeners para eventos de compra y pin
  - Handler `handlePinProduct()` para pinnear productos con haptic
  - Handler `startFlashSale()` para iniciar ofertas flash
  - Modal de productos actualizado con botón de pin y badge "pinned"
  - Estadísticas de ventas por producto en el modal
  - Render de overlay y notificaciones de compra
- `mobile/src/i18n/locales/es.json` - Traducciones TikTok Shop:
  - `live.pinned`, `live.soldDuringStream`, `live.buy`
  - `live.longPressToPin`, `live.liveDeal`, `live.quantity`
  - `live.selectAllVariants`, `live.purchaseComplete`
  - `live.justBought`, `live.newPurchase`
  - `live.flashSale`, `live.endsIn`, `live.hurryUp`

**Características principales:**
- **Producto destacado**: El host puede pinnear un producto que aparece con animaciones llamativas
- **Contador en tiempo real**: Los viewers ven cuántas unidades se han vendido durante el live
- **Timer de ofertas**: Countdown visual para ofertas flash con urgencia
- **Checkout in-stream**: Compra sin salir del live con selección de variantes
- **Notificaciones de compra**: Toast notifications que muestran "Juan acaba de comprar iPhone!"
- **Celebraciones**: Confetti y animaciones para compras grandes
- **Haptic feedback**: Retroalimentación táctil en acciones importantes
- **Soporte host/viewer**: UI diferenciada para quien transmite vs quien ve

**Verificación:**
- Componentes siguen patrones de React Native/Animated API
- TypeScript tipado correctamente con interfaces
- Traducciones completas en español
- WebSocket events documentados y probados
- Integración tanto para viewers como hosts

### FASE 5: Mantener Soporte OBS - ✅ COMPLETADA (2026-01-16)

**Archivos creados:**
- `mobile/src/components/live/StreamMethodSelector.tsx` - Selector de método de streaming:
  - Dos opciones: streaming nativo (teléfono) y OBS/externo
  - Cards con iconos, descripciones y lista de características
  - Badge "Recomendado" en opción nativa
  - Selección visual con borde y fondo destacado
  - Haptic feedback al seleccionar
- `mobile/src/screens/live/GoLiveScreen.tsx` - Pantalla de entrada para ir en vivo:
  - Integra `StreamMethodSelector` para elegir método
  - Navega a `NativeBroadcast` si elige nativo
  - Navega a `OBSSetup` si elige OBS
  - Header con botón de retroceso
  - Botón "Continuar" habilitado solo con selección
- `mobile/src/screens/live/OBSSetupScreen.tsx` - Pantalla completa de configuración OBS:
  - Código QR con credenciales para escanear desde PC
  - Campos de URL RTMP y Stream Key con botones de copiar
  - Toggle para mostrar/ocultar stream key
  - Opción de regenerar stream key con confirmación
  - Sección de configuración recomendada (resolución, bitrate, keyframe, encoder)
  - Instrucciones paso a paso de configuración
  - Links de descarga para OBS Studio y Streamlabs
  - Indicador de estado de conexión
  - Vista de preview cuando OBS está conectado

**Archivos modificados:**
- `mobile/package.json`:
  - Agregado `expo-haptics: ~14.1.1` para feedback táctil
  - Agregado `react-native-qrcode-svg: ^6.3.2` para códigos QR
  - Agregado `react-native-svg: 15.11.2` (peer dependency)
- `mobile/src/navigation/LiveNavigator.tsx`:
  - Nueva ruta `GoLive` con params: `streamId`, `hostType`
  - Nueva ruta `OBSSetup` con params: `streamId`, `hostType`
  - Imports de `GoLiveScreen` y `OBSSetupScreen`
- `mobile/src/screens/live/CreateLiveStreamScreen.tsx`:
  - Cambiado navegación de `NativeBroadcast` a `GoLive`
  - El flujo ahora pasa por el selector de método
- `mobile/src/screens/live/CreateAffiliateLiveStreamScreen.tsx`:
  - Cambiado navegación de `NativeBroadcast` a `GoLive`
  - El flujo ahora pasa por el selector de método
- `mobile/src/i18n/locales/es.json` - Nuevas traducciones OBS:
  - `live.selectStreamMethod`, `live.selectStreamMethodDescription`
  - `live.streamFromPhone`, `live.streamFromPhoneDescription`
  - `live.streamWithOBS`, `live.streamWithOBSDescription`
  - Features: `live.quickSetup`, `live.noExtraEquipment`, `live.easyToUse`
  - Features OBS: `live.professionalQuality`, `live.multipleScenes`, `live.advancedControls`
  - OBS Setup: `live.obsSetup`, `live.scanFromPC`, `live.scanQRDescription`
  - `live.orCopyManually`, `live.rtmpUrl`, `live.streamKey`, `live.copied`
  - `live.showStreamKey`, `live.hideStreamKey`, `live.regenerateKey`
  - Settings: `live.recommendedSettings`, `live.resolution`, `live.bitrate`
  - Instructions: `live.obsStep1Title` - `live.obsStep5Description`
  - Downloads: `live.downloadOBS`, `live.downloadStreamlabs`
  - Status: `live.connectionStatus`, `live.waitingForConnection`, `live.connected`

**Características principales:**
- **Selector de método dual**: Los usuarios eligen entre streaming nativo o profesional
- **QR Code para configuración rápida**: Escanear desde PC para copiar credenciales
- **Gestión de stream keys**: Copiar, mostrar/ocultar, regenerar con confirmación
- **Guía de configuración completa**: Instrucciones paso a paso para configurar OBS
- **Settings recomendados**: Configuración óptima para calidad de stream
- **Links de descarga**: Acceso directo a OBS Studio y Streamlabs
- **Indicador de conexión**: Feedback visual del estado del stream
- **Flujo unificado**: Tanto sellers como affiliates usan el mismo selector

**Verificación:**
- Componentes usan patrones establecidos del proyecto
- TypeScript tipado correctamente
- Traducciones completas en español
- Navegación actualizada con nuevas rutas
- QR code funcional con react-native-qrcode-svg

### FASE 6: VOD/Replays - ✅ COMPLETADA (2026-01-19)

**Archivos creados (Backend):**
- `backend/src/live/vod.entity.ts` - Entidad para almacenar VODs:
  - Enums: `VodStatus` (processing, available, failed, deleted)
  - Enums: `StorageProvider` (r2, s3, cloudflare_stream)
  - Campos: streamId, videoUrl, thumbnailUrl, hlsManifestUrl, duration, fileSize
  - Campos: viewCount, status, storageProvider, qualities, errorMessage
  - Relación ManyToOne con LiveStream
- `backend/src/live/vod.service.ts` - Servicio completo para VOD:
  - `handleRecordingComplete()` - Webhook para IVS Recording
  - `copyRecordingToR2()` - Copiar de S3 a Cloudflare R2
  - `createMockVod()` - Crear VOD de prueba en desarrollo
  - `createVodFromStream()` - Crear VOD manualmente desde stream terminado
  - `findAll()` - Listar VODs con paginación y filtros
  - `findById()` / `findByStreamId()` - Obtener VOD individual
  - `findBySellerId()` / `findByAffiliateId()` - VODs por propietario
  - `getTrendingVods()` / `getRecentVods()` - Listas populares
  - `incrementViewCount()` - Conteo de vistas
  - `deleteVod()` - Eliminar VOD (soft delete)
- `backend/src/live/dto/vod.dto.ts` - DTOs para VOD:
  - `VodResponseDto` - Respuesta completa con stream, host, productos
  - `VodListResponseDto` - Lista paginada de VODs
  - `VodQueryDto` - Parámetros de consulta (page, limit, sellerId, affiliateId, status)
  - `CreateVodFromStreamDto` - Crear VOD desde stream
  - `IVSRecordingWebhookDto` - Payload del webhook de AWS IVS
  - `VodStatsDto` - Estadísticas de VOD
- `backend/src/live/vod.controller.ts` - Endpoints REST:
  - `GET /vod` - Listar VODs públicos
  - `GET /vod/trending` - VODs populares
  - `GET /vod/recent` - VODs recientes
  - `GET /vod/:id` - Obtener VOD por ID
  - `POST /vod/:id/view` - Incrementar vistas
  - `GET /vod/stream/:streamId` - VOD por stream ID
  - `GET /vod/seller/my-vods` - VODs del seller autenticado
  - `GET /vod/affiliate/my-vods` - VODs del affiliate autenticado
  - `DELETE /vod/seller/:id` - Eliminar VOD (seller)
  - `DELETE /vod/affiliate/:id` - Eliminar VOD (affiliate)
  - `POST /vod/seller/create-from-stream` - Crear VOD (seller)
  - `POST /vod/affiliate/create-from-stream` - Crear VOD (affiliate)
  - `POST /vod/webhook/ivs-recording` - Webhook de IVS Recording
- `backend/src/database/migrations/1769000000000-CreateLiveStreamVodsTable.ts`:
  - Crea tabla `live_stream_vods`
  - Enums: `vod_status_enum`, `storage_provider_enum`
  - Índices optimizados para queries comunes

**Archivos modificados (Backend):**
- `backend/src/live/live.module.ts`:
  - Import de `LiveStreamVod` entity
  - Providers: `VodService`
  - Controllers: `VodController`
  - Exports: `VodService`
- `backend/src/live/live.entity.ts`:
  - Relación OneToMany con `LiveStreamVod`
- `backend/src/live/dto/index.ts`:
  - Export de DTOs de VOD

**Archivos creados (Mobile):**
- `mobile/src/screens/live/VodListScreen.tsx` - Pantalla de lista de VODs:
  - Sección de trending VODs
  - Tabs: recientes / populares
  - Grid de VODs con thumbnails
  - Badges de duración y vistas
  - Pull-to-refresh
  - Paginación infinita
- `mobile/src/screens/live/VodPlayerScreen.tsx` - Reproductor de VOD:
  - Player expo-av con controles personalizados
  - Play/pause, seek ±10 segundos
  - Barra de progreso con thumbnail
  - Información del VOD (título, host, vistas)
  - Panel expandible de productos
  - Quick checkout modal
  - Tags del stream original

**Archivos modificados (Mobile):**
- `mobile/src/services/live.service.ts`:
  - Interfaces: `Vod`, `VodListResponse`
  - Métodos: `getVods()`, `getTrendingVods()`, `getRecentVods()`
  - Métodos: `getVodById()`, `getVodByStreamId()`, `incrementVodViewCount()`
  - Métodos: `getSellerVods()`, `getAffiliateVods()`
  - Métodos: `deleteSellerVod()`, `deleteAffiliateVod()`
  - Métodos: `createSellerVodFromStream()`, `createAffiliateVodFromStream()`
- `mobile/src/navigation/LiveNavigator.tsx`:
  - Nuevas rutas: `VodList`, `VodPlayer`
  - Imports de nuevas pantallas
- `mobile/src/screens/live/LiveStreamsScreen.tsx`:
  - Botón "Repeticiones" en filtros
  - Navegación a `VodList`
- `mobile/src/i18n/locales/es.json`:
  - Sección `vod`: traducciones completas para VOD
  - 40+ nuevas claves de traducción

**Características principales:**
- **Almacenamiento híbrido**: IVS Recording → S3 → Cloudflare R2
- **Procesamiento automático**: Webhook detecta fin de stream y crea VOD
- **Lista de VODs**: Trending, recientes, por seller/affiliate
- **Reproductor nativo**: Controles de video personalizados con expo-av
- **Productos en VOD**: Los productos del stream original disponibles para compra
- **Acceso desde Live**: Botón de "Repeticiones" en la pantalla de streams
- **Gestión de VODs**: Sellers y affiliates pueden ver/eliminar sus VODs

**Verificación:**
- Backend compila sin errores TypeScript
- Mobile compila sin errores TypeScript (archivos VOD)
- Migración de base de datos creada y lista
- Traducciones completas en español
- Navegación actualizada con nuevas rutas
- Patrones consistentes con el resto del proyecto

### FASE 7: Profile Actions (Notificaciones y Soporte) - ✅ COMPLETADA (2026-01-19)

**Archivos creados (Backend):**
- `backend/src/notifications/user-notification.entity.ts` - Entidad de notificaciones:
  - Enum `UserNotificationType`: order, promotion, system, live, price_drop
  - Campos: userId, title, message, type, isRead, data (JSONB), imageUrl, actionUrl
  - Relación ManyToOne con User (cascade delete)
- `backend/src/notifications/user-notifications.service.ts` - Servicio completo:
  - `getNotifications()` - Lista con filtros (unreadOnly, type, paginación)
  - `getNotificationById()` - Obtener una notificación
  - `getUnreadCount()` - Contador de no leídas
  - `markAsRead()` / `markAllAsRead()` - Marcar como leídas
  - `deleteNotification()` / `deleteMultiple()` - Eliminar notificaciones
  - Creadores especializados: `createOrderNotification()`, `createPromotionNotification()`, `createSystemNotification()`, `createLiveNotification()`, `createPriceDropNotification()`
- `backend/src/notifications/user-notifications.controller.ts` - Endpoints REST:
  - `GET /notifications` - Listar notificaciones del usuario
  - `GET /notifications/unread-count` - Contador de no leídas
  - `GET /notifications/:id` - Obtener notificación por ID
  - `PUT /notifications/:id/read` - Marcar como leída
  - `PUT /notifications/mark-all-read` - Marcar todas como leídas
  - `DELETE /notifications/:id` - Eliminar notificación
  - `DELETE /notifications/bulk` - Eliminar múltiples
- `backend/src/support/support.entity.ts` - Entidades de soporte:
  - `SupportTicket`: id, userId, subject, message, category, status, priority, email, orderId, adminResponse, assignedToId, resolvedAt
  - Enums: `TicketCategory` (order, payment, shipping, return, product, account, technical, other)
  - Enums: `TicketStatus` (open, in_progress, resolved, closed)
  - Enums: `TicketPriority` (low, medium, high, urgent)
  - `FAQ`: id, question, answer, category, isActive, order, viewCount, helpfulCount
- `backend/src/support/support.service.ts` - Servicio de soporte:
  - CRUD de tickets: `createTicket()`, `getUserTickets()`, `getTicket()`, `getAllTickets()`, `updateTicket()`
  - CRUD de FAQs: `getFAQs()`, `getFAQCategories()`, `createFAQ()`, `updateFAQ()`
  - Tracking: `markFAQHelpful()`, `incrementFAQView()`
  - Seed: `seedDefaultFAQs()` - 10 FAQs predeterminadas
- `backend/src/support/support.controller.ts` - Endpoints REST:
  - FAQs (públicos): `GET /support/faqs`, `GET /support/faqs/categories`, `POST /support/faqs/:id/helpful`, `POST /support/faqs/:id/view`
  - Tickets (usuario): `POST /support/tickets`, `POST /support/tickets/guest`, `GET /support/tickets`, `GET /support/tickets/:id`
  - Admin: `GET /support/admin/tickets`, `GET /support/admin/tickets/:id`, `PUT /support/admin/tickets/:id`, `POST /support/admin/faqs`, `PUT /support/admin/faqs/:id`, `POST /support/admin/faqs/seed`
- `backend/src/support/support.module.ts` - Módulo de soporte
- `backend/src/database/migrations/1768850200000-AddNotificationsAndSupport.ts`:
  - Crea tabla `user_notifications` con índices (userId+createdAt, userId+isRead)
  - Crea tabla `support_tickets` con índices (status+createdAt, userId+status)
  - Crea tabla `faqs` con índices (order, category+isActive)
  - Enums: user_notifications_type_enum, support_tickets_category_enum, support_tickets_status_enum, support_tickets_priority_enum

**Archivos modificados (Backend):**
- `backend/src/notifications/notifications.module.ts`:
  - Import de UserNotification entity
  - Providers/Controllers: UserNotificationsService, UserNotificationsController
- `backend/src/database/typeorm.config.ts`:
  - Registro de entidades: UserNotification, SupportTicket, FAQ
- `backend/src/app.module.ts`:
  - Import de NotificationsModule y SupportModule

**Archivos creados (Mobile):**
- `mobile/src/services/user-notifications.service.ts` - Servicio de notificaciones:
  - `getNotifications()` - Lista con filtros y paginación
  - `getUnreadCount()` - Contador de no leídas
  - `getNotification()` - Obtener por ID
  - `markAsRead()` / `markAllAsRead()` - Marcar como leídas
  - `deleteNotification()` / `deleteMultiple()` - Eliminar
  - Tipos: `UserNotification`, `UserNotificationType`, `UserNotificationsResponse`
- `mobile/src/services/support.service.ts` - Servicio de soporte:
  - `getFAQs()` / `getFAQCategories()` - Obtener FAQs
  - `markFAQHelpful()` / `incrementFAQView()` - Tracking de FAQs
  - `createTicket()` / `createGuestTicket()` - Crear tickets
  - `getUserTickets()` / `getTicket()` - Obtener tickets
  - Tipos: `SupportTicket`, `FAQ`, `TicketCategory`, `TicketStatus`, `TicketPriority`

**Archivos modificados (Mobile):**
- `mobile/src/screens/profile/NotificationsScreen.tsx`:
  - Import de userNotificationsService y useAuth
  - Carga de notificaciones desde backend
  - Soporte para nuevos tipos: 'live', 'price_drop'
  - Métodos reales: loadNotifications(), handleMarkAsRead(), handleMarkAllAsRead(), handleClearAll()
  - Manejo de error 401 (usuario no logueado)
- `mobile/src/screens/profile/SupportScreen.tsx`:
  - Import de supportService y useAuth
  - Estado de FAQs dinámico con fallback a traducciones
  - Carga de FAQs desde backend con loadFAQs()
  - Tracking de vistas de FAQ con incrementFAQView()
  - Campo de email para tickets de guest
  - Categoría de ticket
  - Envío de tickets via API (createTicket/createGuestTicket)
  - Loading state para FAQs

**Características principales:**
- **Sistema de notificaciones in-app**: Separado de push notifications
- **5 tipos de notificaciones**: order, promotion, system, live, price_drop
- **Iconos y colores por tipo**: Visual distintivo para cada tipo
- **Marcar como leídas**: Individual y masivo
- **FAQs dinámicas**: Cargadas desde backend con fallback a traducciones
- **Tickets de soporte**: Para usuarios logueados y guests
- **8 categorías de ticket**: order, payment, shipping, return, product, account, technical, other
- **Tracking de FAQs**: Conteo de vistas y "útil"
- **Admin panel ready**: Endpoints para gestión de tickets y FAQs

**Verificación:**
- Backend compila sin errores TypeScript
- Migración de base de datos lista para ejecutar
- Mobile integrado con servicios de backend
- Fallback de FAQs a traducciones si backend falla
- Soporte para usuarios guests (sin login)

### FASE 8: Push Notifications para Lives - ✅ COMPLETADA (2026-01-19)

**Archivos creados (Backend):**
- `backend/src/database/entities/streamer-follow.entity.ts` - Entidad para seguir streamers:
  - Campos: followerId, streamerId, notificationsEnabled, createdAt
  - Relaciones ManyToOne con User (follower y streamer)
  - Índices únicos para evitar duplicados
- `backend/src/live/followers.service.ts` - Servicio de seguidores:
  - `followStreamer()` / `unfollowStreamer()` - Seguir/dejar de seguir
  - `isFollowing()` - Verificar si sigue a un streamer
  - `toggleNotifications()` - Activar/desactivar notificaciones
  - `getFollowers()` / `getFollowing()` - Listas paginadas
  - `getStats()` - Estadísticas de followers/following
  - `getFollowerCount()` - Contador de seguidores
  - `getFollowerDeviceTokens()` - Tokens para push notifications
  - `getFollowerIds()` - IDs de seguidores con notificaciones activas
- `backend/src/live/followers.controller.ts` - Endpoints REST:
  - `POST /followers/:streamerId/follow` - Seguir streamer
  - `DELETE /followers/:streamerId/unfollow` - Dejar de seguir
  - `GET /followers/:streamerId/status` - Estado de seguimiento
  - `PUT /followers/:streamerId/notifications` - Toggle notificaciones
  - `GET /followers/my/followers` - Mis seguidores
  - `GET /followers/my/following` - A quién sigo
  - `GET /followers/my/stats` - Mis estadísticas
  - `GET /followers/:streamerId/count` - Contador público
- `backend/src/database/migrations/1769100000000-CreateStreamerFollowsTable.ts`:
  - Crea tabla `streamer_follows` con índices optimizados

**Archivos modificados (Backend):**
- `backend/src/notifications/user-notifications.service.ts`:
  - Nuevo método `createLiveNotificationForUsers()` - Crear notificación para múltiples usuarios
- `backend/src/live/live.service.ts`:
  - Nuevo método `sendLiveStartNotifications()` - Enviar push + in-app cuando inicia stream
  - Integración con FollowersService para obtener tokens y IDs
- `backend/src/live/live.module.ts`:
  - Import de StreamerFollow entity
  - Providers: FollowersService
  - Controllers: FollowersController

**Archivos creados (Mobile):**
- `mobile/src/services/followers.service.ts` - Cliente API:
  - `followStreamer()` / `unfollowStreamer()` - Seguir/dejar de seguir
  - `getFollowStatus()` - Estado de seguimiento
  - `toggleNotifications()` - Toggle notificaciones
  - `getMyFollowers()` / `getMyFollowing()` - Listas
  - `getMyStats()` - Estadísticas
  - `getFollowerCount()` - Contador
- `mobile/src/hooks/useFollowStreamer.ts` - Hook de estado:
  - Estados: isFollowing, notificationsEnabled, followerCount, loading
  - Acciones: toggleFollow, toggleNotifications, refresh
  - Integración con followersService
- `mobile/src/components/live/FollowButton.tsx` - Componente UI:
  - Botón de seguir/dejar de seguir con animación
  - Toggle de notificaciones (campana)
  - Contador de seguidores
  - Estados de loading
- `mobile/src/components/NotificationHandler.tsx` - Handler global:
  - Inicializa notificaciones cuando usuario se autentica
  - Listener para notificaciones recibidas
  - Listener para taps en notificaciones
  - Navegación automática según tipo de notificación
  - Soporte para: live_stream_started, order, price_drop, promotion
- `mobile/src/hooks/useLiveNotificationHandler.ts` - Hook específico para lives:
  - Maneja navegación a LiveStream cuando tap en notificación de live

**Archivos modificados (Mobile):**
- `mobile/App.tsx`:
  - Import y uso de NotificationHandler envolviendo navegación

**Características principales:**
- **Sistema de followers**: Usuarios pueden seguir streamers favoritos
- **Toggle de notificaciones**: Activar/desactivar por streamer
- **Push notifications**: FCM cuando streamer inicia live
- **In-app notifications**: Almacenadas en DB para historial
- **Navegación automática**: Tap en notificación lleva al live
- **Contador de seguidores**: Visible en perfil del streamer

**Verificación:**
- Backend compila sin errores TypeScript
- Migración de base de datos lista
- Mobile integrado con servicios
- Navegación funcional desde notificaciones

### FASE 9: Picture-in-Picture Mode - ✅ COMPLETADA (2026-01-19)

**Archivos creados (Mobile):**
- `mobile/src/contexts/PiPContext.tsx` - Contexto global para PiP:
  - Estados: isActive, streamData (id, title, hlsUrl, hostType, hostName, viewerCount)
  - Ref: socketRef para mantener conexión WebSocket
  - Métodos: `enterPiP()` - Activar modo PiP con datos del stream
  - Métodos: `exitPiP()` - Cerrar PiP y desconectar socket
  - Métodos: `updateViewerCount()` - Actualizar contador de viewers
  - Métodos: `returnToFullscreen()` - Volver a pantalla completa
  - Hook: `usePiP()` para acceso desde componentes
- `mobile/src/components/live/MiniPlayer.tsx` - Mini player flotante:
  - Video player con expo-av (ResizeMode.COVER)
  - Draggable con PanResponder
  - Snap to edges (izquierda/derecha) al soltar
  - Badge "LIVE" con indicador rojo
  - Botón de expandir a fullscreen
  - Botón de cerrar
  - Info bar con título y viewer count
  - Indicador de buffering
  - Dimensiones: 160x90px + info bar
  - z-index alto para flotar sobre todo

**Archivos modificados (Mobile):**
- `mobile/App.tsx`:
  - Import de PiPProvider y MiniPlayer
  - PiPProvider envolviendo NavigationContainer
  - MiniPlayer renderizado como overlay flotante
- `mobile/src/screens/live/LiveStreamScreen.tsx`:
  - Import de usePiP hook
  - Nuevo param `fromPiP` para detectar retorno desde PiP
  - useEffect para restaurar socket desde PiP
  - Método `minimizeToPiP()` - Transferir estado a PiP context
  - Botón PiP en header (icono picture-in-picture-alt)
  - No desconectar socket al salir si está en PiP
  - Estilo `pipButton` para el botón

**Características principales:**
- **Mini player flotante**: Video continúa mientras navegas
- **Draggable**: Arrastra el player a cualquier posición
- **Snap to edges**: Se adhiere al borde más cercano
- **Mantiene conexión**: WebSocket activo durante PiP
- **Retorno seamless**: Volver a fullscreen sin reconectar
- **Controles mínimos**: Expandir y cerrar
- **Info visible**: Título y viewers en mini player

**Verificación:**
- Archivos compilan sin errores TypeScript
- PiPProvider integrado en jerarquía de providers
- MiniPlayer se renderiza sobre toda la app
- Navegación funciona con PiP activo
- Socket se preserva durante transiciones
