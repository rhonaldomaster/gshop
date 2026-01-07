# Plan de Implementacion: Sistema de Saldo y Transferencias P2P - GSHOP

---

## PROGRESO DE IMPLEMENTACION

| Fase | Descripcion | Estado | Fecha | Commit |
|------|-------------|--------|-------|--------|
| 1 | Entidades KYC y Limites (migraciones) | COMPLETADO | 2026-01-07 | `feature/balance-transfer` |
| 2 | Backend API de transferencias con fee 0.2% | COMPLETADO | 2026-01-07 | `feature/balance-transfer` |
| 3 | Backend Topup con Stripe | COMPLETADO | 2026-01-07 | `3014797` |
| 4 | Backend Pago con Saldo | COMPLETADO | 2026-01-07 | `73fd878` |
| 5 | Mobile TransferScreen UI | COMPLETADO | 2026-01-07 | `feature/balance-transfer` |
| 6 | Mobile TopUp con Stripe SDK | COMPLETADO | 2026-01-07 | `feature/balance-transfer` |
| 7 | Mobile Checkout con saldo | COMPLETADO | 2026-01-07 | `feature/balance-transfer` |
| 8 | Admin Panel verificaciones KYC | PENDIENTE | - | - |

### Resumen de lo implementado (Backend):

**Fase 1 - KYC y Limites:**
- Entidad `UserVerification` en `src/token/entities/user-verification.entity.ts`
- Entidad `TransferLimit` en `src/token/entities/transfer-limit.entity.ts`
- Constantes de limites en `src/token/constants/transfer-limits.ts`
- Migracion ejecutada

**Fase 2 - API Transferencias P2P:**
- `GET /api/v1/tokens/search-user` - Buscar usuario por email/telefono
- `GET /api/v1/tokens/transfer-limits` - Obtener limites del usuario
- `POST /api/v1/tokens/transfer/preview` - Preview con desglose de fee
- `POST /api/v1/tokens/transfer/execute` - Ejecutar transferencia con fee 0.2%

**Fase 3 - Stripe Topup:**
- `POST /api/v1/tokens/topup/stripe-intent` - Crear PaymentIntent de Stripe
- `GET /api/v1/tokens/topup/:id/status` - Consultar estado de recarga
- Webhook handlers en `payments-v2.controller.ts` para success/failure
- Conversion COP a USD automatica via `CurrencyService`

**Fase 4 - Pago con Saldo:**
- `POST /api/v1/payments-v2/:id/process/wallet` - Pagar orden con saldo
- `GET /api/v1/payments-v2/:id/can-pay-with-wallet` - Verificar si puede pagar
- Metodos `payOrderWithWallet()` y `checkSufficientBalance()` en TokenService

**Fase 5 - Mobile TransferScreen UI:**
- `mobile/src/services/transfer.service.ts` - Servicio con llamadas API de transfers
- `mobile/src/screens/wallet/TransferScreen.tsx` - Pantalla principal con flujo multi-paso
- `mobile/src/components/wallet/RecipientSearchInput.tsx` - Input de busqueda de destinatario
- `mobile/src/components/wallet/RecipientCard.tsx` - Tarjeta de confirmacion de destinatario
- `mobile/src/components/wallet/TransferAmountInput.tsx` - Input de monto con montos rapidos
- `mobile/src/components/wallet/TransferPreview.tsx` - Preview con desglose de fee 0.2%
- `mobile/src/components/wallet/TransferSuccess.tsx` - Pantalla de exito
- Navegacion actualizada en ProfileNavigator
- WalletScreen actualizado para navegar a TransferScreen
- Traducciones i18n agregadas en es.json

**Fase 6 - Mobile TopUp con Stripe SDK:**
- `mobile/src/services/payments.service.ts` - Nuevos metodos:
  - `createStripeTopupIntent(amountCOP)` - Crea PaymentIntent en backend
  - `getTopupStatus(topupId)` - Consulta estado de recarga
  - `pollTopupStatus(topupId)` - Polling hasta completado/fallido
  - Interfaces `StripeTopupIntentResponse` y `TopupStatusResponse`
