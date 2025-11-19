# 📺 Plan de Implementación: Live Streaming Enhancement - GSHOP

**Proyecto:** GSHOP - TikTok Shop Clone MVP
**Módulo:** Enhanced Live Shopping Platform
**Fecha:** Noviembre 2025
**Estado:** ✅ Fase 3 Completa (100%) - Seller Panel, Analytics, Push Notifications y Scheduled Streams completados
**Última Actualización:** 2025-01-19

---

## 📋 Resumen Ejecutivo

Este documento presenta el plan de trabajo para transformar el sistema actual de Live Shopping de GSHOP en una plataforma escalable y completa similar a TikTok Shop, incluyendo streaming de baja latencia, overlay de productos, chat en tiempo real, descubrimiento inteligente de lives y checkout integrado.

## 📍 Progreso Actual (Enero 2025)

### ✅ FASE 1 - Semana 1: Setup de Infraestructura Cloud (COMPLETADO)

#### 1. AWS Setup ✅

- ✅ Servicio mock de AWS IVS implementado (`aws-ivs-mock.service.ts`)
- ✅ Creación de canales IVS con stream keys
- ✅ URLs de ingest RTMP y playback HLS generadas
- ✅ Simulación de webhooks de stream start/end
- ✅ Generación de URLs de thumbnails y recordings
- 📝 **Nota:** Usando credenciales mock hasta obtener keys reales de AWS

#### 2. Database Schema Migration ✅

- ✅ Extendida entidad `LiveStream` con nuevos campos:
  - `thumbnailUrl`, `ivsChannelArn`, `category`, `tags`
  - `likesCount`, `sharesCount`
- ✅ Extendida entidad `LiveStreamProduct` con:
  - `isHighlighted`, `position`, `highlightedAt`
- ✅ Extendida entidad `LiveStreamMessage` con:
  - `isDeleted`, `deletedBy`, `deletedAt` (moderación)
- ✅ Extendida entidad `LiveStreamViewer` con:
  - `isBanned`, `timeoutUntil`, `bannedBy`, `banReason`
- ✅ Nueva entidad `LiveStreamReaction` (likes, hearts, fire, etc.)
- ✅ Nueva entidad `LiveStreamMetrics` (métricas cada 30-60s)
- ✅ Migración generada: `1763400000000-EnhanceLiveStreamingEntities.ts`
- ✅ Índices optimizados creados

#### 3. Redis Setup ✅

- ✅ Servicio mock de cache implementado (`cache-mock.service.ts`)
- ✅ Operaciones soportadas: get, set, del, expire, incr, decr, sadd, smembers
- ✅ TTL automático y cleanup de entradas expiradas
- ✅ Módulo global de cache (`CacheModule`)
- 📝 **Nota:** Usando in-memory mock, puede cambiarse a Redis real cuando esté disponible

#### 4. Environment Configuration ✅

- ✅ Variables de AWS IVS agregadas a `.env` y `.env.example`
- ✅ Configuración de RTMP/HLS URLs
- ✅ WebSocket configuration
- ✅ Live streaming features (metrics interval, max viewers, rate limits)
- ✅ CDN y S3 configuration (mock)

### ✅ FASE 1 - Semana 2-3: Backend API Core (COMPLETADO - 100%)

#### 5. Enhanced Live Stream Service ✅

- ✅ Integración con AWS IVS Mock Service
- ✅ `createLiveStream`: Crea canal IVS + entidad de DB
- ✅ `startLiveStream`: Simula stream started webhook
- ✅ `endLiveStream`: Simula stream ended webhook + analytics
- ✅ Generación automática de thumbnails y URLs de playback

#### 6. Product Overlay System ✅

- ✅ API para highlight/hide productos durante live
- ✅ Método `highlightProduct`: Muestra producto en overlay
- ✅ Método `hideProduct`: Oculta producto del overlay
- ✅ Método `reorderProducts`: Reordena productos por posición
- ✅ Método `getHighlightedProducts`: Obtiene productos visibles
- ✅ WebSocket events para sincronizar overlay en tiempo real
- ✅ Endpoints REST agregados al `LiveController`:
  - `PUT /live/streams/:id/products/:productId/highlight`
  - `PUT /live/streams/:id/products/:productId/hide`
  - `PUT /live/streams/:id/products/reorder`
  - `GET /live/streams/:id/products/highlighted`

#### 7. Advanced Chat System ✅

- ✅ Mejoras en `LiveGateway` para reacciones y moderación
- ✅ Rate limiting para mensajes (5 msg/10s con sliding window)
- ✅ Sistema de badges (seller, affiliate, VIP) basado en roles y compras
- ✅ Funciones de moderación (timeout, ban, delete message)
- ✅ WebSocket events implementados:
  - `sendReaction` - 6 tipos de reacciones (like, heart, fire, clap, laugh, wow)
  - `deleteMessage` - Solo hosts pueden borrar mensajes
  - `banUser` - Ban permanente con razón tracking
  - `timeoutUser` - Mute temporal configurable
- ✅ Verificación automática de ban/timeout en `sendMessage`
- ✅ Métodos del servicio:
  - `sendReaction()`, `getUserBadge()`, `deleteMessage()`
  - `banUser()`, `timeoutUser()`, `isUserBanned()`, `isUserTimedOut()`
  - `checkRateLimit()`, `clearRateLimit()`

#### 8. Real-time Metrics Service ✅

- ✅ Servicio `LiveMetricsService` implementado (`live-metrics.service.ts`)
- ✅ Cron job cada 60 segundos para streams activos (`@Cron(CronExpression.EVERY_MINUTE)`)
- ✅ Métricas capturadas:
  - `viewerCount` - Desde WebSocket gateway
  - `messagesPerMinute` - Mensajes últimos 60s
  - `reactionsCount` - Reacciones últimos 60s
  - `purchasesCount` - Órdenes durante el stream
  - `revenue` - Suma total de ventas
  - `conversionRate` - (purchases / peak viewers) \* 100
- ✅ Almacenamiento en `live_stream_metrics`
- ✅ WebSocket broadcast de métricas en tiempo real a viewers
- ✅ REST API endpoints:
  - `GET /live/streams/:id/metrics/history?limit=60`
  - `GET /live/streams/:id/metrics/summary`
  - `POST /live/streams/:id/metrics/collect`
- ✅ Auto cleanup de métricas antiguas (>7 días) cada día a las 3AM
- ✅ Métodos del servicio:
  - `collectMetricsForActiveStreams()`, `collectStreamMetrics()`
  - `getStreamMetricsHistory()`, `getStreamMetricsSummary()`
  - `cleanupOldMetrics()`

### 📊 Resumen de Progreso

| Componente                    | Estado        | Progreso |
| ----------------------------- | ------------- | -------- |
| **Semana 1: Infraestructura** | ✅ Completado | 100%     |
| - AWS IVS Mock                | ✅            | 100%     |
| - DB Migrations               | ✅            | 100%     |
| - Redis Mock                  | ✅            | 100%     |
| - Environment Config          | ✅            | 100%     |
| **Semana 2-3: Backend Core**  | ✅ Completado | 100%     |
| - Live Stream Service         | ✅            | 100%     |
| - Product Overlay System      | ✅            | 100%     |
| - Advanced Chat System        | ✅            | 100%     |
| - Metrics Service             | ✅            | 100%     |
| **FASE 1 TOTAL**              | ✅            | **100%** |

### 📁 Archivos Implementados en Fase 1

#### Backend Core (`backend/src/live/`)

- ✅ `live.entity.ts` - Entidades extendidas (LiveStreamReaction, LiveStreamMetrics)
- ✅ `live.service.ts` - Métodos de reacciones, badges, moderación, rate limiting
- ✅ `live.gateway.ts` - WebSocket events (sendReaction, deleteMessage, banUser, timeoutUser)
- ✅ `live-metrics.service.ts` - **NUEVO** - Servicio de métricas con cron jobs
- ✅ `live.controller.ts` - REST endpoints para métricas
- ✅ `live.module.ts` - Módulo actualizado con LiveMetricsService
- ✅ `aws-ivs.service.ts` - Fix de importación IvsClient
- ✅ `package.json` - Instalado `@aws-sdk/client-ivs`

#### Funcionalidades Añadidas

1. **Reacciones en Tiempo Real**
   - 6 tipos: like, heart, fire, clap, laugh, wow
   - Persistencia en DB + broadcast WebSocket
   - Incremento automático de `likesCount` en stream

2. **Sistema de Badges**
   - Badge "seller" - Dueño del stream
   - Badge "affiliate" - Host afiliado
   - Badge "VIP" - Usuarios con compras en el stream
   - Auto-asignación en mensajes de chat

3. **Moderación Completa**
   - Ban permanente con tracking de razón y moderador
   - Timeout temporal con expiración automática
   - Delete message con soft-delete
   - Verificación en cada mensaje

4. **Rate Limiting**
   - Sliding window de 10 segundos
   - Límite de 5 mensajes por usuario
   - In-memory con auto-cleanup

5. **Métricas en Tiempo Real**
   - Cron job cada 60s para streams activos
   - 7 métricas capturadas por snapshot
   - Broadcast automático vía WebSocket
   - Cleanup de métricas antiguas (>7 días)
   - REST API para historial y agregaciones

### 📊 Resumen Técnico - Fase 1

**Estadísticas de Implementación:**

- ✅ **8 componentes** completados
- ✅ **2 entidades nuevas** (LiveStreamReaction, LiveStreamMetrics)
- ✅ **4 entidades extendidas** (LiveStream, LiveStreamProduct, LiveStreamMessage, LiveStreamViewer)
- ✅ **1 servicio nuevo** (LiveMetricsService con 6 métodos)
- ✅ **9 métodos nuevos** en LiveService (reacciones, badges, moderación)
- ✅ **5 WebSocket events** nuevos (sendReaction, deleteMessage, banUser, timeoutUser)
- ✅ **3 REST endpoints** para métricas
- ✅ **2 cron jobs** (metrics collection, cleanup)
- ✅ **1 dependencia** instalada (@aws-sdk/client-ivs)

**Líneas de Código Agregadas:** ~700 líneas
**Archivos Modificados:** 7 archivos
**Archivos Nuevos:** 1 archivo (live-metrics.service.ts)

**Testing Status:**

- ✅ Build exitoso sin errores TypeScript
- ⏳ Pendiente: Unit tests (Fase 2+)
- ⏳ Pendiente: E2E tests (Fase 2+)

### 🎯 Próximos Pasos

**✅ FASE 1 COMPLETADA** - Todas las tareas de infraestructura y backend core finalizadas.

**Siguiente: FASE 2 - Descubrimiento & Recomendaciones**

1. **Feed Algorithm para Live Streams**
   - Algoritmo de ranking para streams activos
   - Personalización basada en historial de usuario
   - Cache de resultados para performance

2. **Sistema de Búsqueda y Filtros**
   - Búsqueda por categorías, tags, vendedor
   - Filtros por idioma, precio, popularidad
   - Elasticsearch integration (opcional)

3. **Trending & Popular Streams**
   - Algoritmo de trending basado en engagement
   - Categorías "Hot", "New", "Top Sellers"
   - Time-based trending (última hora, día, semana)

4. **Notificaciones Push**
   - Notificar followers cuando seller inicia stream
   - Notificaciones de descuentos especiales en live
   - Integración con Firebase Cloud Messaging (mobile)

5. **Follow System**
   - Usuarios pueden seguir a sellers/affiliates
   - Feed personalizado de "Following" streams
   - Contador de followers en perfiles

### 📁 Archivos Implementados en Fase 2

#### Backend Discovery & Recommendations (`backend/src/live/`)

- ✅ `live.service.ts:868-1061` - Discovery methods (discover, search, trending, categories)
- ✅ `live.service.ts:1063-1337` - **NUEVO** Recommendation engine (collaborative, content-based, hybrid)
- ✅ `live.controller.ts:302-372` - Discovery & recommendation endpoints

#### Funcionalidades Añadidas - Week 4 (Discovery)

1. **Active Streams Discovery**
   - Paginación completa con page/limit
   - Filtros por category, tags
   - 4 modos de ordenamiento (viewers, likes, trending, recent)
   - Cache de 30 segundos para performance
   - Endpoint: `GET /api/v1/live/discover`

2. **Search & Categories**
   - Full-text search en title + description
   - Lista dinámica de categorías desde DB
   - Filtros combinables
   - Endpoints: `GET /api/v1/live/search`, `GET /api/v1/live/categories`

3. **Trending Algorithm**
   - Score dinámico: `viewers + (likes × 0.5) + (sales × 2) - age_penalty`
   - Cálculo on-the-fly (sin materialized view)
   - Endpoint: `GET /api/v1/live/trending`

#### Funcionalidades Añadidas - Week 5 (Recommendations)

1. **Collaborative Filtering**
   - Análisis de comportamiento de usuarios similares
   - "Users who watched X also watched Y"
   - Identifica usuarios con ≥2 streams en común
   - Scoring basado en popularidad entre usuarios similares

2. **Content-Based Filtering**
   - Aprende preferencias: top 3 categorías, top 5 sellers/affiliates
   - Excluye streams ya vistos
   - Scoring basado en coincidencias (max 100 puntos)

3. **Hybrid "For You" Feed**
   - Combina collaborative (60%) + content-based (40%)
   - Deduplicación inteligente con boost para coincidencias
   - Fallback a trending para usuarios nuevos
   - Razones de recomendación incluidas
   - Endpoint: `GET /api/v1/live/for-you`

### 📊 Resumen Técnico - Fase 2

**Estadísticas de Implementación:**

- ✅ **6 features** completadas (discover, search, trending, categories, collaborative, content-based, for-you)
- ✅ **7 métodos nuevos** en LiveService
- ✅ **5 REST endpoints** (discover, search, trending, categories, for-you)
- ✅ **3 algoritmos** (trending, collaborative filtering, content-based filtering)
- ✅ **1 sistema hybrid** con merge inteligente
- ✅ **Cache integration** (30s TTL para discovery)

**Líneas de Código Agregadas:** ~470 líneas
**Archivos Modificados:** 2 archivos (live.service.ts, live.controller.ts)
**Archivos Nuevos:** 0 (usó entidades existentes)

**Testing Status:**

- ✅ Build exitoso sin errores TypeScript
- ✅ Usa entidad `live_stream_viewers` existente como viewing history
- ⏳ Pendiente: Unit tests (Fase 3+)
- ⏳ Pendiente: E2E tests (Fase 3+)

---

### ✅ FASE 3 - Semana 6-7: Seller Panel & Analytics (COMPLETADO - Enero 2025)

