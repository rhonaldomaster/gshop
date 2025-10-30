# Plan de Implementación: Sistema de IVA Colombiano

## 📊 Estado del Proyecto

**Última actualización**: 2025-10-30
**Progreso total**: 75% completado (11/14 tareas principales)

### ✅ Completado

#### Backend (100% completado)
- ✅ **Database Schema**:
  - Enum `VatType` y constante `VAT_RATES` creados en `product.entity.ts`
  - Campos `vatType`, `basePrice`, `vatAmount` agregados a `Product` entity
  - Métodos `calculatePrices()` y `getVatInfo()` implementados en `Product`
  - Campos VAT agregados a `OrderItem` entity (vatType, basePrice, vatAmountPerUnit, totalBasePrice, totalVatAmount)
  - Campos VAT agregados a `Order` entity (subtotalBase, totalVatAmount, vatBreakdown)
  - Migración `1761860408199-AddVatFieldsToProducts.ts` generada y aplicada exitosamente
  - Columnas verificadas en PostgreSQL (products, order_items, orders)

- ✅ **Services**:
  - `ProductsService.create()` actualizado para calcular precios automáticamente con `calculatePrices()`
  - `ProductsService.update()` actualizado para recalcular cuando cambia precio o vatType
  - `CartService.recalculateCart()` actualizado - eliminado cálculo de taxAmount adicional
  - `OrdersService.create()` actualizado con cálculo completo de VAT breakdown
  - `OrdersService.validateAndCalculateOrder()` actualizado para generar vatBreakdown por categoría

- ✅ **DTOs**:
  - `CreateProductDto` actualizado con campo opcional `vatType` (default: GENERAL)
  - `UpdateProductDto` actualizado con campos `basePrice` y `vatAmount` (auto-calculados)

#### Mobile App (50% completado)
- ✅ **CartContext**:
  - Eliminados todos los cálculos de `taxAmount * 0.1` en todos los reducers
  - Actualizado `SET_LOCAL_CART`, `ADD_ITEM`, `REMOVE_ITEM`, `UPDATE_QUANTITY`, `UPDATE_TOTALS`
  - Total ahora se calcula como: `subtotal + shippingCost - couponDiscount` (sin taxAmount adicional)

### ⏳ Pendiente

#### Mobile App
- ⏳ Actualizar interfaz `Product` en `src/services/products.service.ts` con campos VAT (vatType, basePrice, vatAmount)
- ⏳ Actualizar componentes que muestren desglose de IVA en detalles de producto (opcional)

#### Seller Panel
- ⏳ Actualizar formulario de creación/edición de productos
  - Agregar selector de tipo de IVA (Excluido 0%, Exento 0%, Reducido 5%, General 19%)
  - Mostrar cálculo automático de basePrice y vatAmount
  - Componente UI para selector de IVA con tooltips explicativos

#### Testing & Verificación
- ⏳ Probar flujo completo end-to-end:
  - Crear producto con cada tipo de IVA
  - Verificar cálculos en carrito
  - Crear orden y verificar vatBreakdown
  - Revisar que no se sume IVA adicional en checkout

### 🔧 Archivos Modificados

**Backend**:
- `src/database/entities/product.entity.ts` - Agregados campos y métodos VAT
- `src/database/entities/order-item.entity.ts` - Agregados campos VAT
- `src/database/entities/order.entity.ts` - Agregados campos VAT breakdown
- `src/database/migrations/1761860408199-AddVatFieldsToProducts.ts` - Nueva migración
- `src/products/products.service.ts` - Actualizado create() y update()
- `src/products/dto/create-product.dto.ts` - Agregado campo vatType
- `src/products/dto/update-product.dto.ts` - Agregados campos basePrice y vatAmount
- `src/cart/cart.service.ts` - Eliminado cálculo de taxAmount
- `src/orders/orders.service.ts` - Agregado cálculo de VAT breakdown

**Mobile**:
- `src/contexts/CartContext.tsx` - Eliminado cálculo de taxAmount en todos los reducers

**Pendientes**:
- `mobile/src/services/products.service.ts` - Actualizar interfaz Product
- `seller-panel/app/dashboard/products/create/page.tsx` - Agregar selector IVA
- `seller-panel/app/dashboard/products/[id]/edit/page.tsx` - Agregar selector IVA

---

## 📋 Descripción del Problema

Actualmente, el sistema calcula el IVA como un 10% adicional en el carrito/checkout, lo cual es **INCORRECTO** para Colombia.