- `mobile/src/screens/wallet/WalletScreen.tsx` - TopupModal actualizado:
  - Integracion con Stripe SDK usando `useStripe()` hook
  - `initPaymentSheet()` y `presentPaymentSheet()` para pago nativo
  - Flujo multi-paso: amount -> processing -> success/error
  - Montos en COP (pesos colombianos) con Quick Amounts
  - Polling automatico post-pago para confirmar acreditacion
  - UI mejorada con indicadores de estado y errores
- `mobile/src/providers/StripeProvider.tsx` - Ya existia, envuelve la app
- `mobile/App.tsx` - StripeProvider ya integrado

**Fase 7 - Mobile Checkout con Saldo:**
- `mobile/src/services/payments.service.ts` - Nuevos metodos:
  - `checkCanPayWithWallet(paymentId)` - Verifica si puede pagar con wallet
  - `processWalletPayment(paymentId)` - Procesa pago con saldo
  - Tipo `wallet` agregado a PaymentMethod interface
- `mobile/src/components/checkout/PaymentMethodSelection.tsx` - Actualizado:
  - Opcion de "Saldo GSHOP" como metodo de pago
  - Muestra saldo disponible del usuario
  - Badge "Recomendado" si tiene saldo suficiente
  - Mensaje "Saldo insuficiente" con faltante si no tiene saldo
  - Divider "O paga con" para separar wallet de otros metodos
- `mobile/src/screens/checkout/CheckoutScreen.tsx` - Actualizado:
  - Flujo de pago con wallet integrado en handlePlaceOrder
  - Procesa pago directamente sin redireccion externa
  - Mensaje de exito con nuevo saldo tras pagar
- `mobile/src/i18n/locales/es.json` - Traducciones agregadas:
  - `checkout.payment.providers.wallet.*` - Nombre, descripcion, recomendado, insuficiente
  - `checkout.alerts.walletPaymentSuccess` - Mensaje de exito
  - `checkout.alerts.walletPaymentFailed` - Mensaje de error

### Para continuar implementacion:

```bash
# Cambiar a la rama de desarrollo
git checkout feature/balance-transfer

# Ver commits de esta feature
git log --oneline

# Continuar con Fase 5 (Mobile TransferScreen)
```

---

## Resumen Ejecutivo

Implementar un sistema completo de wallet donde los usuarios puedan:
1. **Recargar saldo** a su cuenta via Stripe
2. **Transferir saldo** a otros usuarios (P2P)
3. **Pagar compras** dentro de la app usando el saldo

### Estado Actual

**Ya existe (Backend):**
- `GshopWallet` entity con balance, lockedBalance, totalEarned, totalSpent
- `GshopTransaction` con tipos TRANSFER_IN, TRANSFER_OUT, TOPUP
- `TokenService.transferTokens()` - Logica basica de transferencia
- `TokenService.createTopup()` y `processTopup()` - Sistema de recargas

**Ya existe (Mobile):**
- `WalletScreen.tsx` con UI de saldo y TopupModal
- Boton "Send" como placeholder (sin implementar)
- Servicio de payments con tipos de transaccion

---

## Arquitectura de la Solucion

### Flujo de Recarga (Top-up)
```
Usuario → Selecciona monto → Stripe Payment Intent → Webhook confirma → Acredita wallet
```

### Flujo de Transferencia P2P (Modelo Option A - Fee Separado)
```
Usuario → Busca destinatario (email/tel) → Confirma nombre →
Valida limites KYC → Ejecuta transfer (2 transacciones):

  1. TRANSFER_IN: Receptor recibe monto COMPLETO ($100,000)
  2. PLATFORM_FEE: Se descuenta 0.2% del receptor ($200)

  Resultado: Receptor tiene $99,800 en su wallet
```

**Importante:** El fee se cobra como transaccion SEPARADA despues de recibir el monto completo.
Esto permite:
- Transparencia total en el historial de transacciones
- El receptor ve exactamente cuanto le enviaron
- El fee aparece como cargo separado "Comision de servicio GSHOP"

