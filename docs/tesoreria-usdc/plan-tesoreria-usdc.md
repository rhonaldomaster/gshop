# PRD – Pagos Locales + Tesorería en USDC

## 1. Contexto

La empresa (US-based) opera una aplicación móvil desarrollada en React Native con backend en NestJS. La app vende productos/servicios a usuarios en Colombia, quienes pagan en COP mediante medios locales (tarjeta, PSE, Nequi, etc).

El objetivo es utilizar **USDC como tesorería interna**, sin exponer cripto al usuario final.

---

## 2. Objetivos del Producto

### Objetivo principal

- Permitir pagos locales en Colombia
- Acreditar saldo interno por usuario
- Respaldar el 100% del saldo en USDC

### No objetivos (fuera de alcance MVP)

- Wallets cripto para usuarios
- Transferencias on-chain por usuario
- Cash-out a usuarios
- Stablecoin pública propia

---

## 3. Arquitectura General

```
[ React Native App ]
        |
        v
[ PSP Checkout (WebView/SDK) ]
        |
        v
[ PSP Webhooks ] ---> [ NestJS Backend ]
                            |
                            v
                    [ Ledger Interno ]
                            |
                            v
                    [ Treasury Service ]
                            |
                            v
                [ USDC Custody (Circle/Coinbase) ]
```

---

## 4. Stack Tecnológico

### Frontend

- React Native
- Checkout vía WebView o SDK PSP

### Backend

- NestJS
- PostgreSQL
- Redis (idempotencia y eventos)

### Pagos

- PSP recomendado: **dLocal**

### Stablecoin

- USDC
- Conversión: Circle APIs
- Custodia: Circle Custody o Coinbase Prime

---

## 5. Flujos Funcionales

### 5.1 Flujo de Pago

1. Usuario inicia pago
2. App crea `payment_intent` en backend
3. Backend crea sesión en PSP
4. Usuario paga en WebView
5. PSP envía webhook
6. Backend valida evento
7. Ledger acredita saldo

---

### 5.2 Flujo de Uso de Saldo

1. Usuario compra producto
2. Backend valida saldo
3. Se registra débito en ledger
4. Saldo actualizado

---

## 6. Diseño del Ledger (Resumen)

Principios:

- Inmutable
- Event-based
- Auditabilidad total

Entidades clave:

- users
- accounts
- ledger_entries
- payments
- conversions

---

## 7. Treasury & Conversión a USDC

### Estrategia

- Conversión por batch (diaria o intradía)
- Registro de tasa de cambio
- Conciliación diaria

---

## 8. Webhooks

### PSP Webhooks

- payment.success
- payment.failed
- payment.refunded

### Conversión Webhooks

- conversion.completed
- conversion.failed

Todos los webhooks deben ser:

- Idempotentes
- Firmados

---

## 9. Seguridad & Compliance

- KYC manejado por PSP
- Custodia institucional
- Sin exposición de claves privadas

---

## 10. Métricas Clave

- Pagos exitosos vs fallidos
- Tiempo de acreditación
- Diferencias ledger vs custodia

---

## 11. Riesgos

- Latencia en confirmación de pagos
- Reconciliación incompleta
- Riesgo regulatorio si se habilita retiro

---

## 12. Roadmap

### MVP

- Pagos
- Ledger
- Tesorería USDC

### Fase 2

- Tarjetas físicas
- Cash-out controlado
- Reportes financieros avanzados

---

## 13. Apéndices

- Diagramas detallados
- Esquemas de DB: `plan-db-schema.md`
- Contratos de Webhooks: `webhooks-dto.md`