#### 📦 Funcionalidades Implementadas

**Semana 6: Seller Dashboard**

✅ **Tarea 15: Enhanced Live Stream Creation UI**
- ✅ Selector de productos con checkboxes durante creación
- ✅ Upload de thumbnail con preview en tiempo real
- ✅ Selector de categoría (7 categorías predefinidas)
- ✅ Input de tags (comma-separated)
- ✅ Modal expandido con mejor UX (max-w-2xl, scroll)
- ✅ Agregado automático de productos al stream tras creación
- ✅ Internacionalización lista para i18n

✅ **Tarea 16: Stream Management Interface**
- ✅ RTMP credentials display con copy buttons
- ✅ Modal completo de instrucciones de OBS Studio
  - 5 pasos detallados con color coding
  - Links a descarga oficial de OBS
  - Recomendaciones de bitrate y resolución
  - Warnings y mejores prácticas
  - Copy-to-clipboard para URL y Stream Key
- ✅ Controles de productos durante live (highlight/hide)
  - Botón "Show" para mostrar producto en overlay
  - Botón "Hide" para ocultar del overlay
  - Badge "Featured" para productos highlighted
  - Star icon visual indicator
  - Solo aparecen cuando stream está en vivo

✅ **Tarea 17: Real-time Analytics Panel**
- ✅ 4 Summary cards con métricas clave:
  - Avg Viewers (con ícono TrendingUp)
  - Total Messages (chat activity)
  - Total Purchases
  - Conversion Rate (%)
- ✅ Gráfico de Area Chart - Viewer Count Over Time
  - Gradient azul con fill
  - Timestamps en eje X
  - Tooltips informativos
- ✅ Gráfico de Line Chart - Chat Activity (Messages/Min)
  - Línea verde con dots
  - Actualización en tiempo real
- ✅ Gráfico de Bar Chart - Revenue Tracking
  - Barras amarillas por timestamp
  - Formato de currency en tooltips
- ✅ Tabla de Product Performance
  - Imagen del producto
  - Orders count
  - Revenue generado
  - Conversion rate por producto
- ✅ Auto-refresh cada 30 segundos cuando stream está en vivo
- ✅ Collapsible panel
- ✅ Empty state con mensaje informativo

**Semana 7: Moderation & Notifications**

✅ **Tarea 18: Chat Moderation Tools**
- ✅ Panel collapsible "Chat Moderation"
- ✅ Vista de últimos 20 mensajes con timestamps
- ✅ 3 acciones de moderación por mensaje:
  - **Delete**: Botón rojo para eliminar mensaje específico
  - **Timeout**: Botón amarillo para mute temporal (5 min configurable)
  - **Ban**: Botón rojo para ban permanente con razón
- ✅ Confirmaciones con modals nativos
- ✅ Refresh automático tras acciones
- ✅ Info box con explicación de acciones
- ✅ Solo visible cuando stream está en vivo
- ✅ Empty state cuando no hay mensajes

✅ **Tarea 19: Push Notifications**
- ✅ Servicio completo de notificaciones con FCM
- ✅ Notificación automática cuando seller inicia live stream
- ✅ Notificaciones de compras a vendedor (con buyer name y monto)
- ✅ Sistema de device tokens (registro/remoción)
- ✅ Soporte para iOS, Android y Web
- ✅ Método para scheduled stream reminders (15 min antes)
- ✅ Graceful degradation si FCM no está configurado
- ✅ Integración con LiveService y OrdersService

✅ **Tarea 20: Scheduled Streams** (COMPLETADO)
- ✅ Campo `scheduledAt` en entidad LiveStream (ya existía)
- ✅ UI para programar lives futuros (checkbox + datetime-local input)
- ✅ Countdown timer en seller panel con formato dinámico
- ✅ Cron job para notificaciones 15 min antes del inicio
- ✅ Integración con NotificationsService para reminders
- ✅ LiveSchedulerService con cleanup automático de memoria

### 📊 Resumen de Progreso - Fase 3

| Componente                       | Estado        | Progreso |
| -------------------------------- | ------------- | -------- |
| **Semana 6: Seller Dashboard**   | ✅ Completado | 100%     |
| - Enhanced Stream Creation UI    | ✅            | 100%     |
| - Stream Management Interface    | ✅            | 100%     |
| - Real-time Analytics Panel      | ✅            | 100%     |
| **Semana 7: Moderation & Notif** | ✅ Completado | 100%     |
| - Chat Moderation Tools          | ✅            | 100%     |
| - Push Notifications (Backend)   | ✅            | 100%     |
| - Scheduled Streams              | ✅            | 100%     |
| **FASE 3 TOTAL**                 | ✅            | **100%** |

### 📁 Archivos Implementados en Fase 3

#### Backend - Push Notifications (`backend/src/notifications/`)

- ✅ `notifications.service.ts` - **NUEVO** - Servicio completo de FCM
  - `sendToDevice()` - Enviar a un token
  - `sendToMultipleDevices()` - Enviar a múltiples tokens (batch)
  - `notifyLiveStreamStarted()` - Notificar followers cuando stream inicia
  - `notifyPurchaseMade()` - Notificar seller de compra
  - `notifyScheduledStreamReminder()` - Reminder 15 min antes
  - `registerDeviceToken()` - Guardar token de dispositivo
  - `removeDeviceToken()` - Desactivar token
  - Inicialización dinámica de Firebase (no rompe si no está configurado)
- ✅ `device-token.entity.ts` - **NUEVO** - Entidad para device tokens
  - Campos: userId, token, platform, isActive
  - Índices en userId y token (unique)
- ✅ `notifications.controller.ts` - **NUEVO** - REST API endpoints
  - `POST /api/v1/notifications/register-token`
  - `DELETE /api/v1/notifications/remove-token`
  - `GET /api/v1/notifications/status`
- ✅ `notifications.module.ts` - **NUEVO** - Módulo exportable
- ✅ `live.service.ts` - Integración con notificaciones
  - Llama a `notifyLiveStreamStarted()` en línea ~184
- ✅ `live.module.ts` - Importa NotificationsModule
- ✅ `orders.service.ts` - Integración con notificaciones
  - Llama a `notifyPurchaseMade()` después del commit (línea ~226)
  - Agrupa notificaciones por seller si hay múltiples productos
- ✅ `orders.module.ts` - Importa NotificationsModule

#### Backend - Scheduled Streams (`backend/src/live/`)

- ✅ `live-scheduler.service.ts` - **NUEVO** - Servicio de cron job para scheduled streams
  - `@Cron(CronExpression.EVERY_MINUTE)` - Ejecuta cada minuto
  - `checkUpcomingStreams()` - Busca streams que inician en 15-16 minutos
  - `notifiedStreams` Set - Previene notificaciones duplicadas
  - `cleanupNotifiedStreams()` - Limpia memoria cada hora
  - `sendManualReminder()` - Método manual para testing
  - Ventana de 1 minuto (15-16 min) para evitar duplicados
- ✅ `live.module.ts` - Agregado ScheduleModule.forRoot() y LiveSchedulerService
- ✅ `live.entity.ts` - Campo `scheduledAt: Date` (ya existía desde Fase 1)

#### Seller Panel (`seller-panel/app/dashboard/live/`)

- ✅ `page.tsx` - Lista de streams con enhanced create modal
  - CreateStreamModal component (líneas ~289-561)
  - Product selector con checkboxes
  - Thumbnail upload con preview
  - Category dropdown (7 categorías)
  - Tags input (comma-separated)
  - **Scheduled streams UI** - Checkbox "Schedule for later" con datetime-local picker
  - **Countdown display** - Badge con fecha programada y tiempo restante
  - `getCountdown()` helper - Formatea tiempo en días/horas/minutos
  - LiveStream interface actualizada con `scheduledAt?: string`
- ✅ `[id]/page.tsx` - Stream detail page con analytics y moderación
  - OBSInstructionsModal component (líneas ~472-652)
  - LiveStreamProduct interface actualizada con `isHighlighted` y `position`
  - toggleProductHighlight method
  - fetchMetrics method con auto-refresh
  - Chat Moderation section (líneas ~567-724)
  - Real-time Analytics section (líneas ~726-761)
    - Summary cards
    - 3 Recharts graphs
    - Product performance table

#### Funcionalidades Añadidas

1. **Enhanced Stream Creation**
   - Selector visual de productos con imágenes
   - Upload de thumbnail con FileReader API
   - 7 categorías predefinidas
   - Tags separados por comas
   - Agregado batch de productos tras crear stream

2. **OBS Studio Integration**
   - Modal paso a paso con 5 secciones
   - Color-coded border indicators
   - Copy buttons para RTMP URL y Stream Key
   - Link directo a descarga de OBS
   - Recomendaciones de bitrate: 2500-4500 kbps
   - Resoluciones sugeridas: 720p/1080p

3. **Product Highlight Controls**
   - Toggle highlight/hide durante live stream
   - Visual indicators: star badge + "Featured" label
   - Llamadas a endpoints `/products/:id/highlight` y `/products/:id/hide`
   - Cambio de color en botones (blue → yellow)
   - Solo visible cuando status === 'live'

4. **Real-time Analytics Dashboard**
   - **Area Chart** - Viewer count con gradient fill
   - **Line Chart** - Messages per minute (verde)
   - **Bar Chart** - Revenue tracking (amarillo)
   - Fetch dual: metrics history + summary
   - Auto-refresh interval de 30s
   - Tooltips con formateo de fechas y valores

5. **Chat Moderation Interface**
   - Display de 20 mensajes más recientes (reversed)
   - **Delete message**: Confirmación + DELETE request
   - **Timeout user**: Prompt + POST a `/timeout` (300s)
   - **Ban user**: Prompt con razón + POST a `/ban`
   - Refresh tras cada acción moderada
   - Collapsible con toggle button

6. **Push Notifications System**
   - **Firebase Cloud Messaging** integration
   - **Device Token Management**:
     - Registro de tokens (iOS/Android/Web)
     - Storage en database con status activo/inactivo
     - Cleanup automático al logout
   - **Live Stream Notifications**:
     - Trigger automático al iniciar stream
     - Envío a todos los followers del seller
     - Incluye thumbnail del stream
     - Data payload: streamId, sellerId, type
   - **Purchase Notifications**:
     - Trigger automático al completar orden
     - Notifica al seller con nombre del comprador
     - Agrupa por seller si hay múltiples productos
     - Muestra monto total y producto comprado
   - **Scheduled Stream Reminders**:
     - Método para enviar 15 min antes
     - Incluye thumbnail y título del stream
     - Ready para cron job integration
   - **Graceful Degradation**:
     - Sistema funciona sin FCM configurado
     - Logs informativos de estado
     - No rompe funcionalidad principal
   - **Batch Operations**:
     - `sendMulticast()` para múltiples tokens
     - Success/failure count tracking
     - Error handling por token individual

7. **Scheduled Streams System**
   - **UI de Programación**:
     - Checkbox "Schedule for later" en CreateStreamModal
     - datetime-local picker con validación (min = ahora)
     - Mensaje informativo sobre disponibilidad
     - Campo opcional que no bloquea creación inmediata
   - **Countdown Timer**:
     - Badge con fecha programada en formato locale
     - Cálculo dinámico de tiempo restante
     - Formato adaptativo: "In X days" / "In Xh Ym" / "In X min"
     - Display solo para streams con status 'scheduled'
   - **Cron Job Automation**:
     - `@Cron(CronExpression.EVERY_MINUTE)` ejecuta cada minuto
     - Busca streams en ventana de 15-16 minutos
     - Prevención de duplicados con Set in-memory
     - Cleanup automático de Set cada hora
     - Integración con NotificationsService
   - **Performance Features**:
     - TypeORM `Between()` para query eficiente
     - Relations cargadas (seller, affiliate)
     - Método manual `sendManualReminder()` para testing
     - Logging completo con timestamps

### 📊 Resumen Técnico - Fase 3

**Estadísticas de Implementación:**

- ✅ **8 features** completadas de 8 planeadas (100%)
- ✅ **2 componentes modales** nuevos (CreateStreamModal enhanced, OBSInstructionsModal)
- ✅ **1 sección de analytics** con 4 cards + 3 graphs + 1 table
- ✅ **1 sección de moderation** con 3 acciones
- ✅ **1 módulo completo de notificaciones** (service + entity + controller + module)
- ✅ **1 servicio de scheduled tasks** con cron job automation
- ✅ **4 métodos nuevos en seller panel** (toggleProductHighlight, fetchMetrics, moderation handlers, getCountdown)
- ✅ **9 métodos en NotificationsService** (send, register, notify, etc.)
- ✅ **3 métodos en LiveSchedulerService** (checkUpcomingStreams, cleanupNotifiedStreams, sendManualReminder)
- ✅ **4 Recharts components** (AreaChart, LineChart, BarChart, ResponsiveContainer)
- ✅ **5 REST endpoints** (3 notifications + 2 metrics)
- ✅ **1 entidad nueva** (DeviceToken)
- ✅ **2 integraciones** (LiveService, OrdersService)
- ✅ **Auto-refresh** cada 30s durante live streams
- ✅ **Cron job** ejecutándose cada minuto para scheduled streams

**Líneas de Código Agregadas:** ~1,200 líneas
**Archivos Backend Modificados:** 4 archivos (live.service.ts, live.module.ts, orders.service.ts, orders.module.ts)
**Archivos Backend Nuevos:** 5 archivos (notifications.service.ts, device-token.entity.ts, notifications.controller.ts, notifications.module.ts, live-scheduler.service.ts)
**Archivos Seller Panel Modificados:** 2 archivos (page.tsx, [id]/page.tsx)
**Archivos Seller Panel Nuevos:** 0 (componentes inline)

**Testing Status:**

- ⏳ Pendiente: Build test en seller-panel
- ⏳ Pendiente: Integration tests con backend metrics API
- ⏳ Pendiente: E2E tests de moderation flow

### ⚙️ Configuración Requerida - Push Notifications

**Para activar Firebase Cloud Messaging:**

1. **Obtener Service Account de Firebase:**
   ```bash
   # 1. Ir a Firebase Console (console.firebase.google.com)
   # 2. Seleccionar proyecto
   # 3. Project Settings → Service Accounts
   # 4. Generate new private key (descarga JSON)
   # 5. Guardar en backend/firebase-service-account.json
   ```

2. **Configurar variable de entorno:**
   ```bash
   # backend/.env
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```

3. **Ejecutar migración de database:**
   ```bash
   cd backend
   npm run migration:generate -- -n AddDeviceTokensTable
   npm run migration:run
   ```

