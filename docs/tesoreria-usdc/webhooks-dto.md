# Webhooks y DTOs – PSP + Conversión USDC

Este documento define **contratos de eventos**, **DTOs** y **reglas de idempotencia** para NestJS.

---

## 1. Principios

- Todos los webhooks son **idempotentes**
- Siempre se guarda el evento crudo
- Validación de firma obligatoria
- Nunca confiar en el frontend

---

## 2. Webhooks del PSP (Pagos)

### 2.1 Eventos soportados

| Evento            | Descripción     |
| ----------------- | --------------- |
| payment.created   | Pago iniciado   |
| payment.succeeded | Pago confirmado |
| payment.failed    | Pago fallido    |
| payment.refunded  | Pago revertido  |

---

### 2.2 Payload base (ejemplo)

```json
{
  "event_id": "evt_123",
  "event_type": "payment.succeeded",
  "created_at": "2025-01-01T10:00:00Z",
  "data": {
    "payment_id": "pay_456",
    "user_reference": "user_uuid",
    "amount": 50000,
    "currency": "COP",
    "status": "succeeded"
  }
}
```

---

### 2.3 DTO – PSPWebhookDto

```ts
export class PSPWebhookDto {
  event_id: string;
  event_type: 'payment.created' | 'payment.succeeded' | 'payment.failed' | 'payment.refunded';
  created_at: string;
  data: {
    payment_id: string;
    user_reference: string;
    amount: number;
    currency: string;
    status: string;
  };
}
```

---

## 3. Procesamiento del Webhook (NestJS)

### Flujo

1. Verificar firma
2. Guardar en `webhook_events`
3. Si existe → ignorar
4. Procesar según `event_type`

---

## 4. Impacto en el Ledger

### payment.succeeded

- Crear `payments` (status = succeeded)
- Crear `ledger_entry` (credit)

### payment.refunded

- Crear `ledger_entry` (debit)

---

## 5. Webhooks de Conversión (Circle)

### Eventos

- conversion.completed
- conversion.failed

---

### Payload ejemplo

```json
{
  "id": "conv_evt_789",
  "type": "conversion.completed",
  "data": {
    "conversion_id": "conv_001",
    "source_amount": 1000,
    "target_amount": 1000,
    "rate": 1.0
  }
}
```

---

### DTO – ConversionWebhookDto

```ts
export class ConversionWebhookDto {
  id: string;
  type: 'conversion.completed' | 'conversion.failed';
  data: {
    conversion_id: string;
    source_amount: number;
    target_amount: number;
    rate: number;
  };
}
```

---

## 6. Errores y Reintentos

- PSP reintenta si no recibe 200
- Backend debe ser tolerante a duplicados
- Nunca lanzar excepción no controlada

---

## 7. Seguridad

- Validación HMAC o firma del proveedor
- IP allowlist si es posible
- Logs estructurados

---

## 8. Testing

- Tests de idempotencia
- Tests de eventos duplicados
- Tests de orden incorrecto