### Flujo de Pago con Saldo
```
Checkout → Selecciona "Pagar con Saldo" → Valida balance → Debita wallet → Confirma orden
```

---

## Fase 1: Sistema de Verificacion KYC y Limites

### 1.1 Nueva Entidad: `UserVerification`

**Archivo:** `backend/src/users/entities/user-verification.entity.ts`

```typescript
// Niveles de verificacion
enum VerificationLevel {
  NONE = 'none',           // Sin verificar: $1.2M/dia, $4M/mes
  LEVEL_1 = 'level_1',     // Nombre+Doc+Selfie: $8M/dia, $40M/mes
  LEVEL_2 = 'level_2',     // +Direccion+Fuente: $40M/dia, $200M/mes
}

// Campos necesarios:
- userId (FK)
- level: VerificationLevel
- fullLegalName: string
- documentType: 'CC' | 'CE' | 'PA' | 'TI'
- documentNumber: string
- documentFrontUrl: string (S3/R2)
- documentBackUrl: string (S3/R2)
- selfieUrl: string
- selfieVerified: boolean
- address: string (Level 2)
- city: string (Level 2)
- sourceOfFunds: string (Level 2)
- verificationStatus: 'pending' | 'approved' | 'rejected'
- rejectionReason: string
- verifiedAt: Date
- verifiedBy: string (admin userId)
```

### 1.2 Nueva Entidad: `TransferLimit`

**Archivo:** `backend/src/token/entities/transfer-limit.entity.ts`

```typescript
// Tracking de limites por usuario
- userId (FK)
- dailyTransferred: number
- monthlyTransferred: number
- dailyLimit: number (calculado por nivel KYC)
- monthlyLimit: number (calculado por nivel KYC)
- lastDailyReset: Date
- lastMonthlyReset: Date
```

### 1.3 Constantes de Limites

**Archivo:** `backend/src/token/constants/transfer-limits.ts`

```typescript
export const TRANSFER_LIMITS = {
  NONE: {
    minPerTransaction: 100,        // $100 COP
    maxPerTransaction: 1_000_000,  // $1M COP
    dailyLimit: 1_200_000,         // $1.2M COP
    monthlyLimit: 4_000_000,       // $4M COP
  },
  LEVEL_1: {
    minPerTransaction: 100,
    maxPerTransaction: 5_000_000,  // $5M COP
    dailyLimit: 8_000_000,         // $8M COP
    monthlyLimit: 40_000_000,      // $40M COP
  },
  LEVEL_2: {
    minPerTransaction: 100,
    maxPerTransaction: 20_000_000, // $20M COP
    dailyLimit: 40_000_000,        // $40M COP
    monthlyLimit: 200_000_000,     // $200M COP
  },
};

export const PLATFORM_FEE_RATE = 0.002; // 0.2% al receptor
```

---

## Modelo de Fee: Option A (Fee Separado)

### Como funciona el cobro del 0.2%

**El receptor recibe el monto COMPLETO primero, y luego se le descuenta el fee como transaccion separada.**

#### Ejemplo: Ana envia $100,000 COP a Juan

| Paso | Transaccion | Monto | Balance Ana | Balance Juan |
|------|-------------|-------|-------------|--------------|
| 0 | Estado inicial | - | $500,000 | $200,000 |
| 1 | TRANSFER_OUT (Ana) | -$100,000 | $400,000 | $200,000 |
| 2 | TRANSFER_IN (Juan) | +$100,000 | $400,000 | $300,000 |
| 3 | PLATFORM_FEE (Juan) | -$200 | $400,000 | $299,800 |

#### Historial de Juan (receptor):
```
Recibiste $100,000 de Ana          +$100,000
Comision de servicio GSHOP            -$200
```

#### Beneficios de Option A:
1. **Transparencia**: Juan ve exactamente cuanto le enviaron
2. **Auditoria**: Cada cobro tiene su propia transaccion rastreable
3. **Claridad**: El fee se muestra como cargo separado, no oculto
4. **Legal**: Cumple con requisitos de transparencia en comisiones

#### Nota sobre transferencias minimas:
- Min transfer: $100 COP
- Fee en $100: $0.20 COP (se redondea a $0)
- Fee en $1,000: $2 COP
- Fee en $100,000: $200 COP

