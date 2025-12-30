# Ledger Queries y Concurrencia

Este documento define las **queries críticas**, estrategias de **locking** y ejemplos de uso desde NestJS para operar el ledger de forma segura.

---

## 1. Cálculo de Saldo (Read)

### Query base por cuenta

```sql
SELECT
  COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0) AS balance
FROM ledger_entries
WHERE account_id = $1
  AND currency = $2;
```

Uso:

- Mostrar saldo
- Validar fondos antes de débito

---

## 2. Cálculo de Saldo con Lock (FOR UPDATE)

Se usa cuando **se va a debitar**.

```sql
SELECT id
FROM accounts
WHERE id = $1
FOR UPDATE;
```

Luego, dentro de la MISMA transacción:

- recalcular saldo
- validar
- insertar `ledger_entry`

---

## 3. Débito Seguro (Transacción)

### Flujo recomendado

1. BEGIN
2. Lock de account
3. Calcular saldo
4. Validar
5. Insertar debit
6. COMMIT

---

### Ejemplo SQL

```sql
BEGIN;

SELECT id FROM accounts WHERE id = $1 FOR UPDATE;

SELECT COALESCE(SUM(CASE WHEN direction='credit' THEN amount ELSE -amount END),0)
FROM ledger_entries
WHERE account_id = $1 AND currency = 'COP';

-- Si balance >= amount
INSERT INTO ledger_entries (
  id, account_id, amount, direction, currency, source_type, source_id
) VALUES (
  gen_random_uuid(), $1, $2, 'debit', 'COP', 'purchase', $3
);

COMMIT;
```

---

## 4. Crédito Seguro (Webhook)

### Regla

- No requiere lock previo del saldo
- El lock lo da la idempotencia del webhook

```sql
INSERT INTO ledger_entries (
  id, account_id, amount, direction, currency, source_type, source_id
) VALUES (...);
```

---

## 5. Idempotencia en Pagos

Antes de crear ledger:

```sql
SELECT 1 FROM ledger_entries
WHERE source_type = 'payment'
  AND source_id = $1;
```

Si existe → no insertar.

---

## 6. Reversos / Refunds

Nunca borrar.

```sql
INSERT INTO ledger_entries (..., 'debit', ...);
```

---

## 7. Manejo de Concurrencia

### Estrategia elegida

- Pessimistic locking (FOR UPDATE)
- Aislamiento READ COMMITTED

Evita:

- double spend
- race conditions

---

## 8. Ejemplo en NestJS (TypeORM)

```ts
await this.dataSource.transaction(async (manager) => {
  await manager.query(`SELECT id FROM accounts WHERE id = $1 FOR UPDATE`, [accountId]);

  const [{ balance }] = await manager.query(balanceQuery, [accountId, 'COP']);

  if (balance < amount) throw new Error('INSUFFICIENT_FUNDS');

  await manager.insert(LedgerEntry, {
    accountId,
    amount,
    direction: 'debit',
    currency: 'COP',
    sourceType: 'purchase',
    sourceId: purchaseId
  });
});
```

---

## 9. Reconciliación

Saldo interno vs custodia:

```sql
SELECT currency, SUM(CASE WHEN direction='credit' THEN amount ELSE -amount END)
FROM ledger_entries
GROUP BY currency;
```

Comparar contra balances de Circle / Coinbase.

---

## 10. Errores Comunes a Evitar

- UPDATE accounts SET balance = ...
- Calcular saldo en memoria
- No usar transacciones
- No lockear antes de debitar