**En Colombia**:
- El precio del producto **SIEMPRE INCLUYE EL IVA**
- El IVA no se suma después, ya está dentro del precio mostrado
- Hay 4 categorías de IVA según la legislación colombiana

## ✅ Categorías de IVA en Colombia (Confirmadas 2025)

| Categoría | Tarifa | Descripción | Derecho a Descuentos |
|-----------|--------|-------------|---------------------|
| **EXCLUIDO** | 0% | No causa IVA, no da derecho a descuentos tributarios | ❌ No |
| **EXENTO** | 0% | No causa IVA, SÍ da derecho a descuentos tributarios | ✅ Sí |
| **REDUCIDO** | 5% | Tarifa reducida para canasta básica (embutidos, etc.) | ✅ Sí |
| **GENERAL** | 19% | Tarifa general para la mayoría de productos | ✅ Sí |

### Ejemplos de Productos por Categoría

- **Excluido**: Servicios educativos, servicios de salud
- **Exento**: Pan, leche, huevos, papa, cebolla, tomate (canasta básica)
- **5%**: Embutidos, salchichas, café procesado
- **19%**: Electrónicos, ropa, calzado, joyas, vehículos

## 🎯 Objetivos

1. ✅ Permitir que el vendedor seleccione el tipo de IVA al crear un producto
2. ✅ Almacenar el precio base (sin IVA), el IVA incluido, y el precio final (con IVA)
3. ✅ Mostrar correctamente el precio CON IVA incluido en toda la aplicación
4. ✅ Calcular correctamente los totales en el carrito sin sumar IVA adicional
5. ✅ Permitir al admin ver el desglose de IVA para declaraciones fiscales
6. ✅ Generar reportes de IVA recaudado por categoría

## 📦 Cambios Requeridos

### 1. Backend - Database Schema

#### 1.1. Crear Enum de Tipos de IVA
**Archivo**: `backend/src/database/entities/product.entity.ts`

```typescript
export enum VatType {
  EXCLUIDO = 'excluido',    // 0% - No tax deduction rights
  EXENTO = 'exento',        // 0% - With tax deduction rights
  REDUCIDO = 'reducido',    // 5%
  GENERAL = 'general',      // 19%
}

export const VAT_RATES = {
  [VatType.EXCLUIDO]: 0,
  [VatType.EXENTO]: 0,
  [VatType.REDUCIDO]: 0.05,
  [VatType.GENERAL]: 0.19,
};
```

#### 1.2. Modificar Product Entity
**Archivo**: `backend/src/database/entities/product.entity.ts`

**Campos a agregar**:
```typescript
@ApiProperty({ enum: VatType })
@Column({
  type: 'enum',
  enum: VatType,
  default: VatType.GENERAL,
})
vatType: VatType;

@ApiProperty()
@Column('decimal', { precision: 10, scale: 2 })
basePrice: number; // Price without VAT

@ApiProperty()
@Column('decimal', { precision: 10, scale: 2 })
vatAmount: number; // VAT amount included

// price already exists - will be the price WITH VAT (price = basePrice + vatAmount)
```

**Método helper a agregar**:
```typescript
/**
 * Calculate prices automatically based on vatType
 * @param priceWithVat - Final price including VAT
 */
calculatePrices(priceWithVat: number): void {
  const vatRate = VAT_RATES[this.vatType];
  // Price with VAT / (1 + VAT rate) = Base price
  this.basePrice = priceWithVat / (1 + vatRate);
  this.vatAmount = priceWithVat - this.basePrice;
  this.price = priceWithVat;
}

/**
 * Get VAT information for this product
 */
getVatInfo(): {
  type: VatType;
  rate: number;
  basePrice: number;
  vatAmount: number;
  finalPrice: number;
} {
  return {
    type: this.vatType,
    rate: VAT_RATES[this.vatType],
    basePrice: this.basePrice,
    vatAmount: this.vatAmount,
    finalPrice: this.price,
  };
}
```

#### 1.3. Modificar OrderItem Entity
**Archivo**: `backend/src/database/entities/order-item.entity.ts`

**Campos a agregar**:
```typescript
@ApiProperty({ enum: VatType })
@Column({
  type: 'enum',
  enum: VatType,
})
vatType: VatType;

@ApiProperty()
@Column('decimal', { precision: 10, scale: 2 })
basePrice: number; // Unit base price without VAT

@ApiProperty()
@Column('decimal', { precision: 10, scale: 2 })
vatAmountPerUnit: number; // VAT per unit

@ApiProperty()
@Column('decimal', { precision: 10, scale: 2 })
totalBasePrice: number; // basePrice * quantity

@ApiProperty()
@Column('decimal', { precision: 10, scale: 2 })
totalVatAmount: number; // vatAmountPerUnit * quantity

// unitPrice and totalPrice already exist (with VAT included)
```