---

## Fase 2: Backend - API de Transferencias

### 2.1 Actualizar TokenService

**Archivo:** `backend/src/token/token.service.ts`

Nuevos metodos:
- `searchUserByEmailOrPhone(query: string)` - Buscar destinatario
- `validateTransferLimits(userId, amount)` - Validar KYC y limites
- `executeTransferWithFee(from, to, amount)` - Ejecuta transfer con modelo Option A:
  ```typescript
  // Paso 1: Debitar al remitente
  await this.createTransaction(from, -amount, 'TRANSFER_OUT', { toUserId: to });

  // Paso 2: Acreditar monto COMPLETO al receptor
  await this.createTransaction(to, +amount, 'TRANSFER_IN', { fromUserId: from });

  // Paso 3: Cobrar fee al receptor (transaccion separada)
  const fee = amount * 0.002; // 0.2%
  await this.createTransaction(to, -fee, 'PLATFORM_FEE', {
    relatedTransferId: transferId,
    description: 'Comision de servicio GSHOP'
  });
  ```
- `getUserTransferLimits(userId)` - Obtener limites actuales
- `resetDailyLimits()` - Cron job para reset diario
- `resetMonthlyLimits()` - Cron job para reset mensual

### 2.2 Nuevo Controller Endpoints

**Archivo:** `backend/src/token/token.controller.ts`

```typescript
// Buscar usuario para transferir
GET /api/v1/tokens/search-user?query=email@ejemplo.com
Response: { userId, firstName, lastName, maskedEmail }

// Obtener limites del usuario actual
GET /api/v1/tokens/transfer-limits
Response: { level, dailyRemaining, monthlyRemaining, maxPerTransaction }

// Ejecutar transferencia (Option A - Fee Separado)
POST /api/v1/tokens/transfer
Body: { toUserId, amount, note? }
Response: {
  success: true,
  transferId: "uuid",
  transactions: [
    { type: "TRANSFER_OUT", amount: -100000, userId: "sender" },
    { type: "TRANSFER_IN", amount: +100000, userId: "receiver" },
    { type: "PLATFORM_FEE", amount: -200, userId: "receiver" }
  ],
  summary: {
    amountSent: 100000,
    feeCharged: 200,
    recipientNetBalance: 99800
  }
}

// Preview de transferencia (mostrar desglose)
POST /api/v1/tokens/transfer/preview
Body: { toUserId, amount }
Response: {
  amountToSend: 100000,          // Lo que sale del remitente
  amountReceived: 100000,        // Lo que recibe (completo)
  platformFee: 200,              // Fee que se le cobra despues
  recipientNetAmount: 99800,     // Lo que le queda al receptor
  feePercentage: "0.2%"
}
```

### 2.3 DTOs Nuevos

**Archivo:** `backend/src/token/dto/transfer.dto.ts`

```typescript
class SearchUserDto {
  query: string; // email o telefono
}

class TransferDto {
  toUserId: string;
  amount: number;
  note?: string;
}

class TransferPreviewDto {
  toUserId: string;
  amount: number;
}
```

---

## Fase 3: Backend - Recarga con Stripe

### 3.1 Integrar Stripe con Wallet Topup

**Archivo:** `backend/src/token/token.service.ts`

Nuevo metodo:
```typescript
async createStripeTopupIntent(userId: string, amountCOP: number) {
  // 1. Crear WalletTopup con status PENDING
  // 2. Crear Stripe PaymentIntent
  // 3. Retornar clientSecret para el mobile
}
```

### 3.2 Webhook Handler para Topup

**Archivo:** `backend/src/payments/payments-v2.controller.ts`

Agregar case en webhook:
```typescript
case 'payment_intent.succeeded':
  // Si tiene metadata.topupId → processTopup(topupId, COMPLETED)
```

### 3.3 Registrar Fees de Stripe

Guardar en metadata de la transaccion:
- stripe_fee_amount
- stripe_fee_currency
- exchange_rate (si aplica COP→USD)

---

## Fase 4: Backend - Pago con Saldo

