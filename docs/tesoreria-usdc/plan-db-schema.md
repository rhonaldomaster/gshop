# Esquema de Base de Datos – Ledger y Pagos

Este esquema implementa un **ledger inmutable y auditable**, desacoplado de pagos y tesorería, diseñado para NestJS + PostgreSQL.

---

## 1. Principios de Diseño

- **No se actualizan saldos directamente**
- Todo movimiento es un evento (`ledger_entries`)
- Saldos se calculan por agregación
- Idempotencia a nivel de pagos y webhooks
- Soporte multi-moneda (COP, USD, USDC)

---

## 2. users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 3. accounts

Cada usuario puede tener una o más cuentas lógicas.

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('user', 'system')),
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, currency)
);
```

---

## 4. ledger_entries (CORE)

```sql
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id),
  amount NUMERIC(20,8) NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  currency TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ledger_account ON ledger_entries(account_id);
CREATE INDEX idx_ledger_source ON ledger_entries(source_type, source_id);
```

**Regla:**

- `credit` = suma
- `debit` = resta

---

## 5. payments

Representa pagos del PSP.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider TEXT NOT NULL,
  provider_payment_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','succeeded','failed','refunded')),
  amount NUMERIC(20,8) NOT NULL,
  currency TEXT NOT NULL,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_payment_id)
);
```

---

## 6. conversions

Conversión fiat → USDC.

```sql
CREATE TABLE conversions (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL,
  source_amount NUMERIC(20,8) NOT NULL,
  source_currency TEXT NOT NULL,
  target_amount NUMERIC(20,8),
  target_currency TEXT NOT NULL DEFAULT 'USDC',
  rate NUMERIC(20,8),
  status TEXT NOT NULL CHECK (status IN ('pending','completed','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 7. webhook_events

Para idempotencia y auditoría.

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);
```

---

## 8. Derivación de Saldo (Query ejemplo)

```sql
SELECT
  account_id,
  SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END) AS balance
FROM ledger_entries
WHERE currency = 'COP'
GROUP BY account_id;
```

---

## 9. Reglas de Integridad

- Todo `payment.succeeded` genera un `ledger_entry`
- Todo `refund` genera un `ledger_entry` inverso
- Ninguna tabla actualiza saldo directamente

---

## 10. Extensiones Futuras

- cards
- physical_transactions
- settlement_batches

## 11. Documentos de referencia
- `backend-architecture.md`
- `ledger-queries.md`
- `api-contracts.md`