#### 1.4. Modificar Order Entity
**Archivo**: `backend/src/database/entities/order.entity.ts`

**Campos a agregar**:
```typescript
@ApiProperty()
@Column('decimal', { precision: 10, scale: 2, default: 0 })
subtotalBase: number; // Sum of all basePrices (without VAT)

@ApiProperty()
@Column('decimal', { precision: 10, scale: 2, default: 0 })
totalVatAmount: number; // Sum of all VAT included

// subtotal already exists - will be the total WITH VAT included (before shipping)

@ApiProperty()
@Column('json', { nullable: true })
vatBreakdown: {
  excluido: { base: number; vat: number; total: number };
  exento: { base: number; vat: number; total: number };
  reducido: { base: number; vat: number; total: number };
  general: { base: number; vat: number; total: number };
};
```

#### 1.5. Crear Migration
**Archivo**: `backend/src/database/migrations/XXXXXX-AddVatFieldsToProducts.ts`

```bash
cd backend
npm run migration:generate -- -n AddVatFieldsToProducts
```

### 2. Backend - Services

#### 2.1. Modificar ProductsService
**Archivo**: `backend/src/products/products.service.ts`

**Cambios en `create()` method**:
```typescript
async create(createProductDto: CreateProductDto, sellerId: string): Promise<Product> {
  const product = this.productsRepository.create({
    ...createProductDto,
    sellerId,
  });

  // Calculate prices with VAT included
  product.calculatePrices(createProductDto.price);

  return await this.productsRepository.save(product);
}
```

**Cambios en `update()` method**:
```typescript
async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
  const product = await this.findOne(id);

  Object.assign(product, updateProductDto);

  // Recalculate prices if price or vatType changed
  if (updateProductDto.price || updateProductDto.vatType) {
    product.calculatePrices(updateProductDto.price || product.price);
  }

  return await this.productsRepository.save(product);
}
```

**Agregar método de utilidad**:
```typescript
/**
 * Get VAT statistics by category
 */
async getVatStatistics(sellerId?: string): Promise<VatStatistics> {
  const queryBuilder = this.productsRepository.createQueryBuilder('product');

  if (sellerId) {
    queryBuilder.where('product.sellerId = :sellerId', { sellerId });
  }

  const products = await queryBuilder.getMany();

  const stats = {
    excluido: { count: 0, totalBase: 0, totalVat: 0, totalFinal: 0 },
    exento: { count: 0, totalBase: 0, totalVat: 0, totalFinal: 0 },
    reducido: { count: 0, totalBase: 0, totalVat: 0, totalFinal: 0 },
    general: { count: 0, totalBase: 0, totalVat: 0, totalFinal: 0 },
  };

  products.forEach(product => {
    const vatInfo = product.getVatInfo();
    const category = vatInfo.type;
    stats[category].count++;
    stats[category].totalBase += vatInfo.basePrice;
    stats[category].totalVat += vatInfo.vatAmount;
    stats[category].totalFinal += vatInfo.finalPrice;
  });

  return stats;
}
```

#### 2.2. Modificar CartService
**Archivo**: `backend/src/cart/cart.service.ts`

**Cambios en cálculo de totales**:
```typescript
private calculateTotals(cart: Cart): {
  itemCount: number;
  subtotal: number;
  subtotalBase: number;
  totalVatAmount: number;
  shippingCost: number;
  total: number;
  vatBreakdown: VatBreakdown;
} {
  let itemCount = 0;
  let subtotal = 0;
  let subtotalBase = 0;
  let totalVatAmount = 0;

  const vatBreakdown = {
    excluido: { base: 0, vat: 0, total: 0 },
    exento: { base: 0, vat: 0, total: 0 },
    reducido: { base: 0, vat: 0, total: 0 },
    general: { base: 0, vat: 0, total: 0 },
  };

  cart.items.forEach((item) => {
    if (!item.savedForLater) {
      itemCount += item.quantity;

      const product = item.product;
      const itemSubtotal = product.price * item.quantity;
      const itemBasePrice = product.basePrice * item.quantity;
      const itemVatAmount = product.vatAmount * item.quantity;

      subtotal += itemSubtotal;
      subtotalBase += itemBasePrice;
      totalVatAmount += itemVatAmount;

      // Add to category breakdown
      const vatType = product.vatType;
      vatBreakdown[vatType].base += itemBasePrice;
      vatBreakdown[vatType].vat += itemVatAmount;
      vatBreakdown[vatType].total += itemSubtotal;
    }
  });

  // Shipping cost (without VAT, or calculate shipping VAT separately)
  const shippingCost = subtotal >= 100000 ? 0 : 10000; // COP

  // Final total
  const total = subtotal + shippingCost - (cart.couponDiscount || 0);

  return {
    itemCount,
    subtotal,
    subtotalBase,
    totalVatAmount,
    shippingCost,
    total,
    vatBreakdown,
  };
}
```

