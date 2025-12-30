# Arquitectura Backend – NestJS Modules

Este documento define la **estructura de módulos, servicios y responsabilidades** del backend NestJS.

---

## 1. Principios de Arquitectura

- Modularidad estricta
- Un módulo = una responsabilidad
- Servicios sin lógica cruzada
- Event-driven

---

## 2. Estructura de Carpetas

```
src/
 ├── app.module.ts
 ├── config/
 ├── database/
 ├── modules/
 │    ├── users/
 │    ├── payments/
 │    ├── ledger/
 │    ├── treasury/
 │    ├── webhooks/
 │    └── purchases/
 └── jobs/
```

---

## 3. Users Module

Responsabilidad:

- Identidad del usuario
- No maneja dinero

Componentes:

- UsersService
- UsersRepository

---

## 4. Payments Module

Responsabilidad:

- Estado del pago
- Relación con PSP

Componentes:

- PaymentsService
- PaymentsRepository

No calcula saldo.

---

## 5. Ledger Module (CORE)

Responsabilidad:

- Ledger entries
- Cálculo de saldo

Componentes:

- LedgerService
- LedgerRepository

Reglas:

- Inmutable
- Event-based

---

## 6. Treasury Module

Responsabilidad:

- Conversión a USDC
- Custodia

Componentes:

- TreasuryService
- ConversionRepository

No conoce usuarios.

---

## 7. Webhooks Module

Responsabilidad:

- Entrada de eventos externos
- Validación de firma

Componentes:

- WebhookController
- WebhookService

---

## 8. Purchases Module

Responsabilidad:

- Compra con saldo
- Orquestación

Componentes:

- PurchasesService

---

## 9. Jobs

Responsabilidad:

- Batch conversion
- Reconciliación

---

## 10. Flujo entre Módulos

```
Webhook → Payments → Ledger
Purchase → Ledger
Ledger → Treasury (indirecto)
```

---

## 11. Testing Strategy

- Unit tests por módulo
- Ledger tests críticos
- Webhook replay tests