### 4.1 Actualizar OrdersService

**Archivo:** `backend/src/orders/orders.service.ts`

Nuevo metodo:
```typescript
async payWithWalletBalance(orderId: string, userId: string) {
  // 1. Obtener orden y total
  // 2. Validar balance suficiente
  // 3. Debitar wallet (TokenService.updateWalletBalance)
  // 4. Marcar orden como PAID
  // 5. Crear transaccion tipo PURCHASE
}
```

### 4.2 Endpoint de Pago

**Archivo:** `backend/src/payments/payments-v2.controller.ts`

```typescript
POST /api/v1/payments-v2/:id/process/wallet
Response: { success, orderId, newBalance }
```

---

## Fase 5: Mobile - Pantalla de Transferencia

### 5.1 Nueva Pantalla: TransferScreen

**Archivo:** `mobile/src/screens/wallet/TransferScreen.tsx`

UI Steps:
1. **Buscar destinatario:** Input para email/telefono + boton buscar
2. **Confirmar destinatario:** Mostrar nombre completo para confirmar
3. **Ingresar monto:** Input numerico con validacion de limites
4. **Preview (Option A):** Mostrar desglose claro:
   ```
   +-----------------------------------------+
   |  Resumen de Transferencia               |
   +-----------------------------------------+
   |  Envias:           $100,000 COP         |
   |  Juan recibe:      $100,000 COP         |
   |  Comision GSHOP:      -$200 COP         |
   |  ---------------------------------------  |
   |  Juan tendra:       $99,800 COP         |
   +-----------------------------------------+
   ```
5. **Confirmar:** Boton de confirmacion + PIN/biometrico?
6. **Resultado:** Pantalla de exito mostrando las 2 transacciones

### 5.2 Componentes Nuevos

- `RecipientSearchInput.tsx` - Input con busqueda y autocomplete
- `RecipientCard.tsx` - Muestra info del destinatario confirmado
- `TransferAmountInput.tsx` - Input de monto con formato COP
- `TransferPreview.tsx` - Preview con breakdown de fees
- `TransferConfirmation.tsx` - Modal de confirmacion final
- `TransferSuccess.tsx` - Pantalla de exito

### 5.3 Actualizar WalletScreen

**Archivo:** `mobile/src/screens/wallet/WalletScreen.tsx`

- Cambiar `handleSend()` de alert a navegacion a TransferScreen
- Mostrar limites diarios/mensuales restantes

---

## Fase 6: Mobile - Mejoras al TopUp

### 6.1 Integrar Stripe SDK

**Archivo:** `mobile/src/screens/wallet/WalletScreen.tsx`

Actualizar TopupModal:
1. Llamar a `POST /tokens/topup/stripe-intent` para obtener clientSecret
2. Usar Stripe SDK `confirmPayment()` con el clientSecret
3. Mostrar loading mientras se procesa
4. Actualizar balance cuando webhook confirme

### 6.2 Agregar Provider Stripe

Si no existe, crear `mobile/src/providers/StripeProvider.tsx` y envolver la app.

---

## Fase 7: Mobile - Pago con Saldo en Checkout

### 7.1 Actualizar CheckoutScreen

**Archivo:** `mobile/src/screens/checkout/CheckoutScreen.tsx`

- Agregar opcion "Pagar con Saldo GSHOP" en metodos de pago
- Mostrar balance disponible
- Si balance < total, mostrar "Saldo insuficiente" o "Recargar saldo"

### 7.2 Actualizar PaymentMethodSelection

**Archivo:** `mobile/src/components/checkout/PaymentMethodSelection.tsx`

Agregar card de "GSHOP Wallet" con:
- Icono de wallet
- Balance actual
- Estado (suficiente/insuficiente)

---

## Fase 8: Panel Admin - Verificacion KYC

### 8.1 Nueva Pagina: Verificaciones Pendientes

**Archivo:** `admin-web/app/dashboard/verifications/page.tsx`

- Lista de solicitudes de verificacion pendientes
- Filtros: nivel, estado, fecha
- Acciones: Aprobar, Rechazar (con razon)