4. **Instalar firebase-admin (opcional si no está):**
   ```bash
   cd backend
   npm install firebase-admin
   ```

**Nota:** El sistema funciona sin FCM configurado (graceful degradation). Las notificaciones simplemente no se enviarán pero el resto de la funcionalidad continúa normal.

### 🎯 Próximos Pasos - Fase 3

**✅ FASE 3 COMPLETADA AL 100%**

Todos los componentes de Seller Panel, Analytics y Notificaciones han sido implementados exitosamente, incluyendo:
- ✅ Enhanced Stream Creation UI
- ✅ Stream Management Interface
- ✅ Real-time Analytics Panel
- ✅ Chat Moderation Tools
- ✅ Push Notifications (Backend)
- ✅ Scheduled Streams

**Siguiente: FASE 4 - Mobile App & Live Checkout**

Semana 8-11:
- Mobile streaming (camera access, RTMP publisher)
- Live player optimizado para mobile
- Quick checkout flow
- Discovery feed & personalization

---

### 🔗 Referencias de Código Clave - Fase 1

Para revisión y debugging, estas son las ubicaciones principales del código implementado:

**WebSocket Events:**

- `backend/src/live/live.gateway.ts:211-241` - Reacciones
- `backend/src/live/live.gateway.ts:243-279` - Delete message
- `backend/src/live/live.gateway.ts:281-327` - Ban user
- `backend/src/live/live.gateway.ts:329-374` - Timeout user
- `backend/src/live/live.gateway.ts:159-209` - Send message (con rate limit y ban check)

**Service Methods:**

- `backend/src/live/live.service.ts:678-708` - Reacciones
- `backend/src/live/live.service.ts:715-740` - Badges
- `backend/src/live/live.service.ts:747-866` - Moderación y rate limiting

**Metrics Service:**

- `backend/src/live/live-metrics.service.ts:28-59` - Cron job collector
- `backend/src/live/live-metrics.service.ts:64-126` - Metrics collection logic
- `backend/src/live/live-metrics.service.ts:128-140` - Metrics history
- `backend/src/live/live-metrics.service.ts:145-176` - Metrics summary
- `backend/src/live/live-metrics.service.ts:181-194` - Auto cleanup

**REST API:**

- `backend/src/live/live.controller.ts:276-300` - Metrics endpoints

**Entities:**

- `backend/src/live/live.entity.ts:240-276` - LiveStreamReaction
- `backend/src/live/live.entity.ts:278-313` - LiveStreamMetrics

### 🔗 Referencias de Código Clave - Fase 2

**Discovery Methods:**

- `backend/src/live/live.service.ts:873-964` - Active streams con filtros y cache
- `backend/src/live/live.service.ts:966-1007` - Search con full-text
- `backend/src/live/live.service.ts:1009-1028` - Trending algorithm
- `backend/src/live/live.service.ts:1033-1042` - Categories

**Recommendation Engine:**

- `backend/src/live/live.service.ts:1065-1147` - Collaborative filtering
- `backend/src/live/live.service.ts:1149-1256` - Content-based filtering
- `backend/src/live/live.service.ts:1258-1337` - Hybrid "For You" feed

**REST Endpoints:**

- `backend/src/live/live.controller.ts:304-323` - Discover endpoint
- `backend/src/live/live.controller.ts:325-340` - Search endpoint
- `backend/src/live/live.controller.ts:342-349` - Trending endpoint
- `backend/src/live/live.controller.ts:351-356` - Categories endpoint
- `backend/src/live/live.controller.ts:358-372` - For You endpoint

---

### Estado Actual (Phase 2 - Implementado)

✅ **Ya implementado:**

- Live streaming básico con RTMP/HLS
- WebSocket para chat en tiempo real
- Entidades de base de datos: `live_streams`, `live_stream_products`, `live_stream_messages`, `live_stream_viewers`
- API REST básica: crear streams, listar activos, agregar productos
- Panel de vendedor básico para gestión de lives
- Mobile app con visualización de lives y chat
- Sistema de comisiones para affiliates en lives

### Objetivos del Enhancement

🎯 **Mejoras principales:**

1. **Streaming escalable** con baja latencia (< 3 segundos)
2. **Overlay de productos** interactivo en el video
3. **Chat avanzado** con reacciones, likes, moderación
4. **Descubrimiento inteligente** con algoritmos de recomendación
5. **Live Checkout** integrado sin salir del stream
6. **Infraestructura cloud** escalable y optimizada
7. **Analytics en tiempo real** para vendedores
8. **Soporte multi-protocolo** (RTMP + WebRTC)
9. **📱 Mobile Streaming** - Sellers y affiliates pueden iniciar lives desde la app móvil

---

## 🏗️ Arquitectura Propuesta

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Seller Panel (Next.js)    │    Mobile App (React Native)      │
│  - OBS/RTMP Config          │    🆕 Mobile Streamer (Seller):  │
│  - Product Management       │    - Camera Streaming (RTMP)     │
│  - Analytics Dashboard      │    - Live Product Management     │
│  - Stream Controls          │    - Real-time Analytics         │
│                             │                                   │
│                             │    Mobile Viewer (Buyer):        │
│                             │    - Live Player (HLS/WebRTC)    │
│                             │    - Product Overlay             │
│                             │    - Chat Interface              │
│                             │    - Quick Checkout              │
└─────────────────┬───────────┴──────────────┬───────────────────┘
                  │                          │
┌─────────────────▼──────────────────────────▼───────────────────┐
│                     API GATEWAY LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  NestJS Backend (3000)                                          │
│  - REST API (lives, products, orders)                           │
│  - WebSocket Gateway (chat, reactions, presence)                │
│  - GraphQL Subscriptions (real-time metrics)                    │
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Live Service     │  Chat Service    │  Recommendation Engine  │
│  Product Service  │  Order Service   │  Analytics Service      │
│  Payment Service  │  Moderation      │  Notification Service   │
└─────────┬─────────┴──────────┬───────┴─────────────────┬───────┘
          │                    │                         │
┌─────────▼────────────────────▼─────────────────────────▼───────┐
│                      DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL      │   Redis Cache    │   S3/CDN (Videos)        │
│  (TypeORM)       │   (Sessions,     │   (Thumbnails, Images)   │
│                  │    Leaderboards) │                          │
└──────────────────┴──────────────────┴──────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   MEDIA STREAMING LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Option 1 (Recommended for MVP):                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ AWS IVS (Interactive Video Service)                     │    │
│  │ - Managed RTMP ingest                                   │    │
│  │ - Auto HLS transcoding                                  │    │
│  │ - Global CDN distribution                               │    │
│  │ - < 3s latency                                          │    │
│  │ - Pay per viewer hour (~$0.015/hour)                    │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Option 2 (Self-hosted for cost optimization):                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Nginx-RTMP + Node Media Server                          │    │
│  │ + FFmpeg Transcoding                                    │    │
│  │ + CloudFront CDN                                        │    │
│  │ Cost: ~$50-100/month (EC2 t3.medium + CDN)              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Option 3 (Future - Ultra Low Latency):                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Agora.io / 100ms WebRTC                                 │    │
│  │ - < 500ms latency                                       │    │
│  │ - Interactive features                                  │    │
│  │ - Pay per minute (~$0.0099/min)                         │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING & ANALYTICS                       │
├─────────────────────────────────────────────────────────────────┤
│  CloudWatch/Datadog  │  Sentry (Errors)  │  Mixpanel (Events) │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo Técnico Completo

#### 1. Vendedor Inicia Live Stream

```
┌─────────────┐
│ Seller Panel│
│ or OBS      │
└──────┬──────┘
       │ 1. POST /api/v1/live/streams
       │    { title, description, products[] }
       ▼
┌──────────────┐
│ Backend API  │ → 2. Create stream record in DB
│              │ → 3. Request stream key from AWS IVS
│              │ → 4. Return RTMP ingest URL + stream key
└──────┬───────┘
       │ 5. Seller starts streaming (OBS → RTMP)
       ▼
┌──────────────┐
│  AWS IVS     │ → 6. Transcode to HLS
│  (or Nginx)  │ → 7. Distribute via CloudFront CDN
└──────┬───────┘
       │ 8. Notify backend: stream_started webhook
       ▼
┌──────────────┐
│ Backend      │ → 9. Update stream status: "live"
│              │ → 10. Publish to WebSocket: "stream_started"
│              │ → 11. Send push notifications to followers
└──────────────┘
```

#### 2. Comprador Ve Live Stream

```
┌─────────────┐
│ Mobile App  │
└──────┬──────┘
       │ 1. GET /api/v1/live/streams/active
       │    (or /discover with recommendations)
       ▼
┌──────────────┐
│ Backend API  │ → 2. Query active streams from DB
│              │ → 3. Apply recommendation algorithm
│              │ → 4. Return streams with HLS URLs
└──────┬───────┘
       │ 5. User taps stream to watch
       ▼
┌─────────────┐
│ Video Player│ → 6. Load HLS manifest from CDN
│ (Expo AV)   │ → 7. Start playing video
└──────┬──────┘
       │ 8. Connect WebSocket for chat/events
       ▼
┌──────────────┐
│ WebSocket    │ → 9. Join room: "stream_{streamId}"
│ Gateway      │ → 10. Receive chat messages
│              │ → 11. Receive product highlights
│              │ → 12. Receive reactions/likes
└──────────────┘
```

#### 3. 🆕 Seller/Affiliate Inicia Live desde Mobile

```
┌─────────────┐
│ Mobile App  │
│ (Seller)    │
└──────┬──────┘
       │ 1. Tap "Go Live" button
       │    POST /api/v1/live/streams
       │    { title, description, products[] }
       ▼
┌──────────────┐
│ Backend API  │ → 2. Create stream record in DB
│              │ → 3. Request RTMP credentials from AWS IVS
│              │ → 4. Return RTMP ingest URL + stream key
└──────┬───────┘
       │ 5. Mobile app initializes RTMP publisher
       ▼
┌──────────────┐
│ React Native │ → 6. Access device camera/microphone
│ RTMP Client  │ → 7. Start encoding video (H.264) + audio (AAC)
│ (NodeMedia)  │ → 8. Push RTMP stream to AWS IVS ingest URL
└──────┬───────┘
       │ 9. Stream live to viewers via HLS/CDN
       ▼
┌──────────────┐
│ AWS IVS      │ → 10. Transcode to HLS
│              │ → 11. Distribute via CloudFront CDN
│              │ → 12. Notify backend: stream_started webhook
└──────┬───────┘
       │ 13. Update stream status: "live"
       ▼
┌──────────────┐
│ Mobile App   │ → 14. Show live controls (end stream, add products)
│ (Seller)     │ → 15. Real-time viewer count and chat
│              │ → 16. Toggle product visibility during stream
└──────────────┘
```

#### 4. Overlay de Productos Durante Live

```
┌─────────────┐
│ Seller Panel│
│ or Mobile   │  🆕 Can also be triggered from mobile app
└──────┬──────┘
       │ 1. Click "Show Product" during live
       │    PUT /api/v1/live/streams/:id/products/:productId/highlight
       ▼
┌──────────────┐
│ Backend API  │ → 2. Update product visibility in DB
│              │ → 3. Publish WebSocket event: "product_highlighted"
└──────┬───────┘
       │ 4. WebSocket broadcast to all viewers
       ▼
┌─────────────┐
│ Mobile App  │ → 5. Show product overlay animation
│ (Viewers)   │ → 6. Display product carousel at bottom
│             │ → 7. Enable "Add to Cart" button
└─────────────┘
```

#### 4. Compra Durante Live ("Live Checkout")

```
┌─────────────┐
│ Mobile App  │
└──────┬──────┘
       │ 1. User taps "Add to Cart" on product overlay
       │    POST /api/v1/orders/live-checkout
       │    { streamId, productId, quantity }
       ▼
┌──────────────┐
│ Backend API  │ → 2. Create order with liveSessionId
│              │ → 3. Calculate commission if affiliate stream
│              │ → 4. Process payment (MercadoPago)
└──────┬───────┘
       │ 5. Payment success webhook
       ▼
┌──────────────┐
│ Order Service│ → 6. Confirm order
│              │ → 7. Update stream metrics (GMV, conversions)
│              │ → 8. Send notification to seller
└──────┬───────┘
       │ 9. WebSocket event: "purchase_celebration"
       ▼
┌─────────────┐
│ Live Stream │ → 10. Show celebration animation
│ (All viewers)│ → 11. "X users bought this product!"
└─────────────┘
```

---

## 🗄️ Diseño de Base de Datos

### Entidades Existentes (Phase 2) - A Extender

#### `live_streams` (Existente - Requiere Mejoras)

```typescript
interface LiveStream {
  // Campos existentes
  id: string; // UUID
  title: string;
  description?: string;
  status: 'scheduled' | 'live' | 'ended'; // ✅ Mantener
  hostType: 'seller' | 'affiliate'; // ✅ Mantener
  sellerId?: string; // FK to sellers
  affiliateId?: string; // FK to affiliates
  rtmpUrl?: string;
  hlsUrl?: string;
  streamKey?: string;
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // 🆕 NUEVOS CAMPOS REQUERIDOS
  thumbnailUrl?: string; // Image for discovery feed
  category?: string; // Electronics, Fashion, Food, etc.
  tags?: string[]; // Searchable tags
  viewerCount: number; // Real-time viewer count
  peakViewerCount: number; // Max concurrent viewers
  totalViews: number; // Unique views
  totalLikes: number; // Heart reactions
  totalMessages: number; // Chat messages count
  totalPurchases: number; // Orders during stream
  gmv: number; // Gross Merchandise Value
  streamQuality?: '720p' | '1080p' | 'auto'; // Video quality
  latencyMode?: 'low' | 'ultra-low'; // < 3s or < 500ms
  isRecorded: boolean; // Save VOD after stream ends
  recordingUrl?: string; // VOD playback URL
  language?: string; // es, en, pt (for i18n)
  moderators?: string[]; // User IDs who can moderate chat
  isPrivate: boolean; // Private stream (only followers)
  allowedViewers?: string[]; // User IDs for private streams

  // Relaciones
  products?: LiveStreamProduct[];
  messages?: LiveStreamMessage[];
  viewers?: LiveStreamViewer[];
  metrics?: LiveStreamMetric[];
}
```

#### `live_stream_products` (Existente - Mejorar)