**ELIMINAR el cálculo de taxAmount**:
```typescript
// BEFORE (INCORRECT):
// const taxAmount = subtotal * 0.1;
// const total = subtotal + shippingCost + taxAmount;

// AFTER (CORRECT):
// VAT is already included in subtotal, nothing additional to add
const total = subtotal + shippingCost - couponDiscount;
```

#### 2.3. Modificar OrdersService
**Archivo**: `backend/src/orders/orders.service.ts`

**Cambios en `create()` method**:
```typescript
async create(createOrderDto: CreateOrderDto, userId?: string): Promise<Order> {
  // ... existing code ...

  // Create order items with VAT information
  const orderItems = await Promise.all(
    items.map(async (item) => {
      const product = await this.productsService.findOne(item.productId);

      const orderItem = this.orderItemsRepository.create({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price, // With VAT
        basePrice: product.basePrice, // Without VAT
        vatType: product.vatType,
        vatAmountPerUnit: product.vatAmount,
        totalBasePrice: product.basePrice * item.quantity,
        totalVatAmount: product.vatAmount * item.quantity,
        totalPrice: product.price * item.quantity,
        productSnapshot: {
          name: product.name,
          sku: product.sku,
          image: product.images?.[0],
        },
      });

      return orderItem;
    })
  );

  // Calculate totals with VAT breakdown
  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const subtotalBase = orderItems.reduce((sum, item) => sum + item.totalBasePrice, 0);
  const totalVatAmount = orderItems.reduce((sum, item) => sum + item.totalVatAmount, 0);

  // Calculate breakdown by category
  const vatBreakdown = this.calculateVatBreakdown(orderItems);

  const order = this.ordersRepository.create({
    ...createOrderDto,
    userId,
    items: orderItems,
    subtotal,
    subtotalBase,
    totalVatAmount,
    vatBreakdown,
    shippingCost: createOrderDto.shippingCost || 0,
    total: subtotal + (createOrderDto.shippingCost || 0),
    status: OrderStatus.PENDING,
  });

  return await this.ordersRepository.save(order);
}

private calculateVatBreakdown(orderItems: OrderItem[]): VatBreakdown {
  const breakdown = {
    excluido: { base: 0, vat: 0, total: 0 },
    exento: { base: 0, vat: 0, total: 0 },
    reducido: { base: 0, vat: 0, total: 0 },
    general: { base: 0, vat: 0, total: 0 },
  };

  orderItems.forEach((item) => {
    const vatType = item.vatType;
    breakdown[vatType].base += item.totalBasePrice;
    breakdown[vatType].vat += item.totalVatAmount;
    breakdown[vatType].total += item.totalPrice;
  });

  return breakdown;
}
```

### 3. Backend - DTOs

#### 3.1. Modificar CreateProductDto
**Archivo**: `backend/src/products/dto/create-product.dto.ts`

```typescript
import { VatType } from '../entities/product.entity';

export class CreateProductDto {
  // ... existing fields ...

  @ApiProperty({
    enum: VatType,
    description: 'Colombian VAT type',
    example: VatType.GENERAL,
  })
  @IsEnum(VatType)
  @IsNotEmpty()
  vatType: VatType;

  @ApiProperty({
    description: 'Price WITH VAT included (customer-facing price)',
    example: 119000,
  })
  @IsNumber()
  @IsPositive()
  price: number;

  // basePrice and vatAmount are calculated automatically
}
```

#### 3.2. Crear VatReportDto
**Archivo**: `backend/src/analytics/dto/vat-report.dto.ts`

```typescript
export class VatReportDto {
  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  breakdown: {
    excluido: { base: number; vat: number; total: number; orders: number };
    exento: { base: number; vat: number; total: number; orders: number };
    reducido: { base: number; vat: number; total: number; orders: number };
    general: { base: number; vat: number; total: number; orders: number };
  };

  @ApiProperty()
  totalBase: number;

  @ApiProperty()
  totalVat: number;

  @ApiProperty()
  totalWithVat: number;
}
```

### 4. Backend - Controllers

