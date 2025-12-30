# API Contracts – Flujo End‑to‑End de Compra con Saldo

Este documento define el **flujo completo de compra**, contratos HTTP, estados y errores entre **React Native** y **NestJS**.

---

## 1. Objetivo del Flujo

Permitir que un usuario:

- compre un producto
- usando su saldo interno
- de forma segura y consistente

Sin exponer pagos ni cripto al cliente.

---

## 2. Precondiciones

- Usuario autenticado
- Usuario tiene `account` en moneda local (COP)
- Saldo calculable vía ledger

---

## 3. Endpoints

### 3.1 Obtener Saldo

**GET** `/v1/balance`

**Response 200**

```json
{
  "currency": "COP",
  "balance": 75000
}
```

---

### 3.2 Crear Intento de Compra

**POST** `/v1/purchases`

**Request**

```json
{
  "product_id": "prod_123",
  "amount": 25000,
  "currency": "COP"
}
```

---

## 4. Flujo Interno del Backend

1. Validar request
2. Resolver `account_id`
3. BEGIN TRANSACTION
4. Lock account (`FOR UPDATE`)
5. Calcular saldo
6. Validar fondos
7. Insertar `ledger_entry` (debit)
8. Registrar `purchase`
9. COMMIT

---

## 5. Respuestas

### 5.1 Compra exitosa

**Response 201**

```json
{
  "purchase_id": "pur_789",
  "status": "completed",
  "remaining_balance": 50000
}
```

---

### 5.2 Fondos insuficientes

**Response 409**

```json
{
  "error": "INSUFFICIENT_FUNDS",
  "message": "Saldo insuficiente"
}
```

---

### 5.3 Error de concurrencia

**Response 409**

```json
{
  "error": "CONCURRENT_MODIFICATION",
  "message": "Intente nuevamente"
}
```

---

## 6. UX Esperado (React Native)

### Estados

- loading
- success
- insufficient_funds
- retry

### Reglas

- No reintentar automáticamente débitos
- Mostrar saldo actualizado tras éxito

---

## 7. Idempotencia

**Header:** `Idempotency-Key`

- UUID generado en el cliente
- Backend rechaza duplicados

---

## 8. Errores No Recuperables

- 401 Unauthorized
- 403 Forbidden
- 500 Internal Error

---

## 9. Observabilidad

- Log por `purchase_id`
- Métricas de latencia
- Alertas por errores 409

---

## 10. Checklist de Implementación

- [ ] Middleware auth
- [ ] Transaction wrapper
- [ ] LedgerService
- [ ] PurchasesService
- [ ] Tests de concurrencia