```typescript
interface LiveStreamProduct {
  // Campos existentes
  id: string;
  streamId: string; // FK
  productId: string; // FK
  isVisible: boolean; // ✅ Mantener para overlay
  createdAt: Date;

  // 🆕 NUEVOS CAMPOS
  highlightedAt?: Date; // When product was shown
  position: number; // Order in product list (1, 2, 3...)
  discountPercent?: number; // Live-exclusive discount
  livePrice?: number; // Special price for live viewers
  stock?: number; // Available stock during live
  soldCount: number; // Units sold during stream
  clickCount: number; // Times product was clicked
  addToCartCount: number; // Times added to cart
  purchaseCount: number; // Completed purchases
  revenue: number; // Total revenue from this product in stream
  isPinned: boolean; // Pin to top of product carousel
}
```

#### `live_stream_messages` (Existente - Extender)

```typescript
interface LiveStreamMessage {
  // Campos existentes
  id: string;
  streamId: string; // FK
  userId: string; // FK
  message: string;
  createdAt: Date;

  // 🆕 NUEVOS CAMPOS
  type: 'message' | 'reaction' | 'system' | 'product_alert' | 'purchase';
  reactionType?: '❤️' | '🔥' | '😍' | '👏' | '💰'; // Emoji reactions
  metadata?: {
    productId?: string; // If message is about a product
    purchaseAmount?: number; // If message announces purchase
    username?: string; // Display name
    userAvatar?: string; // User profile pic
    isModerator?: boolean; // Show moderator badge
    isSeller?: boolean; // Show seller badge
  };
  isDeleted: boolean; // Moderation
  deletedBy?: string; // Moderator who deleted
  deletedAt?: Date;
  isPinned: boolean; // Pin important messages
}
```

#### `live_stream_viewers` (Existente - Extender)

```typescript
interface LiveStreamViewer {
  // Campos existentes
  id: string;
  streamId: string; // FK
  userId: string; // FK
  sessionId: string; // ✅ Mantener
  joinedAt: Date;
  leftAt?: Date;

  // 🆕 NUEVOS CAMPOS
  watchDuration: number; // Seconds watched
  isActive: boolean; // Currently watching
  lastPingAt: Date; // Heartbeat for presence
  messagesCount: number; // Messages sent by this viewer
  reactionsCount: number; // Reactions sent
  productsViewed: number; // Products clicked
  purchasesMade: number; // Orders completed
  totalSpent: number; // Revenue from this viewer
  referralSource?: string; // How they found the stream
  device?: 'mobile' | 'web' | 'tablet'; // Device type
  location?: {
    country?: string;
    city?: string;
  };
}
```

### 🆕 Nuevas Entidades Requeridas

#### `live_stream_metrics` (NUEVA)

```typescript
interface LiveStreamMetric {
  id: string;
  streamId: string; // FK
  timestamp: Date; // Every 30 seconds or 1 minute
  viewerCount: number; // Concurrent viewers at this time
  messagesPerMinute: number; // Chat activity
  reactionsPerMinute: number; // Engagement rate
  productsHighlighted: number; // Products shown so far
  purchasesCount: number; // Orders completed so far
  revenue: number; // GMV so far
  averageWatchTime: number; // Avg seconds per viewer
  bounceRate: number; // % of viewers who left in < 10s
  engagementScore: number; // Calculated engagement metric
  createdAt: Date;
}
```

#### `live_stream_highlights` (NUEVA)

```typescript
interface LiveStreamHighlight {
  id: string;
  streamId: string; // FK
  timestamp: number; // Seconds from stream start
  type: 'product_show' | 'big_purchase' | 'milestone' | 'reaction_burst';
  title: string; // "iPhone 15 Reveal", "100 Viewers!"
  description?: string;
  thumbnailUrl?: string; // Screenshot from video
  videoClipUrl?: string; // Short clip (10-30s)
  metadata?: {
    productId?: string;
    viewerCount?: number;
    purchaseAmount?: number;
  };
  isPublic: boolean; // Show in highlights reel
  createdAt: Date;
}
```

#### `live_stream_recommendations` (NUEVA)

```typescript
interface LiveStreamRecommendation {
  id: string;
  userId: string; // FK - Who is this recommendation for
  streamId: string; // FK - Recommended stream
  score: number; // 0-100 recommendation score
  reasons: string[]; // ["popular", "follows_seller", "viewed_category"]
  position: number; // Ranking in recommendation list
  viewed: boolean; // User saw this recommendation
  clicked: boolean; // User clicked on it
  watched: boolean; // User watched the stream
  watchDuration?: number; // If watched, for how long
  purchased: boolean; // User made a purchase
  createdAt: Date;
  expiresAt: Date; // Recommendations expire after stream ends
}
```

#### `live_stream_chat_moderation` (NUEVA)

```typescript
interface LiveStreamChatModeration {
  id: string;
  streamId: string; // FK
  userId: string; // FK - User who was moderated
  moderatorId: string; // FK - Who performed the action
  action: 'timeout' | 'ban' | 'delete_message' | 'warning';
  reason?: string;
  duration?: number; // Timeout duration in minutes
  messageId?: string; // If specific message was deleted
  createdAt: Date;
  expiresAt?: Date; // When timeout expires
}
```

#### `live_stream_schedules` (NUEVA)

```typescript
interface LiveStreamSchedule {
  id: string;
  sellerId?: string; // FK
  affiliateId?: string; // FK
  title: string;
  description?: string;
  scheduledDate: Date; // When stream will start
  estimatedDuration: number; // Minutes
  category?: string;
  tags?: string[];
  products?: string[]; // Product IDs to be featured
  notifyFollowers: boolean; // Send push notifications
  remindersSent: number; // Count of reminders sent
  status: 'scheduled' | 'cancelled' | 'completed';
  streamId?: string; // FK - Once stream starts
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Índices Recomendados (PostgreSQL)

```sql
-- High-performance queries for live discovery
CREATE INDEX idx_live_streams_status_viewers ON live_streams (status, viewerCount DESC);
CREATE INDEX idx_live_streams_category_status ON live_streams (category, status);
CREATE INDEX idx_live_streams_started_at ON live_streams (startedAt DESC);

-- Real-time chat performance
CREATE INDEX idx_live_messages_stream_created ON live_stream_messages (streamId, createdAt DESC);
CREATE INDEX idx_live_messages_type ON live_stream_messages (streamId, type);

-- Viewer analytics
CREATE INDEX idx_live_viewers_stream_active ON live_stream_viewers (streamId, isActive);
CREATE INDEX idx_live_viewers_user_joined ON live_stream_viewers (userId, joinedAt DESC);

-- Product performance
CREATE INDEX idx_live_products_stream_visible ON live_stream_products (streamId, isVisible);
CREATE INDEX idx_live_products_sold_count ON live_stream_products (streamId, soldCount DESC);

-- Recommendations
CREATE INDEX idx_recommendations_user_score ON live_stream_recommendations (userId, score DESC, expiresAt);
CREATE INDEX idx_recommendations_stream ON live_stream_recommendations (streamId, viewed);

-- Metrics for analytics
CREATE INDEX idx_metrics_stream_timestamp ON live_stream_metrics (streamId, timestamp DESC);
```

---

## 🔌 API Endpoints & WebSocket Events

### REST API Endpoints

#### Live Stream Management

```typescript
// Create scheduled stream
POST /api/v1/live/streams
Body: {
  title: string;
  description?: string;
  scheduledAt?: Date;
  category?: string;
  tags?: string[];
  productIds?: string[];
  thumbnailUrl?: string;
  isPrivate?: boolean;
}

// Start stream (get RTMP credentials)
POST /api/v1/live/streams/:id/start
Response: {
  streamId: string;
  rtmpIngestUrl: string; // rtmp://live.gshop.com/live
  streamKey: string; // secret_key_abc123
  hlsPlaybackUrl: string; // https://cdn.gshop.com/live/{streamId}/index.m3u8
  status: 'live';
}

// End stream
POST /api/v1/live/streams/:id/end
Response: { status: 'ended', recordingUrl?: string }

// Get active streams (discovery feed)
GET /api/v1/live/streams/active
Query: { category?, tags?, limit?, offset?, sort? }
Response: { streams: LiveStream[], total: number }

// Get recommended streams for user
GET /api/v1/live/streams/recommended
Query: { userId, limit? }
Response: { streams: LiveStream[], reasons: string[] }

// Get stream details
GET /api/v1/live/streams/:id
Response: LiveStream with products, metrics, host info

// Get stream analytics (seller only)
GET /api/v1/live/streams/:id/analytics
Response: {
  viewerCount: number;
  peakViewers: number;
  totalViews: number;
  avgWatchTime: number;
  messagesCount: number;
  reactionsCount: number;
  productsShown: number;
  purchases: number;
  revenue: number;
  topProducts: Product[];
  viewersByHour: MetricPoint[];
  revenueByProduct: MetricPoint[];
}

// Search live streams
GET /api/v1/live/streams/search
Query: { q: string, category?, tags?, limit? }
Response: { streams: LiveStream[], total: number }
```

#### Product Management During Live

```typescript
// Add product to stream
POST /api/v1/live/streams/:id/products
Body: { productId: string, position?: number, livePrice?: number, discountPercent?: number }

// Highlight product (show overlay to viewers)
PUT /api/v1/live/streams/:id/products/:productId/highlight
Response: { success: true, highlightedAt: Date }

// Hide product from overlay
PUT /api/v1/live/streams/:id/products/:productId/hide
Response: { success: true, isVisible: false }

// Pin product (stays at top)
PUT /api/v1/live/streams/:id/products/:productId/pin
Response: { success: true, isPinned: true }

// Remove product from stream
DELETE /api/v1/live/streams/:id/products/:productId

// Get product performance in stream
GET /api/v1/live/streams/:id/products/:productId/stats
Response: {
  soldCount: number;
  revenue: number;
  clickCount: number;
  addToCartCount: number;
  conversionRate: number;
}
```

#### Chat & Moderation

```typescript
// Send chat message (via WebSocket primarily, but REST backup)
POST /api/v1/live/streams/:id/messages
Body: { message: string, type?: 'message' | 'reaction' }

// Get chat history (on join)
GET /api/v1/live/streams/:id/messages
Query: { limit?, before?: Date }
Response: { messages: LiveStreamMessage[] }

// Delete message (moderator)
DELETE /api/v1/live/streams/:id/messages/:messageId
Body: { reason?: string }

// Timeout user (moderator)
POST /api/v1/live/streams/:id/moderation/timeout
Body: { userId: string, duration: number, reason?: string }

// Ban user from stream (moderator)
POST /api/v1/live/streams/:id/moderation/ban
Body: { userId: string, reason?: string }

// Add moderator to stream
POST /api/v1/live/streams/:id/moderators
Body: { userId: string }

// Remove moderator
DELETE /api/v1/live/streams/:id/moderators/:userId
```

#### Live Checkout

```typescript
// Quick add to cart from live
POST /api/v1/orders/live-checkout/add-to-cart
Body: {
  streamId: string;
  productId: string;
  quantity: number;
}
Response: { cartId: string, itemId: string, total: number }

// Complete purchase during live
POST /api/v1/orders/live-checkout/purchase
Body: {
  streamId: string;
  cartId: string;
  paymentMethodId: string;
  shippingAddressId: string;
}
Response: {
  orderId: string;
  total: number;
  liveSessionId: string;
  affiliateId?: string;
  commissionAmount?: number;
}

// Get live checkout stats (seller)
GET /api/v1/live/streams/:id/checkout-stats
Response: {
  cartsCreated: number;
  purchasesCompleted: number;
  conversionRate: number;
  averageOrderValue: number;
  totalRevenue: number;
}
```

#### Recommendations & Discovery

```typescript
// Get trending streams
GET /api/v1/live/streams/trending
Query: { category?, limit? }
Response: { streams: LiveStream[] }

// Get "For You" personalized feed
GET /api/v1/live/streams/for-you
Query: { userId, limit?, offset? }
Response: {
  streams: LiveStream[];
  reasons: { [streamId]: string[] };
}

// Track recommendation interaction
POST /api/v1/live/recommendations/track
Body: {
  streamId: string;
  action: 'viewed' | 'clicked' | 'watched' | 'purchased';
  metadata?: { watchDuration?: number };
}

// Get upcoming scheduled streams
GET /api/v1/live/streams/scheduled
Query: { category?, date?, limit? }
Response: { schedules: LiveStreamSchedule[] }

// Subscribe to stream notification
POST /api/v1/live/streams/:id/subscribe
Response: { subscribed: true, willNotify: true }
```

### WebSocket Events

#### Connection & Presence

```typescript
// Client connects to WebSocket
socket.connect('https://api.gshop.com', {
  auth: { token: 'jwt_token_here' }
});

// Join stream room
socket.emit('live:join', {
  streamId: 'stream_123',
  userId: 'user_456',
  sessionId: 'session_789'
});

// Server acknowledges join
socket.on('live:joined', {
  streamId: 'stream_123',
  viewerCount: 142,
  currentProducts: Product[],
  recentMessages: Message[]
});

// Leave stream
socket.emit('live:leave', { streamId, sessionId });

// Heartbeat (every 30s to stay active)
socket.emit('live:ping', { streamId, sessionId });
socket.on('live:pong', { serverTime: Date });
```

#### Chat Events

```typescript
// Send message
socket.emit('live:message', {
  streamId: 'stream_123',
  message: 'This product looks amazing!',
  type: 'message'
});

// Receive message (broadcast to all viewers)
socket.on('live:message', {
  id: 'msg_abc',
  streamId: 'stream_123',
  userId: 'user_456',
  username: 'JohnDoe',
  userAvatar: 'https://...',
  message: 'This product looks amazing!',
  type: 'message',
  createdAt: Date,
  metadata: { isModerator: false, isSeller: false }
});

// Send reaction
socket.emit('live:reaction', {
  streamId: 'stream_123',
  reaction: '❤️'
});

// Receive reaction burst (aggregated)
socket.on('live:reactions', {
  streamId: 'stream_123',
  reactions: { '❤️': 45, '🔥': 23, '😍': 12 },
  recentReactions: [
    { userId: 'user_1', reaction: '❤️', timestamp: Date },
    { userId: 'user_2', reaction: '🔥', timestamp: Date }
  ]
});

// Message deleted (moderation)
socket.on('live:message:deleted', {
  messageId: 'msg_abc',
  reason: 'spam'
});

// User timeout
socket.on('live:user:timeout', {
  userId: 'user_456',
  duration: 300, // seconds
  reason: 'inappropriate language'
});
```

#### Product Events

```typescript
// Product highlighted (seller triggers)
socket.emit('live:product:highlight', {
  streamId: 'stream_123',
  productId: 'prod_789'
});