#### 4.1. Agregar Endpoint de Reporte de IVA
**Archivo**: `backend/src/analytics/analytics.controller.ts`

```typescript
@Get('vat-report')
@UseGuards(JwtAuthGuard)
async getVatReport(
  @Query('startDate') startDate: string,
  @Query('endDate') endDate: string,
  @Query('sellerId') sellerId?: string,
): Promise<VatReportDto> {
  return await this.analyticsService.generateVatReport(
    new Date(startDate),
    new Date(endDate),
    sellerId,
  );
}
```

### 5. Mobile App - Cambios

#### 5.1. Actualizar CartContext
**Archivo**: `mobile/src/contexts/CartContext.tsx`

**ELIMINAR todo el cálculo de taxAmount**:

```typescript
// LINES 121, 162, 181, 205, 233, 266 - REMOVE:
// const taxAmount = subtotal * 0.1;

// REPLACE WITH:
const taxAmount = 0; // VAT already included in price

// UPDATE total calculation:
// BEFORE:
// const total = subtotal + shippingCost + taxAmount - couponDiscount;

// AFTER:
const total = subtotal + shippingCost - couponDiscount;
```

#### 5.2. Actualizar Interface de Product
**Archivo**: `mobile/src/services/products.service.ts`

```typescript
export enum VatType {
  EXCLUIDO = 'excluido',
  EXENTO = 'exento',
  REDUCIDO = 'reducido',
  GENERAL = 'general',
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // With VAT included
  basePrice: number; // Without VAT
  vatAmount: number; // VAT amount
  vatType: VatType; // VAT type
  // ... other existing fields ...
}
```

#### 5.3. Actualizar Pantalla de Checkout
**Archivo**: `mobile/src/screens/checkout/CheckoutScreen.tsx`

**Mostrar desglose de IVA (opcional)**:
```tsx
<View style={styles.priceBreakdown}>
  <View style={styles.priceRow}>
    <Text style={styles.priceLabel}>Subtotal (con IVA incluido)</Text>
    <Text style={styles.priceValue}>${subtotal.toFixed(2)}</Text>
  </View>

  {/* REMOVE this line: */}
  {/* <View style={styles.priceRow}>
    <Text style={styles.priceLabel}>IVA (10%)</Text>
    <Text style={styles.priceValue}>${taxAmount.toFixed(2)}</Text>
  </View> */}

  <View style={styles.priceRow}>
    <Text style={styles.priceLabel}>Envío</Text>
    <Text style={styles.priceValue}>${shippingCost.toFixed(2)}</Text>
  </View>

  {couponDiscount > 0 && (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>Descuento</Text>
      <Text style={styles.priceValue}>-${couponDiscount.toFixed(2)}</Text>
    </View>
  )}

  <View style={styles.totalRow}>
    <Text style={styles.totalLabel}>Total</Text>
    <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
  </View>
</View>
```

#### 5.4. Actualizar Pantalla de Carrito
**Archivo**: `mobile/src/screens/cart/CartScreen.tsx`

Similar al checkout, **ELIMINAR** cualquier mención de "IVA adicional" o "Tax".

### 6. Seller Panel - Cambios

#### 6.1. Actualizar Formulario de Crear Producto
**Archivo**: `seller-panel/app/dashboard/products/new/page.tsx`

**Agregar selector de tipo de IVA**:
```tsx
<div>
  <label htmlFor="vatType" className="block text-sm font-medium text-gray-700">
    Tipo de IVA *
  </label>
  <select
    id="vatType"
    name="vatType"
    value={formData.vatType}
    onChange={handleChange}
    required
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
  >
    <option value="excluido">Excluido (0% - Sin derecho a descuentos)</option>
    <option value="exento">Exento (0% - Con derecho a descuentos)</option>
    <option value="reducido">Reducido (5%)</option>
    <option value="general">General (19%)</option>
  </select>
  <p className="mt-1 text-sm text-gray-500">
    Selecciona la categoría de IVA según la ley colombiana
  </p>
</div>

<div>
  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
    Precio CON IVA incluido (COP) *
  </label>
  <input
    type="number"
    id="price"
    name="price"
    value={formData.price}
    onChange={handleChange}
    required
    min="0"
    step="100"
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
  />
  <p className="mt-1 text-sm text-gray-500">
    Este es el precio que verán los clientes (IVA incluido)
  </p>

  {formData.price && formData.vatType && (
    <div className="mt-2 p-2 bg-blue-50 rounded">
      <p className="text-sm text-blue-800">
        <strong>Desglose:</strong>
        <br />
        Base sin IVA: ${calculateBasePrice(formData.price, formData.vatType).toFixed(2)}
        <br />
        IVA ({getVatRate(formData.vatType) * 100}%): ${calculateVatAmount(formData.price, formData.vatType).toFixed(2)}
        <br />
        Precio final: ${formData.price}
      </p>
    </div>
  )}
</div>
```

