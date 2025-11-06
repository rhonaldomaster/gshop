# Guía de Comisiones para Vendedores - GSHOP

## 📋 Índice

1. [¿Cómo funcionan las comisiones?](#cómo-funcionan-las-comisiones)
2. [Cálculo de comisiones](#cálculo-de-comisiones)
3. [Dashboard de comisiones](#dashboard-de-comisiones)
4. [Reportes y facturas](#reportes-y-facturas)
5. [Preguntas frecuentes](#preguntas-frecuentes)

---

## 🎯 ¿Cómo funcionan las comisiones?

### Resumen Rápido

- **Tasa de comisión**: 7% (configurable por administrador)
- **Cuándo se cobra**: Al marcar orden como "entregada"
- **Base de cálculo**: Subtotal de venta (después de descuentos, sin incluir envío)
- **Facturación**: Automática al completar la entrega

### Flujo de una Venta

```
1. Cliente realiza compra
   ├─ Subtotal productos: $100.000
   ├─ Descuento aplicado: -$10.000
   ├─ Subtotal después de descuento: $90.000
   └─ Envío: $5.000

2. Vendedor confirma y envía pedido
   └─ Estado: "En tránsito"

3. Cliente recibe y confirmas entrega
   ├─ Estado: "Entregada"
   ├─ Se calcula comisión: $90.000 × 7% = $6.300
   └─ Tu ingreso neto: $90.000 - $6.300 = $83.700

4. Sistema genera factura automáticamente
   └─ Factura disponible en tu dashboard
```

---

## 💰 Cálculo de Comisiones

### Fórmula Básica

```
Comisión = (Subtotal - Descuentos) × Tasa de Comisión
Ingreso Neto = Subtotal - Descuentos - Comisión
```

### Ejemplos Prácticos

#### Ejemplo 1: Venta Simple
```
Producto: Zapatillas Nike
Precio: $150.000
Cantidad: 1
Envío: $8.000

Cálculo:
  Subtotal: $150.000
  Comisión (7%): $10.500
  Tu ingreso neto: $139.500

  Cliente paga: $158.000 (incluye envío)
```

#### Ejemplo 2: Venta con Descuento
```
Producto: iPhone 15 Pro
Precio: $5.000.000
Descuento: -$500.000
Envío: $20.000

Cálculo:
  Subtotal después de descuento: $4.500.000
  Comisión (7%): $315.000
  Tu ingreso neto: $4.185.000

  Cliente paga: $4.520.000 (incluye envío)
```

#### Ejemplo 3: Venta Múltiple
```
Producto A: $50.000 × 2 = $100.000
Producto B: $75.000 × 1 = $75.000
Subtotal: $175.000
Envío: $12.000

Cálculo:
  Subtotal: $175.000
  Comisión (7%): $12.250
  Tu ingreso neto: $162.750

  Cliente paga: $187.000 (incluye envío)
```

### ⚠️ Importante: Qué NO incluye la comisión

- ❌ Costo de envío
- ❌ Impuestos (IVA ya incluido en precio)
- ❌ Cargo de plataforma al comprador (ese es del comprador, no del vendedor)

---

## 📊 Dashboard de Comisiones

### Acceso al Dashboard

1. Inicia sesión en el **Panel de Vendedor**
2. Ve a **Dashboard → Mis Comisiones**
3. Selecciona el mes y año que deseas revisar

### Información Disponible

#### 📈 Resumen Mensual (3 cards principales)

1. **Ventas Totales**
   - Suma de todas tus ventas del mes
   - Número de órdenes completadas
   - Color: Verde 💚

2. **Comisiones Cobradas**
   - Total de comisiones del mes
   - Porcentaje promedio cobrado
   - Color: Rojo 🔴

3. **Ingresos Netos**
   - Lo que recibirás después de comisiones
   - Equivale a: Ventas - Comisiones
   - Color: Azul 💙

#### 📉 Gráfico de Tendencia

- Visualización de 12 meses
- 3 líneas: Ventas, Comisiones, Ingresos Netos
- Ayuda a identificar patrones y proyectar ganancias

#### 📋 Tabla Detallada

Cada orden muestra:
- Número de orden
- Fecha de entrega
- Total de venta
- Tasa de comisión
- Monto de comisión
- Ingreso neto
- Estado de facturación

---

## 🧾 Reportes y Facturas

### Descargar Reporte Mensual (PDF)

1. En el dashboard de comisiones, haz clic en **"Descargar Reporte"**
2. Se descargará automáticamente: `comisiones_2025_01.pdf`
3. El reporte incluye:
   - Resumen mensual con métricas
   - Listado completo de órdenes
   - Totales y promedios
   - Fecha de generación

### Facturas Automáticas

**¿Cuándo se generan?**
- Automáticamente al marcar una orden como "Entregada"
- Dos facturas por orden:
  1. Factura de cargo al comprador (no te afecta)
  2. Factura de comisión para ti

**¿Dónde encontrarlas?**
- En tu dashboard de comisiones
- En el detalle de cada orden
- Formato de número: `GSHOP-COM-00000XXX`

**Contenido de la Factura de Comisión:**
```
FACTURA GSHOP-COM-00000123

Emisor: GSHOP SAS
        NIT 900.XXX.XXX-X
        Dirección...

Receptor: Tu Tienda SAS
          NIT XXX.XXX.XXX-X
          Dirección...

Concepto: Comisión por venta
Orden: #ORD-2025-001234
Fecha: 06/01/2025

Subtotal: $6.300
IVA: $0 (Servicio B2B)
Total: $6.300
```

---

## ❓ Preguntas Frecuentes

### ¿Cuándo se cobra la comisión?

La comisión se calcula y se descuenta **solamente cuando marcas una orden como "Entregada"**. No se cobra por órdenes pendientes, canceladas o en proceso.

### ¿Puedo ver mis comisiones antes de completar la venta?

Sí. Antes de marcar como entregada, verás un resumen:
```
¿Confirmar entrega?

Al confirmar, se calculará la comisión del 7% sobre $90.000

Comisión: $6.300
Ingreso neto: $83.700

[Cancelar] [Confirmar Entrega]
```

### ¿La comisión se calcula sobre el precio con IVA?

No. Los precios en GSHOP **ya incluyen IVA** (legislación colombiana). La comisión se calcula sobre el precio que configuras, que ya tiene el IVA incluido.

### ¿El costo de envío afecta la comisión?

No. El envío NO está incluido en el cálculo de comisiones. Solo se calcula sobre el valor de los productos.

### ¿Qué pasa si hay un descuento?

Los descuentos **reducen** la base sobre la que se calcula la comisión. Esto beneficia al vendedor.

Ejemplo:
- Precio: $100.000
- Descuento: -$20.000
- **Comisión sobre**: $80.000 (no sobre $100.000)

### ¿Puedo negociar mi tasa de comisión?

La tasa de comisión es configurable por el administrador de GSHOP. Si tienes un volumen alto de ventas o casos especiales, contacta a soporte para evaluar tu caso.

### ¿Cuándo recibo mi dinero?

El procesamiento de pagos y transferencias a vendedores se realiza semanalmente. Tu ingreso neto (ventas - comisiones) se transfiere a tu cuenta bancaria registrada cada viernes, siempre que superes el mínimo de retiro configurado.

### ¿Puedo cancelar una orden después de marcarla como entregada?

Una vez marcada como entregada y calculada la comisión, no puedes cancelarla directamente. Debes contactar a soporte para procesar devoluciones o ajustes.

### ¿Las comisiones son deducibles de impuestos?

Sí. Las facturas de comisión que recibes son documentos fiscales válidos para tu contabilidad y declaración de impuestos. Consúltalas con tu contador.

---

## 🆘 Soporte

Si tienes dudas adicionales:

- 📧 Email: vendedores@gshop.com
- 💬 Chat en vivo: Disponible en tu panel de vendedor
- 📱 WhatsApp: +57 300 123 4567
- 🕐 Horario: Lunes a Viernes, 8am - 6pm

---

**Última actualización**: 06 de enero de 2025
**Versión**: 1.0