// Receive product highlight (all viewers)
socket.on('live:product:highlighted', {
  streamId: 'stream_123',
  product: {
    id: 'prod_789',
    name: 'iPhone 15 Pro Max',
    price: 1299.99,
    livePrice: 1199.99, // Special live discount
    discountPercent: 8,
    imageUrl: 'https://...',
    stock: 25,
    soldCount: 5
  },
  position: 1, // First in carousel
  isPinned: false
});

// Product hidden
socket.emit('live:product:hide', { streamId, productId });
socket.on('live:product:hidden', { streamId, productId });

// Product stock update (real-time)
socket.on('live:product:stock', {
  streamId: 'stream_123',
  productId: 'prod_789',
  stock: 23, // 2 units sold
  soldCount: 7
});
```

#### Purchase Events

```typescript
// Purchase completed
socket.emit('live:purchase', {
  streamId: 'stream_123',
  productId: 'prod_789',
  quantity: 1,
  amount: 1199.99
});

// Broadcast purchase celebration (anonymized)
socket.on('live:purchase:celebration', {
  streamId: 'stream_123',
  productId: 'prod_789',
  productName: 'iPhone 15 Pro Max',
  quantity: 1,
  message: '🎉 Someone just bought this product!',
  totalPurchases: 8, // Total for this product in stream
  showAnimation: true
});

// Purchase milestone (e.g., 100th purchase)
socket.on('live:milestone:purchase', {
  streamId: 'stream_123',
  milestone: 100,
  message: '🎊 100 products sold during this live!',
  totalRevenue: 45000.0
});
```

#### Stream Events

```typescript
// Stream started
socket.on('live:stream:started', {
  streamId: 'stream_123',
  title: 'iPhone 15 Launch Event',
  hlsUrl: 'https://cdn.gshop.com/live/stream_123/index.m3u8',
  thumbnailUrl: 'https://...'
});

// Stream ended
socket.on('live:stream:ended', {
  streamId: 'stream_123',
  duration: 3600, // seconds
  totalViews: 1250,
  peakViewers: 342,
  totalPurchases: 87,
  revenue: 52000.0,
  recordingUrl: 'https://...' // VOD if recorded
});

// Viewer count update (every 10-30s)
socket.on('live:viewers:update', {
  streamId: 'stream_123',
  viewerCount: 156,
  change: +4 // +4 viewers in last period
});

// Engagement milestone
socket.on('live:milestone:viewers', {
  streamId: 'stream_123',
  milestone: 100,
  message: '🔥 100 viewers watching now!',
  peakViewers: 100
});
```

#### Analytics Events (Seller Only)

```typescript
// Real-time analytics update (every 30s)
socket.on('live:analytics:update', {
  streamId: 'stream_123',
  timestamp: Date,
  viewerCount: 156,
  messagesPerMinute: 24,
  reactionsPerMinute: 67,
  purchasesCount: 12,
  revenue: 14500.0,
  topProduct: {
    id: 'prod_789',
    name: 'iPhone 15',
    soldCount: 5,
    revenue: 6000.0
  }
});

// Product performance alert
socket.on('live:product:alert', {
  streamId: 'stream_123',
  productId: 'prod_789',
  type: 'low_stock', // or 'hot_selling', 'no_interest'
  message: 'Only 3 units left!',
  stock: 3
});
```

---

## ☁️ Infraestructura Cloud Recomendada

### Opción 1: AWS (Recomendado para MVP)

#### Servicios Clave

| Servicio               | Propósito                         | Costo Estimado (MVP) |
| ---------------------- | --------------------------------- | -------------------- |
| **AWS IVS**            | Streaming RTMP → HLS              | $0.015/viewer-hour   |
|                        | - Managed transcoding             | ~$200-500/month      |
|                        | - Global CDN                      | (100-500 viewers)    |
|                        | - < 3s latency                    |                      |
| **EC2 (t3.medium)**    | NestJS Backend API                | $30/month            |
|                        | 2 vCPU, 4 GB RAM                  |                      |
| **RDS PostgreSQL**     | Primary database                  | $50/month            |
|                        | db.t3.small                       | (t3.micro)           |
| **ElastiCache Redis**  | Sessions, chat cache, leaderboard | $15/month            |
|                        | cache.t3.micro                    |                      |
| **CloudFront**         | CDN for videos, images            | $10-50/month         |
|                        |                                   | (50-500 GB transfer) |
| **S3**                 | Video recordings, thumbnails      | $5-10/month          |
|                        |                                   | (100-500 GB storage) |
| **Lambda**             | Webhooks, async processing        | $5/month             |
|                        |                                   | (1M requests)        |
| **CloudWatch**         | Monitoring, logs, alerts          | $10/month            |
| **SES (Simple Email)** | Notifications                     | $1/month             |
|                        |                                   | (10K emails)         |
| **Total**              |                                   | **~$350-700/month**  |

#### Arquitectura AWS

```
┌────────────────────────────────────────────────────────────────┐
│                         AWS REGION (us-east-1)                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐         ┌─────────────────┐             │
│  │  CloudFront CDN │◄────────┤   AWS IVS       │             │
│  │  (Video Dist.)  │         │  (Live Streams) │             │
│  └────────┬────────┘         └────────┬────────┘             │
│           │                           │                        │
│           │ HLS Playback              │ RTMP Ingest           │
│           ▼                           ▼                        │
│  ┌─────────────────────────────────────────────────┐          │
│  │              Viewers (Mobile/Web)               │          │
│  └─────────────────────────────────────────────────┘          │
│                                                                │
│  ┌─────────────────┐         ┌─────────────────┐             │
│  │  ALB (Load      │────────►│  EC2 (NestJS)   │             │
│  │  Balancer)      │         │  Auto Scaling   │             │
│  └─────────────────┘         │  Group (2-10)   │             │
│                              └────────┬────────┘             │
│                                       │                        │
│                    ┌──────────────────┼──────────────────┐    │
│                    │                  │                  │    │
│           ┌────────▼────────┐ ┌──────▼──────┐ ┌────────▼───┐│
│           │ RDS PostgreSQL  │ │ ElastiCache │ │   S3       ││
│           │ (Multi-AZ)      │ │   Redis     │ │  (Media)   ││
│           └─────────────────┘ └─────────────┘ └────────────┘│
│                                                                │
│  ┌─────────────────┐         ┌─────────────────┐             │
│  │  Lambda         │         │  EventBridge    │             │
│  │  (Webhooks)     │◄────────┤  (Scheduler)    │             │
│  └─────────────────┘         └─────────────────┘             │
│                                                                │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  CloudWatch (Monitoring + Logs + Alarms)            │     │
│  └─────────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────┘
```

#### Setup AWS IVS

```bash
# Install AWS CLI
aws configure

# Create IVS channel
aws ivs create-channel \
  --name "gshop-live-stream" \
  --latency-mode NORMAL \
  --type STANDARD \
  --region us-east-1

# Response
{
  "channel": {
    "arn": "arn:aws:ivs:us-east-1:123456789:channel/abc123",
    "name": "gshop-live-stream",
    "latencyMode": "NORMAL",
    "ingestEndpoint": "rtmp://a1b2c3d4e5.global-contribute.live-video.net:443/app/",
    "playbackUrl": "https://a1b2c3d4e5.us-east-1.playback.live-video.net/api/video/v1/us-east-1.123456789.channel.abc123.m3u8",
    "streamKey": {
      "value": "sk_us-east-1_a1b2c3d4e5f6g7h8"
    }
  }
}

# Store these values in your database/config
RTMP_INGEST_URL="rtmp://a1b2c3d4e5.global-contribute.live-video.net:443/app/"
STREAM_KEY="sk_us-east-1_a1b2c3d4e5f6g7h8"
HLS_PLAYBACK_URL="https://a1b2c3d4e5.us-east-1.playback.live-video.net/api/video/v1/us-east-1.123456789.channel.abc123.m3u8"
```

### Opción 2: Self-Hosted (Cost Optimization)

#### Nginx RTMP + FFmpeg Setup

```bash
# EC2 t3.medium (Ubuntu 22.04)
sudo apt update
sudo apt install -y nginx libnginx-mod-rtmp ffmpeg

# Configure Nginx RTMP
sudo nano /etc/nginx/nginx.conf
```

```nginx
rtmp {
    server {
        listen 1935;
        chunk_size 4096;

        application live {
            live on;
            record off;

            # HLS transcoding
            hls on;
            hls_path /var/www/hls;
            hls_fragment 3s;
            hls_playlist_length 60s;

            # Low latency settings
            hls_fragment_naming sequential;
            hls_cleanup on;

            # Authentication webhook
            on_publish http://localhost:3000/api/v1/live/auth/publish;
            on_publish_done http://localhost:3000/api/v1/live/auth/done;

            # Notifications
            on_play http://localhost:3000/api/v1/live/auth/play;
        }
    }
}

http {
    server {
        listen 8080;

        # Serve HLS files
        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /var/www;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
        }
    }
}
```

```bash
# Start Nginx
sudo systemctl restart nginx

# Test RTMP stream with OBS
# Server: rtmp://your-ec2-ip:1935/live
# Stream Key: test_stream_key
```

#### Cost Comparison

| Option           | Setup Time | Monthly Cost | Latency | Scalability |
| ---------------- | ---------- | ------------ | ------- | ----------- |
| **AWS IVS**      | 1 hour     | $200-500     | < 3s    | Auto        |
| **Self-hosted**  | 1-2 days   | $50-100      | 5-10s   | Manual      |
| **Agora WebRTC** | 2-4 hours  | $300-800     | < 500ms | Auto        |

**Recomendación:** Empezar con **AWS IVS** para MVP, luego evaluar costos vs. self-hosted cuando tengas tráfico predecible.

### Opción 3: Ultra Low Latency (WebRTC)

#### Agora.io Integration

```bash
# Install Agora SDK
npm install agora-rtc-sdk-ng --save

# Backend: Generate token
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

function generateAgoraToken(channelName: string, uid: number) {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const role = RtcRole.PUBLISHER; // or SUBSCRIBER
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  return RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );
}
```

```typescript
// Mobile app: Join channel
import AgoraRTC from 'agora-rtc-sdk-ng';

const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });

// Seller starts streaming
await client.join(
  AGORA_APP_ID,
  'stream_123', // channel name
  token, // from backend
  sellerId // UID
);
await client.setClientRole('host');

const localVideoTrack = await AgoraRTC.createCameraVideoTrack();
await client.publish([localVideoTrack]);

// Viewer watches
await client.join(AGORA_APP_ID, 'stream_123', token, viewerId);
await client.setClientRole('audience');

client.on('user-published', async (user, mediaType) => {
  await client.subscribe(user, mediaType);
  if (mediaType === 'video') {
    const remoteVideoTrack = user.videoTrack;
    remoteVideoTrack.play('video-container');
  }
});
```

**Pricing:** $0.0099/min = ~$30/hour per viewer (expensive for many viewers)

---

## 📊 Estrategia de Escalabilidad

### Horizontal Scaling

#### Backend API (NestJS)

```yaml
# docker-compose.yml
version: '3.8'
services:
  api-1:
    image: gshop-backend:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    ports:
      - '3001:3000'

  api-2:
    image: gshop-backend:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    ports:
      - '3002:3000'

  nginx-lb:
    image: nginx:alpine
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
    ports:
      - '80:80'
    depends_on:
      - api-1
      - api-2
```

```nginx
# nginx-lb.conf
upstream backend {
    least_conn; # Load balancing method
    server api-1:3000;
    server api-2:3000;
}