**Agregar funciones helper**:
```typescript
const VAT_RATES = {
  excluido: 0,
  exento: 0,
  reducido: 0.05,
  general: 0.19,
};

function getVatRate(vatType: string): number {
  return VAT_RATES[vatType] || 0;
}

function calculateBasePrice(priceWithVat: number, vatType: string): number {
  const rate = getVatRate(vatType);
  return priceWithVat / (1 + rate);
}

function calculateVatAmount(priceWithVat: number, vatType: string): number {
  const basePrice = calculateBasePrice(priceWithVat, vatType);
  return priceWithVat - basePrice;
}
```

#### 6.2. Actualizar Vista de Productos
**Archivo**: `seller-panel/app/dashboard/products/page.tsx`

**Mostrar tipo de IVA en la tabla**:
```tsx
<td className="px-6 py-4 whitespace-nowrap">
  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getVatBadgeColor(product.vatType)}`}>
    {getVatLabel(product.vatType)}
  </span>
</td>
```

**Helper functions**:
```typescript
function getVatLabel(vatType: string): string {
  const labels = {
    excluido: 'Excluido (0%)',
    exento: 'Exento (0%)',
    reducido: 'Reducido (5%)',
    general: 'General (19%)',
  };
  return labels[vatType] || vatType;
}

