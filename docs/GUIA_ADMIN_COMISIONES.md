# Guía de Administración - Sistema de Comisiones y Cargos

## 📋 Índice

1. [Configuración del sistema](#configuración-del-sistema)
2. [Dashboard de comisiones](#dashboard-de-comisiones)
3. [Gestión de facturas](#gestión-de-facturas)
4. [Reportería y exportación](#reportería-y-exportación)
5. [Auditoría y logs](#auditoría-y-logs)
6. [Troubleshooting](#troubleshooting)

---

## ⚙️ Configuración del Sistema

### Tasas Configurables

#### 1. Tasa de Comisión al Vendedor

**Ubicación**: Panel Admin → Configuración → Comisiones

**Configuración actual**:
- Tasa por defecto: 7%
- Rango válido: 0% - 50%
- Afecta: Solo nuevas órdenes
- Se calcula: Al marcar orden como "entregada"

**Cómo modificar**:
```bash
# Endpoint API
PUT /api/v1/config/seller_commission_rate
Body: {
  "value": {
    "rate": 8,
    "type": "percentage"
  }
}
```

**Impacto del cambio**:
- ✅ Órdenes nuevas: Usan nueva tasa
- ✅ Órdenes existentes: Mantienen tasa original (inmutables)
- ✅ Se registra en audit log automáticamente

#### 2. Cargo de Plataforma al Comprador

**Ubicación**: Panel Admin → Configuración → Cargos

**Configuración actual**:
- Tasa por defecto: 3%
- Rango válido: 0% - 50%
- Afecta: Solo nuevas órdenes
- Se muestra: En checkout antes de pagar

**Cómo modificar**:
```bash
# Endpoint API
PUT /api/v1/config/buyer_platform_fee_rate
Body: {
  "value": {
    "rate": 4,
    "type": "percentage"
  }
}
```

### Validaciones Automáticas

El sistema valida:
- ❌ Tasas negativas
- ❌ Tasas mayores a 50%
- ❌ Valores no numéricos
- ✅ Cambios se registran en audit log con usuario y timestamp

---

## 📊 Dashboard de Comisiones

### Acceso

**Ruta**: Panel Admin → Comisiones → Gestión de Comisiones

### Filtros Disponibles

#### 1. Rango de Fechas
- Fecha inicio (opcional)
- Fecha fin (opcional)
- Filtra por: `deliveredAt` (fecha de entrega)

#### 2. Vendedor
- Select con todos los vendedores
- Muestra: Nombre de negocio
- Filtra por: `sellerId`

#### 3. Estado de Comisión
- **Todos**: Sin filtro
- **Pendiente**: `commissionStatus = 'pending'`
- **Calculada**: `commissionStatus = 'calculated'`
- **Facturada**: `commissionStatus = 'invoiced'`
- **Pagada**: `commissionStatus = 'paid'`

### Cards de Resumen

```
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│  Total Comisiones   │ │    Facturadas       │ │     Pendientes      │ │   Total Órdenes     │
│                     │ │                     │ │                     │ │                     │
│   $12.450.000       │ │   $8.300.000        │ │   $4.150.000        │ │        328          │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

### Tabla de Comisiones

Columnas:
- **Orden**: Número de orden (ej: #ORD-2025-001234)
- **Vendedor**: Nombre de negocio
- **Fecha Entrega**: Timestamp de `deliveredAt`
- **Subtotal Venta**: Suma de items - descuento
- **Tasa Comisión**: % aplicado (ej: 7%)
- **Comisión**: Monto calculado
- **Estado**: Badge con color según estado
- **Factura**: Número de factura o "-"
- **Acciones**:
  - Ver detalles
  - Descargar PDF (si facturada)

### Exportación

**Formatos disponibles**:
- CSV (para Excel/Google Sheets)
- Excel nativo (TSV format)

**Endpoint**:
```bash
GET /api/v1/admin/commissions/export?format=csv&startDate=2025-01-01&endDate=2025-01-31
```

**Contenido exportado**:
- Todas las columnas de la tabla
- Filtros aplicados se respetan
- Formato: UTF-8 con BOM (para caracteres especiales)

---

## 🧾 Gestión de Facturas

### Facturación Automática

**Trigger**: Evento `order.delivered`

**Proceso automático**:
1. Orden marcada como "entregada"
2. Se calculan comisiones
3. Se generan 2 facturas:
   - **GSHOP-FEE-XXXXXXXX**: Cargo al comprador (con IVA 19%)
   - **GSHOP-COM-XXXXXXXX**: Comisión al vendedor (sin IVA)
4. Se actualizan referencias en orden
5. Se cambia `commissionStatus` a "invoiced"

### Numeración de Facturas

**Formato**: `{PREFIX}-{TYPE}-{NUMBER}`

Ejemplos:
- `GSHOP-FEE-00000123` (Cargo comprador)
- `GSHOP-COM-00000124` (Comisión vendedor)

**Configuración**:
```json
{
  "prefix": "GSHOP",
  "current": 1,
  "padding": 8
}
```

**Secuencia thread-safe**: Garantizada por lock en base de datos

### Datos de Factura

#### Factura de Cargo (Comprador)

```
Emisor: GSHOP SAS (NIT 900.XXX.XXX-X)
Receptor: Cliente (Cédula/NIT)
Concepto: Cargo por uso de plataforma
Subtotal: $2.850
IVA (19%): $541,50
Total: $3.391,50
```

#### Factura de Comisión (Vendedor)

```
Emisor: GSHOP SAS (NIT 900.XXX.XXX-X)
Receptor: Vendedor (NIT)
Concepto: Comisión por venta
Subtotal: $6.300
IVA: $0 (Servicio B2B)
Total: $6.300
```

### PDF Generation

**Librería**: PDFKit
**Formato**: Cumple con requisitos DIAN
**Incluye**:
- Número de factura
- Fecha de emisión
- Datos emisor completos
- Datos receptor completos
- Detalle de montos
- CUFE (si integrado con DIAN)

---

## 📈 Reportería y Exportación

### Reportes Disponibles

#### 1. Reporte de Comisiones por Período

**Endpoint**:
```bash
GET /api/v1/admin/commissions?startDate=2025-01-01&endDate=2025-01-31
```

**Respuesta**:
```json
{
  "commissions": [...],
  "totalCommissions": 12450000,
  "invoicedCommissions": 8300000,
  "pendingCommissions": 4150000,
  "totalOrders": 328
}
```

#### 2. Reporte por Vendedor

**Endpoint**:
```bash
GET /api/v1/admin/commissions?sellerId=vendor-123&startDate=2025-01-01
```

**Uso**: Análisis individual de vendedores

#### 3. Reporte de Facturas

**Endpoint**:
```bash
GET /api/v1/invoicing/order/{orderId}
```

**Respuesta**: Array con ambas facturas de la orden

### Métricas Clave (KPIs)

```sql
-- Total comisiones del mes
SELECT SUM(seller_commission_amount)
FROM orders
WHERE status = 'delivered'
  AND delivered_at >= '2025-01-01'
  AND delivered_at < '2025-02-01';

-- Tasa de facturación
SELECT
  COUNT(CASE WHEN commission_status = 'invoiced' THEN 1 END) * 100.0 / COUNT(*) as rate
FROM orders
WHERE status = 'delivered';

-- Top vendedores por comisión
SELECT
  s.business_name,
  SUM(o.seller_commission_amount) as total_commissions
FROM orders o
JOIN sellers s ON o.seller_id = s.id
WHERE o.status = 'delivered'
  AND o.delivered_at >= '2025-01-01'
GROUP BY s.id, s.business_name
ORDER BY total_commissions DESC
LIMIT 10;
```

---

## 🔍 Auditoría y Logs

### Audit Log System

**Tabla**: `audit_logs`

**Eventos registrados**:
- `config.updated`: Cambios en configuración
- `invoice.generated`: Facturas generadas
- Cambios en comisiones (manual)

**Campos registrados**:
- Entity y Entity ID
- Acción (create, update, delete, view)
- Before/After values
- Usuario que realizó la acción
- IP Address y User Agent
- Timestamp

### Consultar Audit Logs

#### Por Configuración

```sql
SELECT * FROM audit_logs
WHERE entity = 'platform_config'
  AND entity_id = 'seller_commission_rate'
ORDER BY timestamp DESC;
```

#### Por Usuario

```sql
SELECT * FROM audit_logs
WHERE performed_by = 'admin-user-id'
  AND timestamp >= '2025-01-01'
ORDER BY timestamp DESC;
```

#### Últimos Cambios

```sql
SELECT
  al.*,
  u.email as user_email
FROM audit_logs al
LEFT JOIN users u ON al.performed_by = u.id
ORDER BY al.timestamp DESC
LIMIT 50;
```

### Service Methods

```typescript
// Ver historial de config
auditLogService.getConfigHistory('seller_commission_rate', 50);

// Buscar por filtros
auditLogService.search({
  entity: 'platform_config',
  action: 'UPDATE',
  startDate: new Date('2025-01-01'),
  limit: 100
});
```

---

## 🔧 Troubleshooting

### Problema: Comisión no se calculó

**Síntomas**: Orden marcada como entregada pero `sellerCommissionAmount = 0`

**Diagnóstico**:
```sql
SELECT
  id,
  status,
  seller_commission_rate,
  seller_commission_amount,
  commission_status
FROM orders
WHERE id = 'order-id-here';
```

**Soluciones**:
1. Verificar que `seller_commission_rate` no sea NULL
2. Ejecutar script de migración: `npm run migrate:commission-data`
3. Recalcular manualmente:
   ```typescript
   const order = await ordersService.findOne(orderId);
   await ordersService.updateStatus(orderId, 'delivered', order.sellerId);
   ```

### Problema: Factura no se generó

**Síntomas**: Comisión calculada pero sin `commissionInvoiceId`

**Diagnóstico**:
```sql
SELECT
  o.id,
  o.commission_status,
  o.commission_invoice_id,
  i.invoice_number
FROM orders o
LEFT JOIN invoices i ON o.commission_invoice_id = i.id
WHERE o.id = 'order-id-here';
```

**Soluciones**:
1. Verificar logs del EventListener
2. Reemitir evento manualmente:
   ```typescript
   eventEmitter.emit('order.delivered', { order });
   ```
3. Generar factura manualmente:
   ```typescript
   await invoicingService.generateSellerCommissionInvoice(order);
   ```

### Problema: Tasa incorrecta aplicada

**Síntomas**: Orden usa tasa antigua después de cambiar configuración

**Explicación**: ✅ Esto es CORRECTO. Las órdenes son inmutables y guardan la tasa vigente al momento de creación.

**Verificar**:
```sql
SELECT
  id,
  created_at,
  seller_commission_rate,
  platform_fee_rate
FROM orders
WHERE id = 'order-id-here';
```

### Problema: Números de factura duplicados

**Síntomas**: ERROR: duplicate key value violates unique constraint

**Causa**: Race condition en generación de número

**Solución**:
1. Ya tiene lock en `getNextInvoiceNumber()`
2. Si persiste, verificar transacción:
   ```typescript
   await dataSource.transaction(async (manager) => {
     // Generar factura dentro de transacción
   });
   ```

### Problema: Performance lento en dashboard

**Síntomas**: Dashboard de comisiones tarda >5 segundos

**Diagnóstico**:
```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE delivered_at >= '2025-01-01'
  AND commission_status != 'pending';
```

**Soluciones**:
1. Verificar índices existen:
   ```sql
   \d orders
   -- Debe tener: IDX_orders_delivered_at, IDX_orders_commission_status
   ```
2. Agregar paginación en queries
3. Implementar caché en ConfigService (ya implementado con TTL 1min)

---

## 📞 Contacto Técnico

Para soporte técnico de administración:

- 🔧 Tech Lead: tech@gshop.com
- 📚 Documentación: https://docs.gshop.com
- 🐛 Reportar bugs: https://github.com/gshop/issues

---

**Última actualización**: 06 de enero de 2025
**Versión**: 1.0
**Sistema**: v1.8 (8/8 fases completadas)