server {
    listen 80;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### WebSocket Scaling with Redis Adapter

```typescript
// backend/src/live/live.gateway.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}

// Multiple NestJS instances can now share WebSocket state
```

### Caching Strategy

```typescript
// backend/src/live/live.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class LiveService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getActiveStreams() {
    const cacheKey = 'live:active_streams';

    // Try cache first (30s TTL)
    let streams = await this.cacheManager.get(cacheKey);

    if (!streams) {
      // Query database
      streams = await this.liveStreamRepository.find({
        where: { status: 'live' },
        order: { viewerCount: 'DESC' }
      });

      // Cache for 30 seconds
      await this.cacheManager.set(cacheKey, streams, 30000);
    }

    return streams;
  }

  async incrementViewerCount(streamId: string) {
    // Use Redis INCR for atomic counter
    const key = `live:viewers:${streamId}`;
    const count = await this.cacheManager.store.client.incr(key);

    // Update DB every 10 increments (batch write)
    if (count % 10 === 0) {
      await this.liveStreamRepository.update(streamId, {
        viewerCount: count
      });
    }

    return count;
  }
}
```

### Database Query Optimization

```typescript
// Efficient query for discovery feed
async getDiscoveryFeed(userId: string, limit: number) {
  // Use materialized view for recommendations (refreshed every 5 min)
  const recommended = await this.db.query(`
    SELECT ls.*,
           lsr.score,
           lsr.reasons,
           s.name as seller_name,
           s.avatar_url as seller_avatar
    FROM live_streams ls
    INNER JOIN live_stream_recommendations lsr
      ON ls.id = lsr.stream_id
    INNER JOIN sellers s
      ON ls.seller_id = s.id
    WHERE lsr.user_id = $1
      AND lsr.expires_at > NOW()
      AND ls.status = 'live'
    ORDER BY lsr.score DESC
    LIMIT $2
  `, [userId, limit]);

  return recommended;
}

// Materialized view (refresh every 5 min via cron)
CREATE MATERIALIZED VIEW live_trending AS
SELECT
  ls.*,
  COALESCE(ls.viewer_count, 0) +
  COALESCE(ls.total_likes, 0) * 0.5 +
  COALESCE(ls.total_purchases, 0) * 2 AS trending_score
FROM live_streams ls
WHERE ls.status = 'live'
  AND ls.started_at > NOW() - INTERVAL '24 hours'
ORDER BY trending_score DESC;

CREATE INDEX idx_live_trending_score ON live_trending (trending_score DESC);

REFRESH MATERIALIZED VIEW CONCURRENTLY live_trending;
```

### Rate Limiting & DDoS Protection

```typescript
// backend/src/common/guards/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class LiveRateLimitGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Rate limit by user ID + IP
    const userId = req.user?.id || 'anonymous';
    const ip = req.ip || req.connection.remoteAddress;
    return `${userId}:${ip}`;
  }
}

// Apply to controllers
@Controller('live')
@UseGuards(LiveRateLimitGuard)
@Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 req/min
export class LiveController {
  // ...
}

// WebSocket rate limiting
@WebSocketGateway()
export class LiveGateway {
  private messageLimiter = new Map<string, number>();

  @SubscribeMessage('live:message')
  handleMessage(client: Socket, payload: any) {
    const userId = client.data.userId;
    const key = `${userId}:messages`;
    const count = this.messageLimiter.get(key) || 0;

    if (count > 10) {
      // 10 messages per 10 seconds
      throw new WsException('Rate limit exceeded');
    }

    this.messageLimiter.set(key, count + 1);
    setTimeout(() => {
      this.messageLimiter.delete(key);
    }, 10000);

    // Process message...
  }
}
```

### Monitoring & Alerts

```typescript
// backend/src/monitoring/metrics.service.ts
import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';

@Injectable()
export class MetricsService {
  trackStreamStarted(streamId: string, hostType: string) {
    Sentry.captureMessage('Stream Started', {
      level: 'info',
      tags: { streamId, hostType }
    });

    // Send to Datadog/CloudWatch
    this.publishMetric('live.stream.started', 1, {
      stream_id: streamId,
      host_type: hostType
    });
  }

  trackViewerJoined(streamId: string, viewerCount: number) {
    this.publishMetric('live.viewers', viewerCount, {
      stream_id: streamId
    });

    // Alert if > 1000 viewers (scale up)
    if (viewerCount > 1000) {
      this.sendAlert('High viewer count', {
        streamId,
        viewerCount,
        action: 'scale_up'
      });
    }
  }

  trackPurchase(streamId: string, amount: number) {
    this.publishMetric('live.purchase', amount, {
      stream_id: streamId
    });
  }

  private publishMetric(name: string, value: number, tags: any) {
    // Send to monitoring service (Datadog, CloudWatch, etc.)
    console.log(`[METRIC] ${name}:${value}`, tags);
  }

  private sendAlert(message: string, context: any) {
    Sentry.captureMessage(message, {
      level: 'warning',
      extra: context
    });
  }
}
```

---

## 🚀 Fases de Trabajo & Estimaciones

### **FASE 1: Fundamentos & Infraestructura** (2-3 semanas)

#### Semana 1: Setup de Infraestructura Cloud

**Tareas:**

1. **AWS Setup**
   - Crear cuenta AWS y configurar IAM roles
   - Setup AWS IVS channel para streaming
   - Configurar CloudFront CDN
   - Setup S3 buckets para thumbnails/recordings
   - **Estimación:** 1 día

2. **Database Schema Migration**
   - Extender entidades existentes (`live_streams`, `live_stream_products`, etc.)
   - Crear nuevas entidades (`live_stream_metrics`, `live_stream_recommendations`, etc.)
   - Generar y ejecutar migrations de TypeORM
   - Crear índices optimizados
   - **Estimación:** 2 días

3. **Redis Setup**
   - Configurar ElastiCache Redis o Redis local
   - Implementar Redis adapter para WebSocket scaling
   - Setup cache para active streams, viewer counts
   - **Estimación:** 1 día

4. **Environment Configuration**
   - Actualizar `.env` con credenciales AWS
   - Configurar variables para RTMP, HLS, WebSocket
   - Setup secrets management (AWS Secrets Manager)
   - **Estimación:** 0.5 días

**Entregables:**

- ✅ AWS IVS funcionando con RTMP ingest y HLS playback
- ✅ PostgreSQL con schema completo migrado
- ✅ Redis configurado y funcionando
- ✅ CloudFront CDN activo

---

#### Semana 2-3: Backend API Core

**Tareas:**

5. **Enhanced Live Stream Service**
   - Extender `LiveService` con nuevos métodos
   - Integración con AWS IVS API (create channel, get credentials)
   - Lógica de stream lifecycle (start, live, end)
   - Grabación de VOD y generación de thumbnails
   - **Estimación:** 3 días

6. **Product Overlay System**
   - API para highlight/hide productos durante live
   - WebSocket events para sincronizar overlay en tiempo real
   - Lógica de posicionamiento y pinning de productos
   - **Estimación:** 2 días

7. **Advanced Chat System**
   - Mejoras en `LiveGateway` para reacciones, moderación
   - Implementar rate limiting para mensajes
   - Sistema de badges (moderator, seller, VIP)
   - Funciones de moderación (timeout, ban, delete message)
   - **Estimación:** 3 días

8. **Real-time Metrics Service**
   - Servicio para rastrear métricas cada 30-60 segundos
   - Agregación de viewer count, messages/min, purchases
   - Almacenar en `live_stream_metrics`
   - **Estimación:** 2 días

**Entregables:**

- ✅ API REST completa para gestión de lives
- ✅ WebSocket events funcionando (chat, products, reactions)
- ✅ Sistema de moderación operativo
- ✅ Métricas en tiempo real almacenándose

---

### **FASE 2: Descubrimiento & Recomendaciones** (2 semanas) ✅ COMPLETADO

**Estado Actual:** ✅ 100% Completado - Todas las tareas finalizadas
**Última Actualización:** 2025-01-19

**Resumen de Implementación:**

- ✅ 6 features principales completadas
- ✅ 7 nuevos métodos de servicio
- ✅ 5 nuevos REST endpoints
- ✅ ~450 líneas de código agregadas
- ✅ Algoritmos de ML implementados (collaborative + content-based)
- ✅ Sistema hybrid con scoring 0-100
- ✅ Build exitoso sin errores

#### Semana 4: Discovery Feed (COMPLETADO - 100%)

**Tareas:**

9. **Active Streams Endpoint** ✅ COMPLETADO
   - ✅ `GET /api/v1/live/discover` con paginación (page, limit)
   - ✅ Filtros por categoría, tags (query params)
   - ✅ Ordenamiento por viewers, likes, trending, recent (sortBy param)
   - ✅ Caching con in-memory cache (30s TTL)
   - ✅ Método `getActiveStreamsWithFilters()` en LiveService
   - ✅ Cache key único por combinación de parámetros
   - **Archivos:**
     - `backend/src/live/live.service.ts:873-964` - Service method con cache
     - `backend/src/live/live.controller.ts:304-323` - REST endpoint
   - **Estimación:** 2 días → **Completado**

10. **Search & Categories** ✅ COMPLETADO
    - ✅ `GET /api/v1/live/search` con full-text search en title/description
    - ✅ `GET /api/v1/live/categories` - Lista de categorías únicas
    - ✅ Filtros por categoría (param category)
    - ✅ Paginación completa (page, limit, total, totalPages)
    - ✅ Método `searchStreams()` en LiveService
    - ✅ Método `getCategories()` para obtener categorías disponibles
    - **Archivos:**
    - `backend/src/live/live.service.ts:966-1007` - Search method
    - `backend/src/live/live.service.ts:1033-1042` - Categories method
    - `backend/src/live/live.controller.ts:325-340` - Search endpoint
    - `backend/src/live/live.controller.ts:351-356` - Categories endpoint
    - **Estimación:** 2 días → **Completado**

11. **Trending Algorithm** ✅ COMPLETADO
    - ✅ Trending score calculado on-the-fly:
      - `viewerCount * 1x` (peso viewers)
      - `likesCount * 0.5x` (peso likes)
      - `totalSales * 2x` (peso purchases)
      - `EXTRACT(EPOCH FROM (NOW() - startedAt)) / 3600` (decay por hora)
    - ✅ `GET /api/v1/live/trending` endpoint
    - ✅ Método `getTrendingStreams(limit)` en LiveService
    - ✅ Query builder con `addSelect()` para trending score dinámico
    - ⏳ **Pendiente:** Cron job para refresh cada 5 min (opcional)
    - **Archivos:**
    - `backend/src/live/live.service.ts:1009-1028` - Trending method
    - `backend/src/live/live.service.ts:915-923` - Trending sort in discover
    - `backend/src/live/live.controller.ts:342-349` - Trending endpoint
    - **Estimación:** 2 días → **Completado**

**Entregables:**

- ✅ Discovery feed funcionando con filtros y paginación
- ✅ Búsqueda de streams activa con full-text search
- ✅ Algoritmo de trending implementado y funcionando
- ✅ Sistema de categorías dinámico

---

#### Semana 5: Recommendation Engine (COMPLETADO - 100%)

**Tareas:**

12. **Collaborative Filtering** ✅ COMPLETADO
    - ✅ Análisis de historial de visualización usando `live_stream_viewers`
    - ✅ Algoritmo "Users who watched X also watched Y"
    - ✅ Identifica usuarios similares (mínimo 2 streams en común)
    - ✅ Recomienda streams vistos por usuarios similares
    - ✅ Scoring basado en cantidad de usuarios similares (max 100)
    - ✅ Método `getCollaborativeRecommendations(userId, limit)` en LiveService
    - **Archivos:**
      - `backend/src/live/live.service.ts:1065-1147` - Collaborative filtering method
    - **Estimación:** 3 días → **Completado**

13. **Content-Based Filtering** ✅ COMPLETADO
    - ✅ Análisis de preferencias del usuario:
      - Top 3 categorías vistas
      - Top 5 vendedores preferidos
      - Top 5 affiliates seguidos
    - ✅ Recomienda streams que coincidan con preferencias
    - ✅ Excluye streams ya vistos
    - ✅ Scoring dinámico:
      - Base: 50 puntos
      - +30 por categoría preferida
      - +20 por vendedor conocido
      - +20 por affiliate seguido
    - ✅ Método `getContentBasedRecommendations(userId, limit)` en LiveService
    - **Archivos:**
      - `backend/src/live/live.service.ts:1149-1256` - Content-based filtering method
    - **Estimación:** 2 días → **Completado**

14. **Personalized "For You" Feed** ✅ COMPLETADO
    - ✅ `GET /api/v1/live/for-you` endpoint
    - ✅ Hybrid approach combinando:
      - Collaborative filtering (60% weight)
      - Content-based filtering (40% weight)
      - Trending streams (fallback si faltan datos)
    - ✅ Scoring system (0-100) para cada stream
    - ✅ Razones de recomendación incluidas en respuesta:
      - "X users with similar taste watched this"
      - "You like [category]"
      - "From a seller you watched before"
      - "Trending now"
    - ✅ Deduplicación y merge de recomendaciones
    - ✅ Funciona sin autenticación (muestra trending)
    - ✅ Método `getForYouFeed(userId, limit)` en LiveService
    - **Archivos:**
      - `backend/src/live/live.service.ts:1258-1337` - Hybrid recommendation method
      - `backend/src/live/live.controller.ts:358-372` - For You endpoint
    - **Estimación:** 2 días → **Completado**

**Entregables:**

- ✅ Motor de recomendaciones funcionando con 3 algoritmos
- ✅ Feed personalizado "For You" con scoring y razones
- ✅ Tracking automático vía `live_stream_viewers` (usa entidad existente)
- ✅ Sistema hybrid con merge inteligente
- ✅ Fallback a trending para usuarios nuevos

---

### **FASE 3: Seller Panel & Analytics** (2 semanas)

#### Semana 6: Seller Dashboard

**Tareas:**

15. **Live Stream Creation UI**
    - Formulario para crear scheduled stream
    - Selector de productos a mostrar
    - Upload de thumbnail
    - Configuración de categoría y tags
    - **Internacionalización:** Usar `i18n` para todos los textos
    - **Estimación:** 3 días

16. **Stream Management Interface**
    - Dashboard para streams activos, pasados, programados
    - Botón "Go Live" que muestra RTMP credentials
    - Instrucciones para configurar OBS
    - Control de productos durante live (highlight/hide/pin)
    - **Internacionalización:** Traducciones completas
    - **Estimación:** 3 días

17. **Real-time Analytics Panel**
    - Gráfico de viewer count en tiempo real (Chart.js/Recharts)
    - Métricas: total views, peak viewers, avg watch time
    - Chat activity (messages/min, top reactions)
    - Product performance (clicks, add to cart, purchases)
    - Revenue tracking en vivo
    - **Internacionalización:** Números, fechas, monedas localizadas
    - **Estimación:** 3 días

**Entregables:**

- ✅ Seller panel con gestión completa de lives
- ✅ Dashboard de analytics en tiempo real
- ✅ UI 100% traducible

---

#### Semana 7: Moderation & Notifications

**Tareas:**

18. **Chat Moderation Tools**
    - UI para ver chat en seller panel
    - Botones para timeout, ban, delete message
    - Asignar moderadores adicionales
    - Log de acciones de moderación
    - **Internacionalización:** Mensajes de moderación traducidos
    - **Estimación:** 2 días

19. **Push Notifications**
    - Notificar followers cuando seller inicia live
    - Notificaciones de compras a vendedor
    - Recordatorios de streams programados
    - Integrar con Firebase Cloud Messaging (FCM)
    - **Estimación:** 2 días

20. **Scheduled Streams**
    - UI para programar lives futuros
    - Botón "Remind Me" para usuarios
    - Email/push notifications 15 min antes
    - Mostrar countdown en app
    - **Internacionalización:** Fechas y timezones
    - **Estimación:** 2 días

**Entregables:**

- ✅ Herramientas de moderación funcionales
- ✅ Sistema de notificaciones activo
- ✅ Scheduled streams implementado

---

### **FASE 4: Mobile App & Live Checkout** (3-4 semanas)

#### Semana 8: 🆕 Mobile Streaming (Seller/Affiliate)

**Tareas:**

**21. Camera Access & RTMP Publisher Integration**

- Instalar `react-native-nodemediaclient` o `react-native-live-stream`
- Request camera y microphone permissions
- Implementar RTMP publisher con device camera
- Video encoding: H.264, Audio: AAC
- Configuración de bitrate (720p: 2.5Mbps, 1080p: 4.5Mbps)
- **Estimación:** 3 días

**22. "Go Live" Flow para Sellers**

- UI para crear stream desde mobile
- Formulario: título, descripción, productos
- Preview de cámara antes de ir live
- Botón "Start Streaming" que inicia RTMP push
- **Internacionalización:** Labels y placeholders traducidos
- **Estimación:** 3 días

**23. Live Stream Controls (Mobile Streamer)**

- Bottom control panel durante streaming:
  - Botón "End Stream"
  - Toggle camera (front/back)
  - Mute/unmute microphone
  - Flash toggle (si disponible)
- Viewer count display en vivo
- Chat overlay (read-only para streamer, o collapsible)
- **Estimación:** 2 días

**24. Product Management During Mobile Live**

- Lista de productos agregados al stream
- Botón "Show" para highlight producto en viewers
- Botón "Hide" para ocultar overlay
- Pin producto (stays at top)
- Stock y sold count en tiempo real
- **Internacionalización:** Product actions traducidas
- **Estimación:** 3 días

**25. Mobile Streaming Analytics (Streamer View)**

- Mini dashboard durante live:
  - Current viewers (real-time)
  - Peak viewers
  - Messages/min
  - Products clicked
  - Purchases count
  - Revenue so far
- Gráfico simple de viewer trend
- **Estimación:** 2 días

**Entregables:**

- ✅ Sellers pueden iniciar live desde mobile app
- ✅ RTMP streaming funcional desde cámara nativa
- ✅ Controles de stream completos (camera flip, mute, end)
- ✅ Gestión de productos durante live desde mobile
- ✅ Analytics en tiempo real para streamer

---

#### Semana 9: Mobile Live Player (Viewer)

**Tareas:**

26. **Video Player Component**
    - Integrar HLS player (Expo AV o react-native-video)
    - Controls: play, pause, volume, fullscreen
    - Overlay de información (viewer count, likes)
    - Loading states y error handling
    - **Estimación:** 3 días

27. **Product Overlay UI**
    - Carousel de productos en bottom del video
    - Animación cuando producto es highlighted
    - Detalles de producto (nombre, precio, descuento live)
    - Botón "Add to Cart" prominente
    - **Internacionalización:** Usar `i18n-js` o `react-i18next`
    - **Estimación:** 3 días

28. **Live Chat Interface**
    - Input para escribir mensajes
    - Lista de mensajes con scroll automático
    - Botones de reacciones (❤️ 🔥 😍 👏 💰)
    - Badges para seller, moderator
    - **Internacionalización:** Placeholders y labels traducidos
    - **Estimación:** 2 días

**Entregables:**

- ✅ Video player funcionando con HLS
- ✅ Product overlay interactivo
- ✅ Chat en tiempo real en mobile

---

#### Semana 10-11: Live Checkout & Discovery

**Tareas:**

29. **Quick Checkout Flow**
    - Botón "Buy Now" desde product overlay
    - Modal de confirmación con:
      - Resumen de producto
      - Precio (con descuento live)
      - Shipping address (pre-filled)
      - Payment method (guardado)
    - Compra en 1-2 taps
    - **Estimación:** 3 días

30. **Purchase Attribution**
    - Asociar orden a `liveSessionId`
    - Calcular comisión si es affiliate stream
    - Actualizar métricas del stream en tiempo real
    - WebSocket event de celebración de compra
    - **Estimación:** 2 días

31. **Discovery Feed UI**
    - Screen "Live Now" con grid de streams activos
    - Thumbnails con viewer count, categoria badge
    - Pull-to-refresh para actualizar
    - Infinite scroll para paginación
    - **Internacionalización:** Categorías y badges traducidos
    - **Estimación:** 2 días

32. **"For You" Personalized Feed**
    - Integrar con recommendation API
    - Mostrar razones de recomendación ("Popular", "Siguiendo vendedor")
    - Swipeable cards para navegar recomendaciones
    - **Internacionalización:** Razones traducidas
    - **Estimación:** 2 días

33. **Search & Filters**
    - Barra de búsqueda de streams
    - Filtros por categoría, tags
    - Ordenamiento (viewers, reciente, trending)
    - **Internacionalización:** Placeholders y filtros traducidos
    - **Estimación:** 2 días

**Entregables:**

- ✅ Live checkout funcional con atribución
- ✅ Discovery feed completo
- ✅ Feed personalizado "For You"
- ✅ Búsqueda y filtros implementados

---

### **FASE 5: Optimización & Testing** (1-2 semanas)

#### Semana 12: Performance & Scalability

**Tareas:**

34. **Load Testing**
    - Simular 100+ viewers concurrentes con Locust/k6
    - Test de WebSocket connections (1000+ sockets)
    - Identificar bottlenecks en DB queries
    - Optimizar índices y queries lentas
    - **Estimación:** 2 días

35. **Caching Improvements**
    - Cache discovery feed (30s TTL)
    - Cache product details (5 min TTL)
    - Implementar cache invalidation estratégico
    - CDN caching para HLS segments
    - **Estimación:** 2 días

36. **Database Optimization**
    - Analizar slow queries con pgAdmin/pgHero
    - Agregar índices faltantes
    - Optimizar joins complejos
    - Partitioning de `live_stream_metrics` por fecha
    - **Estimación:** 2 días

37. **Auto-Scaling Configuration**
    - AWS Auto Scaling Groups para EC2
    - Scaling policies basadas en:
      - CPU > 70%
      - Viewer count > 500
      - WebSocket connections > 1000
    - **Estimación:** 1 día

**Entregables:**

- ✅ Sistema soporta 500+ viewers concurrentes
- ✅ Sub-100ms response time para APIs críticas
- ✅ Auto-scaling configurado y probado

---

#### Semana 13: Testing & QA

**Tareas:**

38. **Unit Tests**
    - Backend services (LiveService, ChatService, RecommendationEngine)
    - Mobile streaming components (RTMP publisher, camera controls)
    - Target: 80% code coverage
    - **Estimación:** 3 días

39. **Integration Tests**
    - Test completo del flow: start stream → watch → purchase
    - Test mobile streaming: camera → RTMP → AWS IVS → HLS playback
    - WebSocket event testing
    - API endpoint testing con Supertest
    - **Estimación:** 2 días

40. **E2E Testing (Mobile)**
    - Detox/Appium tests para critical flows
    - Test: Start live from mobile → manage products → end stream
    - Test: Join live → send message → purchase
    - Test: Discovery feed → search → watch
    - **Estimación:** 2 días

41. **Security Audit**
    - Review de autenticación JWT
    - Camera/microphone permissions security
    - RTMP stream key protection
    - Rate limiting en todos los endpoints
    - Input validation y sanitization
    - CORS y CSP headers
    - **Estimación:** 1 día

**Entregables:**

- ✅ Test coverage > 80%
- ✅ E2E tests passing
- ✅ Security vulnerabilities mitigadas

---

### **FASE 6: Launch & Monitoring** (1 semana)

#### Semana 14: Production Deployment

**Tareas:**

42. **Production Deployment**
    - Deploy backend a AWS EC2/ECS
    - Deploy seller panel a Vercel/Netlify
    - Release mobile app a TestFlight/Play Console (beta)
    - Configurar DNS y SSL certificates
    - **Estimación:** 2 días

43. **Monitoring Setup**
    - Sentry para error tracking
    - Datadog/CloudWatch para métricas
    - Alertas para:
      - Error rate > 1%
      - Response time > 1s
      - Viewer count > 1000 (scale alert)
      - Mobile streaming failures (RTMP connection drops)
    - **Estimación:** 1 día

44. **Documentation**
    - API documentation (Swagger/Postman)
    - Seller guide: "How to Go Live from Mobile"
    - Seller guide: "How to Go Live from OBS/Desktop"
    - Developer documentation para WebSocket events
    - Runbook para incidents
    - **Estimación:** 2 días

45. **Beta Launch**
    - Invitar 10-20 sellers para beta testing
    - Test both mobile and desktop streaming
    - Monitorear first live streams de cerca
    - Recolectar feedback y bugs
    - Hotfixes según sea necesario
    - **Estimación:** Ongoing (1-2 semanas)

**Entregables:**

- ✅ Plataforma en producción
- ✅ Monitoring y alertas activas
- ✅ Documentación completa
- ✅ Beta exitoso con feedback positivo

---

## 📅 Cronograma Resumido

| Fase                        | Duración       | Fechas Estimadas | Hitos                                         |
| --------------------------- | -------------- | ---------------- | --------------------------------------------- |
| **Fase 1: Infraestructura** | 3 semanas      | Semana 1-3       | AWS setup, DB migrations, Redis               |
| **Fase 2: Descubrimiento**  | 2 semanas      | Semana 4-5       | Discovery feed, recommendations               |
| **Fase 3: Seller Panel**    | 2 semanas      | Semana 6-7       | Stream management, analytics                  |
| **Fase 4: Mobile App** 🆕   | 4 semanas      | Semana 8-11      | Mobile streaming, player, checkout, discovery |
| **Fase 5: Optimización**    | 2 semanas      | Semana 12-13     | Performance, testing, security                |
| **Fase 6: Launch**          | 1 semana       | Semana 14        | Production deployment, monitoring             |
| **TOTAL**                   | **14 semanas** | **~3.5 meses**   | MVP completo con mobile streaming             |

---

## 🎯 Priorización de Features

### Must Have (MVP)

- ✅ Live streaming con RTMP → HLS (AWS IVS)
- ✅ 🆕 **Mobile streaming** - Sellers inician lives desde app móvil
- ✅ Product overlay durante live
- ✅ Chat en tiempo real con WebSocket
- ✅ Discovery feed (active streams)
- ✅ Live checkout con atribución
- ✅ Seller panel básico (create, manage streams)
- ✅ Mobile player con chat
- ✅ 🆕 Mobile live controls (camera flip, mute, product management)

### Should Have (Post-MVP v1.1)

- 🔶 Advanced recommendations ("For You" feed)
- 🔶 Scheduled streams con notificaciones
- 🔶 Chat moderation tools
- 🔶 Real-time analytics dashboard
- 🔶 VOD recordings playback
- 🔶 Trending algorithm

### Nice to Have (v1.2+)

- 🔷 WebRTC ultra-low latency (< 500ms)
- 🔷 Interactive features (polls, quizzes durante live)
- 🔷 Multi-host streams (co-streaming)
- 🔷 Automated highlight clips generation
- 🔷 Affiliate co-hosting con revenue split en vivo
- 🔷 Loyalty program (watch to earn rewards)

---

## 🌐 Internacionalización (i18n)

### Backend (NestJS)

```bash
npm install nestjs-i18n
```

```typescript
// backend/src/i18n/i18n.module.ts
import { Module } from '@nestjs/common';
import { I18nModule, QueryResolver, AcceptLanguageResolver } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true
      },
      resolvers: [{ use: QueryResolver, options: ['lang'] }, AcceptLanguageResolver]
    })
  ]
})
export class I18nConfigModule {}
```

```json
// backend/src/i18n/en/live.json
{
  "stream": {
    "started": "Stream started successfully",
    "ended": "Stream ended",
    "not_found": "Stream not found",
    "error": {
      "create": "Failed to create stream",
      "start": "Failed to start stream"
    }
  },
  "chat": {
    "message_sent": "Message sent",
    "timeout": "You have been timed out for {duration} minutes",
    "banned": "You have been banned from this stream"
  },
  "product": {
    "highlighted": "{productName} is now available!",
    "out_of_stock": "This product is out of stock"
  }
}
```

```json
// backend/src/i18n/es/live.json
{
  "stream": {
    "started": "Transmisión iniciada exitosamente",
    "ended": "Transmisión finalizada",
    "not_found": "Transmisión no encontrada",
    "error": {
      "create": "Error al crear transmisión",
      "start": "Error al iniciar transmisión"
    }
  },
  "chat": {
    "message_sent": "Mensaje enviado",
    "timeout": "Has sido suspendido por {duration} minutos",
    "banned": "Has sido bloqueado de esta transmisión"
  },
  "product": {
    "highlighted": "¡{productName} está ahora disponible!",
    "out_of_stock": "Este producto está agotado"
  }
}
```

### Seller Panel (Next.js)

```bash
npm install next-i18next react-i18next
```

```javascript
// seller-panel/next-i18next.config.js
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'pt']
  }
};
```

```json
// seller-panel/public/locales/en/live.json
{
  "create_stream": {
    "title": "Create Live Stream",
    "form": {
      "title_label": "Stream Title",
      "title_placeholder": "Enter a catchy title",
      "description_label": "Description",
      "category_label": "Category",
      "tags_label": "Tags",
      "products_label": "Products to Show",
      "submit": "Create Stream"
    }
  },
  "dashboard": {
    "active_streams": "Active Streams",
    "scheduled": "Scheduled",
    "past_streams": "Past Streams",
    "go_live": "Go Live",
    "analytics": {
      "viewers": "Viewers",
      "peak": "Peak",
      "purchases": "Purchases",
      "revenue": "Revenue"
    }
  }
}
```

```json
// seller-panel/public/locales/es/live.json
{
  "create_stream": {
    "title": "Crear Transmisión en Vivo",
    "form": {
      "title_label": "Título de la Transmisión",
      "title_placeholder": "Ingresa un título atractivo",
      "description_label": "Descripción",
      "category_label": "Categoría",
      "tags_label": "Etiquetas",
      "products_label": "Productos a Mostrar",
      "submit": "Crear Transmisión"
    }
  },
  "dashboard": {
    "active_streams": "Transmisiones Activas",
    "scheduled": "Programadas",
    "past_streams": "Transmisiones Pasadas",
    "go_live": "Iniciar Transmisión",
    "analytics": {
      "viewers": "Espectadores",
      "peak": "Pico",
      "purchases": "Compras",
      "revenue": "Ingresos"
    }
  }
}
```

### Mobile App (React Native)

```bash
npm install i18n-js expo-localization
```

```typescript
// mobile/src/i18n/config.ts
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

const i18n = new I18n({
  en,
  es,
  pt
});

i18n.locale = Localization.locale;
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
```

```json
// mobile/src/i18n/locales/en.json
{
  "live": {
    "watching": "Watching",
    "viewers": "viewers",
    "chat": {
      "placeholder": "Say something...",
      "send": "Send"
    },
    "products": {
      "buy_now": "Buy Now",
      "add_to_cart": "Add to Cart",
      "live_price": "Live Price",
      "discount": "off"
    },
    "discovery": {
      "live_now": "Live Now",
      "for_you": "For You",
      "trending": "Trending",
      "search_placeholder": "Search live streams"
    }
  }
}
```

```json
// mobile/src/i18n/locales/es.json
{
  "live": {
    "watching": "Viendo",
    "viewers": "espectadores",
    "chat": {
      "placeholder": "Escribe algo...",
      "send": "Enviar"
    },
    "products": {
      "buy_now": "Comprar Ahora",
      "add_to_cart": "Agregar al Carrito",
      "live_price": "Precio en Vivo",
      "discount": "descuento"
    },
    "discovery": {
      "live_now": "En Vivo Ahora",
      "for_you": "Para Ti",
      "trending": "Tendencias",
      "search_placeholder": "Buscar transmisiones en vivo"
    }
  }
}
```

### Uso en Componentes

```typescript
// Mobile component example
import i18n from '@/i18n/config';

function LiveChatInput() {
  return (
    <TextInput
      placeholder={i18n.t('live.chat.placeholder')}
    />
  );
}

// Seller panel example
import { useTranslation } from 'next-i18next';

function CreateStreamForm() {
  const { t } = useTranslation('live');

  return (
    <form>
      <label>{t('create_stream.form.title_label')}</label>
      <input placeholder={t('create_stream.form.title_placeholder')} />
    </form>
  );
}
```

---

## 🔒 Seguridad & Compliance

### Autenticación & Autorización

```typescript
// JWT verification for stream access
@UseGuards(JwtAuthGuard, LiveStreamAccessGuard)
@Get(':id')
async getStream(@Param('id') id: string, @User() user) {
  const stream = await this.liveService.findOne(id);

  // Check if private stream
  if (stream.isPrivate) {
    if (!stream.allowedViewers.includes(user.id)) {
      throw new ForbiddenException('Access denied to private stream');
    }
  }

  return stream;
}
```

### Content Moderation

```typescript
// AI-powered chat moderation
import Perspective from 'perspective-api-client';

async moderateMessage(message: string): Promise<boolean> {
  const perspective = new Perspective({ apiKey: process.env.PERSPECTIVE_API_KEY });

  const result = await perspective.analyze(message, {
    attributes: ['TOXICITY', 'SEVERE_TOXICITY', 'SPAM'],
  });

  const toxicity = result.TOXICITY.summaryScore.value;
  const spam = result.SPAM.summaryScore.value;

  // Block if toxicity > 80% or spam > 90%
  if (toxicity > 0.8 || spam > 0.9) {
    return false; // Message blocked
  }

  return true; // Message allowed
}
```

### GDPR Compliance

```typescript
// User data export
@Get('export-data')
async exportUserData(@User() user) {
  const streams = await this.liveService.findByViewer(user.id);
  const messages = await this.chatService.findByUser(user.id);
  const purchases = await this.orderService.findByUser(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
    streams_watched: streams,
    messages_sent: messages,
    purchases_made: purchases,
  };
}

// Right to be forgotten
@Delete('delete-account')
async deleteAccount(@User() user) {
  await this.liveService.anonymizeViewer(user.id);
  await this.chatService.deleteUserMessages(user.id);
  await this.userService.deleteUser(user.id);

  return { message: 'Account deleted successfully' };
}
```

---

## 📊 KPIs & Success Metrics

### Streaming Performance

- **Latency:** < 3s (HLS) or < 500ms (WebRTC)
- **Uptime:** 99.9% availability
- **Start time:** Video playback starts < 2s
- **Buffering:** < 1% of viewing time

### User Engagement

- **Concurrent viewers per stream:** Target 50-200
- **Average watch time:** > 5 minutes
- **Chat activity:** > 10 messages/min during peak
- **Reaction rate:** > 50% of viewers send at least 1 reaction

### Commerce Metrics

- **Conversion rate:** 3-5% of viewers make a purchase
- **Average order value (AOV):** $50-100
- **GMV per stream:** $1,000-5,000
- **Click-to-purchase time:** < 2 minutes

### Platform Growth

- **Daily active streams:** 20+ streams/day
- **Monthly active sellers:** 50+ sellers using live
- **Retention:** 70% of sellers go live again within 7 days
- **Discovery:** 60% of viewers come from recommendations

---

## 🧪 Testing Strategy

### Load Testing Script (k6)

```javascript
// tests/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { WebSocket } from 'k6/experimental/websockets';

export let options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 200 }, // Spike to 200 users
    { duration: '2m', target: 0 } // Ramp down
  ]
};

export default function () {
  // Test 1: Get active streams
  let res = http.get('https://api.gshop.com/api/v1/live/streams/active');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200
  });

  const streams = JSON.parse(res.body).streams;
  if (streams.length === 0) return;

  const streamId = streams[0].id;

  // Test 2: Join stream WebSocket
  const ws = new WebSocket(`wss://api.gshop.com?token=${__ENV.JWT_TOKEN}`);

  ws.on('open', () => {
    ws.send(
      JSON.stringify({
        event: 'live:join',
        data: { streamId }
      })
    );
  });

  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    check(data, {
      'received join confirmation': (d) => d.event === 'live:joined'
    });
  });

  // Simulate watching for 30 seconds
  sleep(30);

  // Test 3: Send chat message
  ws.send(
    JSON.stringify({
      event: 'live:message',
      data: { streamId, message: 'Great product!' }
    })
  );

  sleep(5);
  ws.close();
}
```

```bash
# Run load test
k6 run --vus 100 --duration 5m tests/load-test.js
```

---

## 📝 Checklist de Lanzamiento

### Pre-Launch (1 semana antes)

- [ ] Todos los tests (unit, integration, e2e) pasan
- [ ] 🆕 Mobile streaming tests completados (iOS + Android)
- [ ] 🆕 Camera/microphone permissions funcionan correctamente
- [ ] 🆕 RTMP streaming desde mobile probado con AWS IVS
- [ ] Performance testing completado (500+ concurrent viewers)
- [ ] Security audit realizado
- [ ] SSL certificates instalados
- [ ] DNS configurado correctamente
- [ ] Monitoring y alertas activas (Sentry, Datadog)
- [ ] Backup strategy implementada (DB snapshots cada 6 horas)
- [ ] Runbook de incidents documentado
- [ ] Team training completado (cómo responder a incidents)

### Launch Day

- [ ] Deploy backend a producción (AWS EC2/ECS)
- [ ] Deploy seller panel a Vercel
- [ ] Release mobile app beta (TestFlight + Play Console)
- [ ] Smoke tests en producción (API health, WebSocket connection)
- [ ] Monitor error rates y response times de cerca
- [ ] On-call engineer disponible 24/7

### Post-Launch (1 semana después)

- [ ] Recolectar feedback de beta users
- [ ] Analizar métricas de engagement (watch time, chat activity)
- [ ] Revisar error logs y crashlytics
- [ ] Identificar bugs críticos y crear hotfixes
- [ ] Optimizar queries lentas identificadas en producción
- [ ] Escalar infraestructura si es necesario

---

## 💡 Trade-offs & Recomendaciones

### RTMP vs WebRTC

| Protocolo    | Latencia | Costo | Complejidad | Recomendación |
| ------------ | -------- | ----- | ----------- | ------------- |
| **RTMP+HLS** | 3-10s    | Bajo  | Baja        | ✅ **MVP**    |
| **WebRTC**   | < 500ms  | Alto  | Alta        | ⏳ Post-MVP   |

**Decisión:** Empezar con RTMP → HLS (AWS IVS) para MVP. La latencia de 3-5 segundos es aceptable para e-commerce. WebRTC es overkill y costoso para MVP.

### Self-hosted vs Managed Streaming

| Opción          | Setup   | Costo/mes | Escalabilidad | Recomendación                   |
| --------------- | ------- | --------- | ------------- | ------------------------------- |
| **AWS IVS**     | 1 hour  | $200-500  | Auto          | ✅ **MVP**                      |
| **Self-hosted** | 2 days  | $50-100   | Manual        | 💰 Si budget limitado           |
| **Agora.io**    | 4 hours | $300-800  | Auto          | 🚀 Si ultra-low latency crítico |

**Decisión:** AWS IVS para MVP por rapidez y confiabilidad. Considerar self-hosted si costos escalan mucho (> $1000/mes).

### Database: SQL vs NoSQL para Chat

| Database       | Pros                         | Cons                        | Recomendación     |
| -------------- | ---------------------------- | --------------------------- | ----------------- |
| **PostgreSQL** | ACID, relations, SQL queries | Slower writes               | ✅ **Usar**       |
| **MongoDB**    | Fast writes, flexible schema | No ACID, harder queries     | ❌ No necesario   |
| **Redis**      | Ultra-fast, pub/sub          | No persistence (by default) | ✅ **Cache only** |

**Decisión:** PostgreSQL + Redis. Postgres para persistencia, Redis para cache y pub/sub en tiempo real.

---

## 🎉 Conclusión

Este plan de trabajo proporciona una ruta clara para transformar GSHOP en una plataforma de Live Shopping completa similar a TikTok Shop. Con una estimación de **13 semanas (3 meses)** y un **presupuesto mensual de ~$350-700 en cloud**, el MVP puede estar listo para lanzamiento beta.

### Próximos Pasos Inmediatos

1. **Aprobar este plan** con stakeholders
2. **Configurar AWS account** y crear IVS channels
3. **Iniciar Fase 1** (Infraestructura) inmediatamente
4. **Reclutar beta testers** (10-20 vendedores) para Semana 13

### Riesgos & Mitigaciones

| Riesgo                                | Probabilidad | Impacto | Mitigación                                   |
| ------------------------------------- | ------------ | ------- | -------------------------------------------- |
| Latencia alta (> 10s)                 | Baja         | Alto    | Usar AWS IVS (garantiza < 3s)                |
| 🆕 RTMP mobile inestable              | Media        | Medio   | Reconexión automática + buffering adaptativo |
| 🆕 Camera/mic permissions iOS/Android | Baja         | Alto    | Testing exhaustivo + UI clara de permisos    |
| 🆕 Battery drain en streaming         | Media        | Medio   | Optimización de bitrate + alertas de batería |
| Costos escalan rápido                 | Media        | Alto    | Monitor costos semanalmente, alertas a $500  |
| Baja adopción de sellers              | Media        | Alto    | Incentivos (comisión 0% primer mes)          |
| WebSocket no escala                   | Baja         | Medio   | Redis adapter + load balancing               |
| Bugs críticos en producción           | Media        | Alto    | Testing exhaustivo + rollback plan           |

---

**Documento creado:** Noviembre 2025
**Última actualización:** Noviembre 2025 (v1.1 - Mobile Streaming Added)
**Autor:** GSHOP Engineering Team
**Versión:** 1.1 - 🆕 Incluye Mobile Streaming para Sellers/Affiliates

---

## Anexos

### A. Recursos Útiles

- **AWS IVS Documentation:** https://docs.aws.amazon.com/ivs/
- **Socket.IO Scaling Guide:** https://socket.io/docs/v4/using-multiple-nodes/
- **OBS RTMP Setup:** https://obsproject.com/wiki/Streaming-With-SRT-Or-RIST-Protocols
- **HLS Specification:** https://datatracker.ietf.org/doc/html/rfc8216
- **WebRTC Guide:** https://webrtc.org/getting-started/overview
- 🆕 **React Native NodeMediaClient:** https://github.com/NodeMedia/react-native-nodemediaclient
- 🆕 **React Native Live Stream:** https://github.com/toystars/react-native-live-stream
- 🆕 **Expo Camera:** https://docs.expo.dev/versions/latest/sdk/camera/
- 🆕 **React Native Permissions:** https://github.com/zoontek/react-native-permissions

### B. Comandos Útiles

```bash
# Check PostgreSQL performance
psql -U gshop_user -d gshop_db -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Monitor Redis cache hit rate
redis-cli INFO stats | grep keyspace_hits