function getVatBadgeColor(vatType: string): string {
  const colors = {
    excluido: 'bg-gray-100 text-gray-800',
    exento: 'bg-green-100 text-green-800',
    reducido: 'bg-yellow-100 text-yellow-800',
    general: 'bg-blue-100 text-blue-800',
  };
  return colors[vatType] || 'bg-gray-100 text-gray-800';
}
```

### 7. Admin Panel - Cambios

#### 7.1. Crear Página de Reporte de IVA
**Archivo**: `admin-web/app/reports/vat/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export default function VatReportPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/analytics/vat-report', {
        params: { startDate, endDate },
      });
      setReport(data);
    } catch (error) {
      console.error('Error fetching VAT report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Reporte de IVA</h1>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReport}
              disabled={loading || !startDate || !endDate}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Generando...' : 'Generar Reporte'}
            </button>
          </div>
        </div>
      </div>

      {report && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Desglose de IVA</h2>

          <div className="grid grid-cols-4 gap-4 mb-6">
            {Object.entries(report.breakdown).map(([category, data]) => (
              <div key={category} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2 capitalize">
                  {category}
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base:</span>
                    <span className="font-medium">
                      ${data.base.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA:</span>
                    <span className="font-medium">
                      ${data.vat.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold">
                      ${data.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Órdenes:</span>
                    <span>{data.orders}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">Totales</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">Total Base (sin IVA)</p>
                <p className="text-2xl font-bold">
                  ${report.totalBase.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">Total IVA Recaudado</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${report.totalVat.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">Total con IVA</p>
                <p className="text-2xl font-bold text-green-600">
                  ${report.totalWithVat.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 7.2. Actualizar Vista de Productos
**Archivo**: `admin-web/app/products/page.tsx`

Agregar columna de "Tipo IVA" en la tabla de productos similar al seller panel.

### 8. Internacionalización

#### 8.1. Agregar Traducciones
**Archivo**: `mobile/src/i18n/locales/es.json`

```json
{
  "vat": {
    "excluido": "Excluido (0%)",
    "exento": "Exento (0%)",
    "reducido": "Reducido (5%)",
    "general": "General (19%)",
    "included": "IVA incluido",
    "breakdown": "Desglose de IVA",
    "base": "Base sin IVA",
    "amount": "IVA",
    "total": "Total con IVA"
  }
}
```

## 🗂️ Checklist de Implementación

### Fase 1: Backend Database & Entities (2-3 horas)
- [ ] 1.1. Crear enum `VatType` y constante `VAT_RATES`
- [ ] 1.2. Agregar campos `vatType`, `basePrice`, `vatAmount` a `Product` entity
- [ ] 1.3. Agregar método `calculatePrices()` a `Product` entity
- [ ] 1.4. Agregar método `getVatInfo()` a `Product` entity
- [ ] 1.5. Agregar campos de IVA a `OrderItem` entity
- [ ] 1.6. Agregar campos `subtotalBase`, `totalVatAmount`, `vatBreakdown` a `Order` entity
- [ ] 1.7. Generar y ejecutar migration
- [ ] 1.8. Verificar que la migración aplicó correctamente

### Fase 2: Backend Services (3-4 horas)
- [ ] 2.1. Modificar `ProductsService.create()` para calcular precios con IVA
- [ ] 2.2. Modificar `ProductsService.update()` para recalcular precios
- [ ] 2.3. Agregar método `getVatStatistics()` a `ProductsService`
- [ ] 2.4. Modificar `CartService.calculateTotals()` - ELIMINAR taxAmount
- [ ] 2.5. Agregar cálculo de `vatBreakdown` en `CartService`
- [ ] 2.6. Modificar `OrdersService.create()` para guardar datos de IVA
- [ ] 2.7. Agregar método `calculateVatBreakdown()` a `OrdersService`
- [ ] 2.8. Crear `AnalyticsService.generateVatReport()`
- [ ] 2.9. Probar endpoints con Postman/Insomnia

### Fase 3: Backend DTOs & Controllers (1-2 horas)
- [ ] 3.1. Modificar `CreateProductDto` para incluir `vatType`
- [ ] 3.2. Modificar `UpdateProductDto` para incluir `vatType`
- [ ] 3.3. Crear `VatReportDto`
- [ ] 3.4. Agregar endpoint `/analytics/vat-report`
- [ ] 3.5. Actualizar Swagger documentation
- [ ] 3.6. Probar DTOs con validación

### Fase 4: Mobile App (2-3 horas)
- [ ] 4.1. Actualizar interface `Product` con campos de IVA
- [ ] 4.2. ELIMINAR cálculo de `taxAmount` en `CartContext` (líneas 121, 162, 181, 205, 233, 266)
- [ ] 4.3. Actualizar `CheckoutScreen` - eliminar línea de "IVA (10%)"
- [ ] 4.4. Actualizar `CartScreen` - eliminar referencia a tax
- [ ] 4.5. Actualizar `ProductDetailScreen` - mostrar "IVA incluido"
- [ ] 4.6. Agregar traducciones de IVA en `es.json`
- [ ] 4.7. Probar flujo completo de compra en móvil
- [ ] 4.8. Verificar cálculos en carrito y checkout

### Fase 5: Seller Panel (2-3 horas)
- [ ] 5.1. Agregar selector de `vatType` en formulario de crear producto
- [ ] 5.2. Agregar desglose de precio en tiempo real (base + IVA = total)
- [ ] 5.3. Agregar funciones helper `calculateBasePrice()`, `calculateVatAmount()`
- [ ] 5.4. Actualizar formulario de editar producto
- [ ] 5.5. Agregar columna "Tipo IVA" en tabla de productos
- [ ] 5.6. Agregar badges de color por tipo de IVA
- [ ] 5.7. Probar creación y edición de productos
- [ ] 5.8. Verificar que los cálculos son correctos

### Fase 6: Admin Panel (3-4 horas)
- [ ] 6.1. Crear página `/reports/vat`
- [ ] 6.2. Implementar filtros por fecha
- [ ] 6.3. Mostrar desglose por categoría de IVA
- [ ] 6.4. Mostrar totales generales
- [ ] 6.5. Agregar columna "Tipo IVA" en vista de productos
- [ ] 6.6. Crear dashboard de estadísticas de IVA
- [ ] 6.7. Agregar export a PDF/Excel del reporte
- [ ] 6.8. Probar generación de reportes con datos reales

### Fase 7: Testing & QA (2-3 horas)
- [ ] 7.1. Probar creación de producto con cada tipo de IVA (excluido, exento, 5%, 19%)
- [ ] 7.2. Verificar cálculos de precio base y IVA en backend
- [ ] 7.3. Probar flujo completo de compra en mobile app
- [ ] 7.4. Verificar que el carrito NO suma IVA adicional
- [ ] 7.5. Verificar que las órdenes guardan correctamente el desglose de IVA
- [ ] 7.6. Probar reporte de IVA en admin panel
- [ ] 7.7. Verificar que los productos existentes se manejan correctamente (migration data)
- [ ] 7.8. Probar con diferentes combinaciones de productos en el carrito

### Fase 8: Migration de Datos Existentes (1-2 horas)
- [ ] 8.1. Crear script de migración para productos existentes
- [ ] 8.2. Asignar `vatType = GENERAL` por defecto a productos existentes
- [ ] 8.3. Calcular `basePrice` y `vatAmount` para productos existentes
- [ ] 8.4. Actualizar órdenes existentes (opcional, solo si es necesario)
- [ ] 8.5. Backup de base de datos antes de migración
- [ ] 8.6. Ejecutar migración en desarrollo
- [ ] 8.7. Verificar integridad de datos después de migración

### Fase 9: Documentación (1 hora)
- [ ] 9.1. Actualizar `CLAUDE.md` con información de IVA
- [ ] 9.2. Documentar tipos de IVA y ejemplos
- [ ] 9.3. Documentar endpoints nuevos en Swagger
- [ ] 9.4. Crear guía para vendedores sobre qué IVA usar
- [ ] 9.5. Actualizar README con cambios

## ⚠️ Consideraciones Importantes

### 1. Migración de Datos Existentes
Todos los productos actuales necesitan ser actualizados con:
- `vatType`: Asignar `GENERAL` (19%) por defecto
- `basePrice`: Calcular retroactivamente asumiendo que el precio actual incluye 19% IVA
- `vatAmount`: Calcular basado en `basePrice`

**Script de migración sugerido**:
```sql
-- Assuming all existing products have 19% VAT
UPDATE products
SET
  vat_type = 'general',
  base_price = price / 1.19,
  vat_amount = price - (price / 1.19)
WHERE vat_type IS NULL;
```

### 2. Compatibilidad con Órdenes Antiguas
Las órdenes creadas antes de este cambio NO tendrán `vatBreakdown`. Esto es aceptable, pero considera:
- Agregar validación en reportes para manejar órdenes sin desglose
- Considerar un script de backfill si se necesitan datos históricos precisos

### 3. Validaciones a Implementar
- [ ] Validar que `vatType` es uno de los 4 valores permitidos
- [ ] Validar que `price > 0`
- [ ] Recalcular automáticamente `basePrice` y `vatAmount` cuando cambie `price` o `vatType`
- [ ] No permitir editar `basePrice` o `vatAmount` manualmente (solo lectura)

### 4. Testing de Casos Edge
- [ ] Producto con precio 0 (productos gratis, muestras)
- [ ] Cambio de `vatType` de un producto existente con órdenes previas
- [ ] Carrito con mezcla de productos de diferentes tipos de IVA
- [ ] Aplicación de cupones sobre productos con diferentes IVA

## 📊 Impacto Estimado

| Área | Archivos Modificados | Complejidad | Tiempo Estimado |
|------|---------------------|-------------|-----------------|
| **Backend Entities** | 3 archivos | Media | 2-3 horas |
| **Backend Services** | 4 archivos | Alta | 3-4 horas |
| **Backend DTOs/Controllers** | 5 archivos | Baja | 1-2 horas |
| **Mobile App** | 6 archivos | Media | 2-3 horas |
| **Seller Panel** | 4 archivos | Media | 2-3 horas |
| **Admin Panel** | 3 archivos | Media | 3-4 horas |
| **Testing & QA** | - | Alta | 2-3 horas |
| **Migration & Docs** | 2 archivos | Baja | 2-3 horas |
| **TOTAL** | **27 archivos** | - | **17-25 horas** |

## 🚀 Orden de Implementación Recomendado

1. **Backend Database** (Entities + Migration) → Sin esto, nada más funciona
2. **Backend Services** (Products, Cart, Orders) → Lógica de negocio
3. **Backend DTOs & Controllers** → API endpoints
4. **Migration de Datos** → Actualizar productos existentes
5. **Seller Panel** → Para que vendedores puedan crear productos con IVA correcto
6. **Mobile App** → Para que usuarios vean precios correctos
7. **Admin Panel** → Para reportes fiscales
8. **Testing & Documentation** → Validar todo funciona

## 📋 Comandos Útiles

```bash
# 1. Generate migration
cd backend
npm run migration:generate -- -n AddVatFieldsToProducts

# 2. Run migration
npm run migration:run

# 3. Revert migration (if needed)
npm run migration:revert

# 4. Check migration status
npm run migration:show

# 5. Verify changes in development
npm run start:dev

# 6. Test with curl
curl -X GET "http://localhost:3000/api/v1/products" | jq

# 7. Database backup before migration
pg_dump -U gshop_user -d gshop_db > backup_pre_vat_migration.sql
```

## 📞 Soporte

Si tienes dudas durante la implementación:
1. Revisar este plan paso a paso
2. Verificar documentación oficial de DIAN sobre IVA en Colombia
3. Consultar ejemplos de cálculo en este documento

---

**Fecha de Creación**: 2025-10-30
**Versión**: 1.0
**Estado**: Pendiente de Implementación
