# Plan: Streaming Nativo desde Mobile App + Soporte OBS

## Progreso de Implementación

| Fase | Estado | Fecha |
|------|--------|-------|
| FASE 1: Infraestructura Base | ✅ COMPLETADA | 2026-01-16 |
| FASE 2: Streaming Nativo Mobile | ✅ COMPLETADA | 2026-01-16 |
| FASE 3: Seller Mode Mobile | ⏳ Pendiente | - |
| FASE 4: UI Carrito TikTok Style | ⏳ Pendiente | - |
| FASE 5: Mantener Soporte OBS | ⏳ Pendiente | - |
| FASE 6: VOD/Replays | ⏳ Pendiente | - |

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