# AWS IVS list channels
aws ivs list-channels --region us-east-1

# Load test with k6
k6 run --vus 100 --duration 5m tests/load-test.js

# Database backup
pg_dump -U gshop_user -d gshop_db > backup_$(date +%Y%m%d).sql
```

### C. Contactos Clave

- **AWS Support:** support@aws.amazon.com
- **Sentry:** support@sentry.io
- **OBS Forums:** https://obsproject.com/forum/

### D. 🆕 Dependencias Técnicas Mobile Streaming

#### React Native Packages

```bash
# Core RTMP streaming library
npm install react-native-nodemediaclient
# Alternative: npm install react-native-live-stream

# Camera and microphone access
npm install expo-camera expo-av
# Or for bare React Native:
npm install react-native-vision-camera

# Permissions handling
npm install react-native-permissions

# Device info (detect battery, network)
npm install react-native-device-info

# Optional: Background task handling
npm install react-native-background-timer
```

#### iOS Setup (Info.plist)

```xml
<!-- mobile/ios/GShop/Info.plist -->
<key>NSCameraUsageDescription</key>
<string>GSHOP needs camera access to allow you to stream live videos</string>

<key>NSMicrophoneUsageDescription</key>
<string>GSHOP needs microphone access for live streaming audio</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>GSHOP needs photo library access to upload stream thumbnails</string>
```

#### Android Setup (AndroidManifest.xml)

```xml
<!-- mobile/android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