### 8.2 Detalle de Verificacion

**Archivo:** `admin-web/app/dashboard/verifications/[id]/page.tsx`

- Ver documentos subidos (foto documento, selfie)
- Comparar selfie con foto del documento
- Botones aprobar/rechazar
- Input para razon de rechazo

---

## Fase 9: Migraciones de Base de Datos

### Migraciones necesarias:

1. `CreateUserVerificationTable` - Tabla de verificacion KYC
2. `CreateTransferLimitsTable` - Tabla de tracking de limites
3. `AddFeeFieldsToGshopTransaction` - Campos para fees (platformFee, stripeFee)
4. `AddVerificationLevelToUser` - Campo nivel en User (opcional, redundante)

---

## Archivos a Crear/Modificar

### Backend (Crear):
- `src/users/entities/user-verification.entity.ts`
- `src/token/entities/transfer-limit.entity.ts`
- `src/token/constants/transfer-limits.ts`
- `src/token/dto/transfer.dto.ts`
- `src/token/dto/verification.dto.ts`
- `src/users/verification.service.ts`
- `src/users/verification.controller.ts`
- `src/database/migrations/XXXX-CreateUserVerification.ts`
- `src/database/migrations/XXXX-CreateTransferLimits.ts`
- `src/database/migrations/XXXX-AddFeeFieldsToTransaction.ts`

### Backend (Modificar):
- `src/token/token.service.ts` - Agregar metodos de transfer con fee y limites
- `src/token/token.controller.ts` - Nuevos endpoints
- `src/token/token.module.ts` - Importar nuevas entidades
- `src/payments/payments-v2.controller.ts` - Webhook para topup y pago con wallet
- `src/orders/orders.service.ts` - Pago con saldo

### Mobile (Crear):
- `src/screens/wallet/TransferScreen.tsx`
- `src/components/wallet/RecipientSearchInput.tsx`
- `src/components/wallet/RecipientCard.tsx`
- `src/components/wallet/TransferAmountInput.tsx`
- `src/components/wallet/TransferPreview.tsx`
- `src/components/wallet/TransferSuccess.tsx`
- `src/services/transfer.service.ts`

### Mobile (Modificar):
- `src/screens/wallet/WalletScreen.tsx` - Conectar boton Send
- `src/screens/checkout/CheckoutScreen.tsx` - Opcion pago con saldo
- `src/components/checkout/PaymentMethodSelection.tsx` - Agregar wallet
- `src/navigation/AppNavigator.tsx` - Agregar TransferScreen
- `src/services/payments.service.ts` - Metodos de topup con Stripe

### Admin Panel (Crear):
- `app/dashboard/verifications/page.tsx`
- `app/dashboard/verifications/[id]/page.tsx`
- `components/verifications/VerificationCard.tsx`
- `components/verifications/DocumentViewer.tsx`

---

## Orden de Implementacion Sugerido

1. **Fase 1:** Entidades KYC y Limites (migraciones)
2. **Fase 2:** Backend API de transferencias
3. **Fase 5:** Mobile - TransferScreen (UI)
4. **Fase 3:** Backend - Topup con Stripe
5. **Fase 6:** Mobile - TopUp con Stripe SDK
6. **Fase 4:** Backend - Pago con saldo
7. **Fase 7:** Mobile - Checkout con saldo
8. **Fase 8:** Admin - Panel de verificaciones KYC

---

## Consideraciones de Seguridad

- [ ] Rate limiting en busqueda de usuarios (evitar scraping)
- [ ] PIN o biometrico para confirmar transferencias
- [ ] Notificaciones push al enviar/recibir transferencias
- [ ] Logs de auditoria para todas las transacciones
- [ ] Validacion de documentos (formato, tamano, tipo de archivo)
- [ ] Almacenamiento seguro de documentos KYC (R2/S3 encriptado)

---

## Metricas a Trackear

- Volumen diario/mensual de transferencias
- Fee total recaudado (0.2%)
- Usuarios por nivel de verificacion
- Tasa de conversion de verificacion KYC
- Tiempo promedio de aprobacion KYC
- Recargas exitosas vs fallidas