<uses-feature android:name="android.hardware.camera" android:required="true" />
<uses-feature android:name="android.hardware.camera.autofocus" />
```

#### Código de Ejemplo: RTMP Publisher

```typescript
// mobile/src/components/LiveStreamPublisher.tsx
import { NodePlayerView } from 'react-native-nodemediaclient';
import { Camera } from 'expo-camera';

export function LiveStreamPublisher({ rtmpUrl, streamKey }: Props) {
  const [hasPermission, setHasPermission] = useState(false);
  const publisherRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const startStreaming = async () => {
    const fullRtmpUrl = `${rtmpUrl}/${streamKey}`;

    publisherRef.current?.startPublish(fullRtmpUrl, {
      videoEnabled: true,
      audioEnabled: true,
      videoCodec: 'H264', // H.264 encoding
      audioCodec: 'AAC',  // AAC audio
      videoBitrate: 2500000, // 2.5 Mbps for 720p
      audioBitrate: 128000,  // 128 kbps
      fps: 30,
      videoWidth: 1280,
      videoHeight: 720,
    });
  };

  const stopStreaming = () => {
    publisherRef.current?.stopPublish();
  };

  return (
    <NodePlayerView
      ref={publisherRef}
      style={{ flex: 1 }}
      inputUrl=""
      scaleMode="aspectFit"
      bufferTime={300}
      maxBufferTime={1000}
      autoplay={false}
    />
  );
}
```

#### Configuración Recomendada de Bitrate

| Resolución | Bitrate Video | Bitrate Audio | FPS | Uso Recomendado |
| ---------- | ------------- | ------------- | --- | --------------- |
| **360p**   | 600 kbps      | 64 kbps       | 30  | Red 3G/4G débil |
| **480p**   | 1000 kbps     | 96 kbps       | 30  | 4G estándar     |
| **720p**   | 2500 kbps     | 128 kbps      | 30  | 4G/5G, WiFi ✅  |
| **1080p**  | 4500 kbps     | 192 kbps      | 30  | 5G, WiFi rápido |

**Recomendación:** Usar 720p @ 2.5 Mbps como default para balance entre calidad y consumo de datos/batería.

#### Manejo de Errores Comunes

```typescript
// Auto-reconnect on network issues
publisherRef.current?.on('NetStream.Publish.Start', () => {
  console.log('Stream started successfully');
  setStreamStatus('live');
});

publisherRef.current?.on('NetConnection.Connect.Failed', () => {
  console.error('RTMP connection failed');
  // Retry logic
  setTimeout(() => startStreaming(), 3000);
});

publisherRef.current?.on('NetStream.Publish.BadName', () => {
  console.error('Invalid stream key');
  Alert.alert('Error', 'Invalid stream credentials. Please try again.');
});
```
