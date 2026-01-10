# Plan de Implementacion: Clave Dinamica para Transferencias P2P

---

## Resumen Ejecutivo

Implementar un sistema de **clave dinamica** (codigo de verificacion) para las transferencias P2P, similar al que usan las aplicaciones bancarias. Este codigo servira como:

1. **Identificador unico** de cada transferencia
2. **Comprobante visual** para el usuario (emisor y receptor)
3. **Evidencia ante reclamos** de usuarios que afirmen no haber realizado o recibido una transferencia
4. **Registro auditable** con timestamp exacto y codigo unico

---

## Arquitectura de la Solucion

### Formato de la Clave Dinamica

```
GS-XXXXXX
```

**Caracteristicas:**
- Prefijo: `GS-` (GSHOP)
- 6 caracteres alfanumericos (mayusculas + numeros, sin caracteres confusos como 0/O, 1/I/L)
- Caracteres validos: `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (32 caracteres)
- Total combinaciones posibles: 32^6 = 1,073,741,824 (mas de mil millones)
- Facil de leer y comunicar verbalmente
- Formato estilo bancario reconocible

### Ejemplo de Uso

```
╔════════════════════════════════════════╗
║        TRANSFERENCIA EXITOSA           ║
╠════════════════════════════════════════╣
║                                        ║
║         Clave de Transaccion           ║
║          ╔══════════════╗              ║
║          ║  GS-7K3M9P   ║              ║
║          ╚══════════════╝              ║
║                                        ║
║   Monto: $100,000 COP                  ║
║   Para: Juan P***                      ║
║   Fecha: 09 Ene 2026, 14:32:15         ║
║                                        ║
║   Guarda este codigo como comprobante  ║
║                                        ║
╚════════════════════════════════════════╝
```

---

## Cambios en Base de Datos

### 1. Nuevo Campo en `gshop_transactions`

**Archivo a modificar:** `backend/src/token/token.entity.ts`

```typescript
// Agregar a GshopTransaction entity
@Column('varchar', { length: 10, nullable: true, unique: true })
dynamicCode: string;  // Ej: "GS-7K3M9P"

@Column({ type: 'timestamp', nullable: true })
executedAt: Date;  // Momento exacto de ejecucion (diferente a createdAt)
```

### 2. Nueva Migracion

**Archivo:** `backend/src/database/migrations/XXXX-AddDynamicCodeToTransactions.ts`

```sql
ALTER TABLE gshop_transactions
ADD COLUMN dynamic_code VARCHAR(10) UNIQUE,
ADD COLUMN executed_at TIMESTAMP;

CREATE INDEX idx_transactions_dynamic_code ON gshop_transactions(dynamic_code);
```

---

## Cambios en Backend

### 1. Utilidad de Generacion de Codigo

**Nuevo archivo:** `backend/src/token/utils/dynamic-code.generator.ts`

```typescript
// Caracteres permitidos (sin confusos: 0/O, 1/I/L)
const VALID_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateDynamicCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * VALID_CHARS.length);
    code += VALID_CHARS[randomIndex];
  }
  return `GS-${code}`;
}

export async function generateUniqueDynamicCode(
  transactionRepo: Repository<GshopTransaction>
): Promise<string> {
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateDynamicCode();
    const exists = await transactionRepo.findOne({
      where: { dynamicCode: code }
    });
    if (!exists) return code;
    attempts++;
  } while (attempts < maxAttempts);

  // Fallback: agregar timestamp si hay colision
  return `GS-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}
```

### 2. Modificar TokenService

**Archivo:** `backend/src/token/token.service.ts`

**Cambios en `executeTransferWithFee()`:**

```typescript
async executeTransferWithFee(fromUserId, toUserId, amount, note) {
  // ... validaciones existentes ...

  // Generar clave dinamica ANTES de las transacciones
  const dynamicCode = await generateUniqueDynamicCode(this.transactionRepo);
  const executedAt = new Date();

  // Crear transacciones con la clave dinamica
  const transferOut = await this.createTransaction({
    ...existingData,
    dynamicCode,          // Nueva clave
    executedAt,           // Timestamp exacto
    metadata: {
      ...existingMetadata,
      dynamicCode,
      executedAt: executedAt.toISOString(),
    }
  });

  const transferIn = await this.createTransaction({
    ...existingData,
    dynamicCode,          // Misma clave (vincula ambas transacciones)
    executedAt,
    metadata: {
      ...existingMetadata,
      dynamicCode,
      executedAt: executedAt.toISOString(),
    }
  });

  // Platform fee tambien usa el mismo codigo
  if (platformFee > 0) {
    await this.createTransaction({
      ...feeData,
      dynamicCode,
      executedAt,
      metadata: {
        ...feeMetadata,
        relatedTransferCode: dynamicCode,
      }
    });
  }

  return {
    ...existingResponse,
    dynamicCode,
    executedAt: executedAt.toISOString(),
  };
}
```

### 3. Nuevo Endpoint de Busqueda por Codigo

**Archivo:** `backend/src/token/token.controller.ts`

```typescript
@Get('transactions/verify/:code')
@ApiOperation({ summary: 'Verificar transferencia por clave dinamica' })
async verifyTransactionByCode(
  @Param('code') code: string,
  @Request() req
): Promise<TransactionVerificationResponse> {
  return this.tokenService.verifyTransactionByCode(code, req.user.id);
}
```

**Nuevo metodo en TokenService:**

```typescript
async verifyTransactionByCode(code: string, userId: string) {
  const transactions = await this.transactionRepo.find({
    where: { dynamicCode: code },
    relations: ['user'],
  });

  if (transactions.length === 0) {
    throw new NotFoundException('Transaccion no encontrada');
  }

  // Verificar que el usuario es parte de la transaccion
  const userInvolved = transactions.some(
    t => t.userId === userId || t.fromUserId === userId || t.toUserId === userId
  );

  if (!userInvolved) {
    throw new ForbiddenException('No tienes acceso a esta transaccion');
  }

  return {
    dynamicCode: code,
    transactions: transactions.map(t => ({
      type: t.type,
      amount: t.amount,
      description: t.description,
      executedAt: t.executedAt,
    })),
    verified: true,
  };
}
```

### 4. Actualizar DTOs

**Archivo:** `backend/src/token/dto/transfer.dto.ts`

```typescript
// Agregar a TransferExecuteResponseDto
export class TransferExecuteResponseDto {
  // ... campos existentes ...

  @ApiProperty({ example: 'GS-7K3M9P' })
  dynamicCode: string;

  @ApiProperty({ example: '2026-01-09T14:32:15.123Z' })
  executedAt: string;
}

// Nuevo DTO para verificacion
export class TransactionVerificationResponseDto {
  @ApiProperty({ example: 'GS-7K3M9P' })
  dynamicCode: string;

  @ApiProperty()
  transactions: TransactionDetailDto[];

  @ApiProperty({ example: true })
  verified: boolean;
}
```

---

## Cambios en Mobile App

### 1. Actualizar Tipos

**Archivo:** `mobile/src/services/transfer.service.ts`

```typescript
export interface TransferExecuteResponse {
  // ... campos existentes ...
  dynamicCode: string;       // Nueva clave dinamica
  executedAt: string;        // Timestamp exacto
}
```

### 2. Actualizar TransferSuccess Component

**Archivo:** `mobile/src/components/wallet/TransferSuccess.tsx`

**Cambios principales:**

```tsx
// Agregar estado para copiar codigo
const [codeCopied, setCodeCopied] = useState(false);

// Funcion para copiar
const copyDynamicCode = async () => {
  await Clipboard.setStringAsync(result.dynamicCode);
  setCodeCopied(true);
  setTimeout(() => setCodeCopied(false), 2000);
};

// En el render - NUEVA SECCION PROMINENTE
<View style={styles.dynamicCodeContainer}>
  <GSText variant="caption" color="textSecondary">
    Clave de Transaccion
  </GSText>
  <TouchableOpacity
    style={styles.dynamicCodeBox}
    onPress={copyDynamicCode}
  >
    <GSText variant="h2" weight="bold" style={styles.dynamicCodeText}>
      {result.dynamicCode}
    </GSText>
    <Ionicons
      name={codeCopied ? "checkmark" : "copy-outline"}
      size={24}
      color={theme.colors.primary}
    />
  </TouchableOpacity>
  <GSText variant="caption" color="textSecondary" style={styles.hint}>
    Guarda este codigo como comprobante
  </GSText>
</View>

// Timestamp exacto
<View style={styles.detailRow}>
  <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
  <GSText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
    {formatDateTime(result.executedAt)}
  </GSText>
</View>
```

**Nuevos estilos:**

```typescript
dynamicCodeContainer: {
  alignItems: 'center',
  marginVertical: 24,
  width: '100%',
},
dynamicCodeBox: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: theme.colors.primary + '10',
  paddingHorizontal: 24,
  paddingVertical: 16,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: theme.colors.primary,
  borderStyle: 'dashed',
  marginVertical: 8,
},
dynamicCodeText: {
  letterSpacing: 4,
  marginRight: 12,
  fontFamily: 'monospace',
},
hint: {
  textAlign: 'center',
  marginTop: 4,
},
```

### 3. Actualizar Historial de Transacciones

**Archivo:** `mobile/src/screens/wallet/WalletScreen.tsx`

**Cambios en TransactionItem:**

```tsx
// Mostrar codigo dinamico en transacciones de transferencia
{(transaction.type === 'transfer_out' || transaction.type === 'transfer_in') &&
  transaction.dynamicCode && (
  <View style={styles.dynamicCodeBadge}>
    <Ionicons name="key-outline" size={12} color={theme.colors.textSecondary} />
    <GSText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
      {transaction.dynamicCode}
    </GSText>
  </View>
)}
```

### 4. Nueva Pantalla de Verificacion (Opcional)

**Nuevo archivo:** `mobile/src/screens/wallet/VerifyTransactionScreen.tsx`

Pantalla donde el usuario puede ingresar un codigo para verificar una transaccion:

```tsx
// Input para codigo
<TextInput
  placeholder="Ej: GS-7K3M9P"
  value={code}
  onChangeText={setCode}
  autoCapitalize="characters"
  maxLength={10}
/>

// Resultado de verificacion
{verificationResult && (
  <View style={styles.resultCard}>
    <GSText>Transaccion Verificada</GSText>
    <GSText>Monto: {result.amount}</GSText>
    <GSText>Fecha: {result.executedAt}</GSText>
  </View>
)}
```

---

## Endpoints API Resultantes

### Endpoints Existentes (Modificados)

```typescript
// Ejecutar transferencia - AHORA incluye dynamicCode
POST /api/v1/tokens/transfer/execute
Response: {
  success: true,
  transferId: "TRF_1704812345_abc123",
  dynamicCode: "GS-7K3M9P",           // NUEVO
  executedAt: "2026-01-09T14:32:15Z", // NUEVO
  transactions: [...],
  summary: {...}
}
```

### Nuevo Endpoint

```typescript
// Verificar transaccion por codigo
GET /api/v1/tokens/transactions/verify/:code
Response: {
  dynamicCode: "GS-7K3M9P",
  verified: true,
  transactions: [
    { type: "transfer_out", amount: -100000, executedAt: "..." },
    { type: "transfer_in", amount: 100000, executedAt: "..." },
    { type: "platform_fee", amount: -200, executedAt: "..." }
  ]
}
```

---

## Flujo de Usuario Actualizado

### Emisor (Quien Envia)

1. Confirma la transferencia
2. Ve pantalla de exito con:
   - **Clave dinamica prominente** (GS-XXXXXX)
   - Boton para copiar codigo
   - Timestamp exacto de ejecucion
   - Monto y destinatario
3. Puede compartir el codigo con el receptor como comprobante

### Receptor (Quien Recibe)

1. Recibe notificacion push (si implementada)
2. Ve en su historial:
   - Transaccion recibida con el mismo codigo dinamico
   - Puede verificar el codigo para confirmar origen
3. Puede usar el codigo para reclamar si hay problemas

### Administrador / Soporte

1. Usuario reporta: "No encuentro mi transferencia"
2. Admin puede buscar por codigo dinamico
3. Sistema muestra todas las transacciones vinculadas al codigo
4. Evidencia clara de que la transferencia se realizo

---

## Casos de Uso para Reclamos

### Caso 1: "No hice esa transferencia"

1. Usuario afirma no haber realizado una transferencia
2. Sistema muestra el codigo dinamico unico
3. Si el usuario no tiene el codigo, confirma que no fue el
4. Si tiene el codigo guardado, confirma que si fue el

### Caso 2: "No recibí el dinero"

1. Receptor afirma no haber recibido
2. Emisor proporciona codigo dinamico (GS-XXXXXX)
3. Admin busca por codigo
4. Sistema muestra:
   - TRANSFER_OUT del emisor (confirmado)
   - TRANSFER_IN del receptor (confirmado)
   - Timestamp exacto
5. Evidencia de que el dinero fue acreditado

### Caso 3: "No puedo encontrar la transferencia"

1. Usuario busca por codigo en la app
2. Sistema muestra detalles completos de la transaccion
3. Usuario confirma que es la transaccion correcta

---

## Migracion de Base de Datos

### Paso 1: Crear migracion

```bash
cd backend
npm run migration:generate -- -n AddDynamicCodeToTransactions
```

### Paso 2: Contenido de la migracion

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDynamicCodeToTransactions1736XXXXXX implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna dynamic_code
    await queryRunner.query(`
      ALTER TABLE gshop_transactions
      ADD COLUMN dynamic_code VARCHAR(10) UNIQUE
    `);

    // Agregar columna executed_at
    await queryRunner.query(`
      ALTER TABLE gshop_transactions
      ADD COLUMN executed_at TIMESTAMP
    `);

    // Crear indice para busquedas rapidas
    await queryRunner.query(`
      CREATE INDEX idx_transactions_dynamic_code
      ON gshop_transactions(dynamic_code)
    `);

    // Opcional: Generar codigos para transacciones existentes de tipo transfer
    await queryRunner.query(`
      UPDATE gshop_transactions
      SET dynamic_code = CONCAT('GS-', UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))),
          executed_at = created_at
      WHERE type IN ('transfer_out', 'transfer_in', 'platform_fee')
        AND dynamic_code IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_transactions_dynamic_code`);
    await queryRunner.query(`ALTER TABLE gshop_transactions DROP COLUMN executed_at`);
    await queryRunner.query(`ALTER TABLE gshop_transactions DROP COLUMN dynamic_code`);
  }
}
```

---

## Archivos a Crear/Modificar

### Backend (Crear)

| Archivo | Descripcion |
|---------|-------------|
| `src/token/utils/dynamic-code.generator.ts` | Utilidad para generar codigos unicos |
| `src/database/migrations/XXXX-AddDynamicCodeToTransactions.ts` | Migracion de BD |

### Backend (Modificar)

| Archivo | Cambios |
|---------|---------|
| `src/token/token.entity.ts` | Agregar campos `dynamicCode` y `executedAt` |
| `src/token/token.service.ts` | Generar codigo en `executeTransferWithFee()`, nuevo metodo `verifyTransactionByCode()` |
| `src/token/token.controller.ts` | Nuevo endpoint `GET /transactions/verify/:code` |
| `src/token/dto/transfer.dto.ts` | Agregar campos de respuesta y DTOs de verificacion |
| `src/token/token.module.ts` | (si necesario) registrar nuevas dependencias |

### Mobile (Modificar)

| Archivo | Cambios |
|---------|---------|
| `src/services/transfer.service.ts` | Actualizar tipo `TransferExecuteResponse` |
| `src/components/wallet/TransferSuccess.tsx` | Mostrar clave dinamica prominente |
| `src/screens/wallet/WalletScreen.tsx` | Mostrar codigo en historial de transacciones |
| `src/i18n/locales/es.json` | Agregar traducciones para clave dinamica |

### Mobile (Opcional - Crear)

| Archivo | Descripcion |
|---------|-------------|
| `src/screens/wallet/VerifyTransactionScreen.tsx` | Pantalla para verificar por codigo |

### Admin Panel (Crear)

| Archivo | Descripcion |
|---------|-------------|
| `app/dashboard/transactions/[code]/page.tsx` | Pagina de detalle de transaccion por codigo |

### Admin Panel (Modificar)

| Archivo | Cambios |
|---------|---------|
| `app/dashboard/transactions/page.tsx` | Agregar columna de codigo, input de busqueda por codigo, link a detalle |
| `messages/es.json` | Agregar traducciones para codigo dinamico y detalle de transaccion |

### Backend (Agregar para Admin)

| Archivo | Cambios |
|---------|---------|
| `src/token/token.controller.ts` | Nuevo endpoint `GET /admin/transactions/verify/:code` |
| `src/token/token.service.ts` | Nuevo metodo `adminVerifyTransactionByCode()` |

---

## Orden de Implementacion

| Paso | Tarea | Dependencia |
|------|-------|-------------|
| 1 | Crear migracion de BD | - |
| 2 | Agregar campos a entity | Paso 1 |
| 3 | Crear utilidad de generacion | - |
| 4 | Modificar `executeTransferWithFee()` | Pasos 2, 3 |
| 5 | Actualizar DTOs | Paso 4 |
| 6 | Crear endpoint de verificacion (usuario) | Paso 4 |
| 7 | Crear endpoint de verificacion (admin) | Paso 4 |
| 8 | Actualizar tipos en mobile | Paso 5 |
| 9 | Modificar TransferSuccess | Paso 8 |
| 10 | Actualizar historial de transacciones mobile | Paso 8 |
| 11 | Agregar traducciones i18n mobile | - |
| 12 | Actualizar pagina de transacciones admin | Paso 7 |
| 13 | Crear pagina de detalle de transaccion admin | Paso 7 |
| 14 | Agregar traducciones i18n admin | - |
| 15 | (Opcional) Pantalla de verificacion mobile | Paso 6 |

---

## Verificacion y Testing

### Tests Backend

```typescript
describe('Dynamic Code Generator', () => {
  it('should generate code in correct format', () => {
    const code = generateDynamicCode();
    expect(code).toMatch(/^GS-[A-Z2-9]{6}$/);
  });

  it('should generate unique codes', async () => {
    const codes = new Set();
    for (let i = 0; i < 1000; i++) {
      codes.add(generateDynamicCode());
    }
    expect(codes.size).toBe(1000);
  });
});

describe('Transfer with Dynamic Code', () => {
  it('should include dynamicCode in response', async () => {
    const result = await tokenService.executeTransferWithFee(
      fromUser, toUser, 100000, 'Test'
    );
    expect(result.dynamicCode).toMatch(/^GS-[A-Z2-9]{6}$/);
    expect(result.executedAt).toBeDefined();
  });
});
```

### Tests Mobile

1. Realizar transferencia y verificar que se muestra el codigo
2. Copiar codigo y verificar que se copia correctamente
3. Verificar que el codigo aparece en el historial
4. (Si implementado) Buscar transferencia por codigo

---

## Consideraciones de Seguridad

- **Unicidad garantizada:** Indice UNIQUE en base de datos previene duplicados
- **Formato no secuencial:** Codigos aleatorios, no se puede predecir el siguiente
- **Acceso restringido:** Solo usuarios involucrados pueden verificar el codigo
- **Rate limiting:** Proteger endpoint de verificacion contra brute force
- **Logs de auditoria:** Registrar cada intento de verificacion

---

## Cambios en Admin Panel

### Estado Actual

Ya existe la pagina `/dashboard/transactions` con:
- Estadisticas de volumen, fees, transferencias P2P, topups
- Tabla de transacciones con filtros por tipo y estado
- Busqueda por texto (email, referencia)
- Paginacion

**Falta implementar:**
- Busqueda por codigo dinamico
- Columna de codigo dinamico en la tabla
- Pagina de detalle de transaccion individual

---

### 1. Actualizar Pagina de Transacciones

**Archivo:** `admin-web/app/dashboard/transactions/page.tsx`

**Cambios en la interfaz Transaction:**

```typescript
interface Transaction {
  // ... campos existentes ...
  dynamicCode: string | null;  // NUEVO
  executedAt: string | null;   // NUEVO
}
```

**Agregar input de busqueda por codigo:**

```tsx
// Nuevo estado
const [codeSearch, setCodeSearch] = useState('');

// Nuevo input en filtros
<div className="flex gap-2">
  <Input
    placeholder="Buscar por codigo (GS-XXXXXX)"
    value={codeSearch}
    onChange={(e) => setCodeSearch(e.target.value.toUpperCase())}
    className="w-[200px] font-mono"
    maxLength={10}
  />
  <Button
    variant="outline"
    onClick={() => searchByCode(codeSearch)}
    disabled={!codeSearch.startsWith('GS-')}
  >
    <Key className="mr-2 h-4 w-4" />
    Verificar
  </Button>
</div>
```

**Agregar columna de codigo en la tabla:**

```tsx
<TableHead>{t('table.dynamicCode')}</TableHead>

// En TableBody
<TableCell>
  {tx.dynamicCode ? (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="font-mono">
        {tx.dynamicCode}
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/dashboard/transactions/${tx.dynamicCode}`)}
      >
        <Eye className="h-4 w-4" />
      </Button>
    </div>
  ) : (
    <span className="text-muted-foreground">-</span>
  )}
</TableCell>
```

---

### 2. Nueva Pagina de Detalle de Transaccion

**Nuevo archivo:** `admin-web/app/dashboard/transactions/[code]/page.tsx`

Esta pagina muestra todas las transacciones vinculadas a un codigo dinamico:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Key
} from 'lucide-react'
import { apiClient, formatDate } from '@/lib/api-client'

interface TransactionDetail {
  id: string
  type: string
  status: string
  amount: number
  fee: number
  description: string
  executedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface VerificationResult {
  dynamicCode: string
  verified: boolean
  transactions: TransactionDetail[]
  summary: {
    sender: { name: string; email: string }
    receiver: { name: string; email: string }
    amountSent: number
    platformFee: number
    netReceived: number
    executedAt: string
  }
}

export default function TransactionDetailPage() {
  const params = useParams()
  const code = params.code as string
  const [data, setData] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTransactionByCode()
  }, [code])

  const fetchTransactionByCode = async () => {
    try {
      const result = await apiClient.get<VerificationResult>(
        `/tokens/admin/transactions/verify/${code}`
      )
      setData(result)
    } catch (err: any) {
      setError('Transaccion no encontrada')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Codigo no encontrado</h2>
            <p className="text-muted-foreground">
              No existe ninguna transaccion con el codigo {code}
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header con codigo */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="text-2xl font-mono py-2 px-4">
                {data.dynamicCode}
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Verificado
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Detalle de transferencia P2P
            </p>
          </div>
        </div>

        {/* Resumen de la transferencia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Emisor */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-blue-500" />
                Emisor (Quien envio)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{data.summary.sender.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {data.summary.sender.email}
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  -{formatCurrency(data.summary.amountSent)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receptor */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowDownLeft className="h-4 w-4 text-green-500" />
                Receptor (Quien recibio)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{data.summary.receiver.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {data.summary.receiver.email}
                </div>
                <div className="text-2xl font-bold text-green-600">
                  +{formatCurrency(data.summary.netReceived)}
                </div>
                <div className="text-xs text-muted-foreground">
                  (Recibio {formatCurrency(data.summary.amountSent)},
                  fee: {formatCurrency(data.summary.platformFee)})
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timestamp */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Fecha y hora de ejecucion</div>
                <div className="text-muted-foreground">
                  {new Date(data.summary.executedAt).toLocaleString('es-CO', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalle de transacciones */}
        <Card>
          <CardHeader>
            <CardTitle>Transacciones vinculadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.transactions.map((tx, index) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {tx.type === 'transfer_out' && (
                      <ArrowUpRight className="h-5 w-5 text-blue-500" />
                    )}
                    {tx.type === 'transfer_in' && (
                      <ArrowDownLeft className="h-5 w-5 text-green-500" />
                    )}
                    {tx.type === 'platform_fee' && (
                      <Coins className="h-5 w-5 text-purple-500" />
                    )}
                    <div>
                      <div className="font-medium">{tx.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {tx.user.firstName} {tx.user.lastName}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold ${
                    tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
```

---

### 3. Nuevo Endpoint Admin para Verificacion

**Archivo:** `backend/src/token/token.controller.ts`

```typescript
@Get('admin/transactions/verify/:code')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiOperation({ summary: 'Verificar transferencia por codigo (Admin)' })
async adminVerifyTransactionByCode(
  @Param('code') code: string
): Promise<AdminTransactionVerificationResponse> {
  return this.tokenService.adminVerifyTransactionByCode(code);
}
```

**Nuevo metodo en TokenService:**

```typescript
async adminVerifyTransactionByCode(code: string) {
  const transactions = await this.transactionRepo.find({
    where: { dynamicCode: code },
    relations: ['user'],
    order: { createdAt: 'ASC' },
  });

  if (transactions.length === 0) {
    throw new NotFoundException('Transaccion no encontrada');
  }

  // Encontrar emisor y receptor
  const transferOut = transactions.find(t => t.type === 'transfer_out');
  const transferIn = transactions.find(t => t.type === 'transfer_in');
  const platformFee = transactions.find(t => t.type === 'platform_fee');

  // Cargar usuarios completos
  const sender = await this.usersRepo.findOne({
    where: { id: transferOut?.userId }
  });
  const receiver = await this.usersRepo.findOne({
    where: { id: transferIn?.userId }
  });

  return {
    dynamicCode: code,
    verified: true,
    transactions: transactions.map(t => ({
      id: t.id,
      type: t.type,
      status: t.status,
      amount: t.amount,
      fee: t.fee,
      description: t.description,
      executedAt: t.executedAt,
      user: {
        id: t.user.id,
        firstName: t.user.firstName,
        lastName: t.user.lastName,
        email: t.user.email,
      },
    })),
    summary: {
      sender: {
        name: `${sender?.firstName} ${sender?.lastName}`,
        email: sender?.email,
      },
      receiver: {
        name: `${receiver?.firstName} ${receiver?.lastName}`,
        email: receiver?.email,
      },
      amountSent: Math.abs(transferOut?.amount || 0),
      platformFee: Math.abs(platformFee?.amount || 0),
      netReceived: (transferIn?.amount || 0) - Math.abs(platformFee?.amount || 0),
      executedAt: transferOut?.executedAt?.toISOString(),
    },
  };
}
```

---

### 4. Agregar Traducciones i18n

**Archivo:** `admin-web/messages/es.json`

Agregar dentro del objeto `transactions`:

```json
{
  "transactions": {
    "table": {
      "dynamicCode": "Codigo",
      "executedAt": "Ejecutado"
    },
    "filters": {
      "searchByCode": "Buscar por codigo",
      "codePlaceholder": "Ej: GS-7K3M9P"
    },
    "detail": {
      "title": "Detalle de Transferencia",
      "verified": "Verificado",
      "sender": "Emisor (Quien envio)",
      "receiver": "Receptor (Quien recibio)",
      "executedAt": "Fecha y hora de ejecucion",
      "linkedTransactions": "Transacciones vinculadas",
      "notFound": "Codigo no encontrado",
      "notFoundDescription": "No existe ninguna transaccion con el codigo"
    }
  }
}
```

---

### 5. Archivos Admin a Crear/Modificar

| Archivo | Cambios |
|---------|---------|
| `app/dashboard/transactions/page.tsx` | Agregar columna de codigo, input de busqueda, link a detalle |
| `app/dashboard/transactions/[code]/page.tsx` | **NUEVO** - Pagina de detalle por codigo |
| `messages/es.json` | Agregar traducciones para codigo dinamico |

---

### Flujo Admin Completo

1. **Busqueda rapida por codigo:**
   - Admin ingresa codigo (ej: `GS-7K3M9P`) en el input
   - Click en "Verificar" → navega a `/dashboard/transactions/GS-7K3M9P`

2. **Ver codigo en lista:**
   - La tabla muestra columna "Codigo" con badge del codigo
   - Click en el icono de ojo → navega al detalle

3. **Pagina de detalle:**
   - Muestra codigo prominente con badge "Verificado"
   - Tarjetas de emisor y receptor con montos
   - Timestamp exacto de ejecucion
   - Lista de todas las transacciones vinculadas

---

## Metricas a Trackear

- Numero de verificaciones por codigo
- Tiempo promedio entre transferencia y verificacion
- Reclamos resueltos usando el codigo dinamico
- Tasa de copia del codigo (engagement)
- Busquedas de admin por codigo (uso del panel)

---

## Progreso de Implementacion

### Fase 1: Migracion BD y Entity - COMPLETADO
- [x] Agregar campos `dynamicCode` y `executedAt` a `GshopTransaction` entity
- [x] Crear migracion `1767300000000-AddDynamicCodeToTransactions.ts`
- [x] Indice para busquedas rapidas por codigo
- [x] Script para generar codigos a transacciones existentes

**Archivos modificados:**
- `backend/src/token/token.entity.ts`
- `backend/src/database/migrations/1767300000000-AddDynamicCodeToTransactions.ts`

### Fase 2: Utilidad de generacion de codigo - PENDIENTE

### Fase 3: Modificar TokenService - PENDIENTE

### Fase 4: Actualizar DTOs - PENDIENTE

### Fase 5: Endpoints de verificacion - PENDIENTE

### Fase 6: Mobile App - PENDIENTE

### Fase 7: Admin Panel - PENDIENTE

### Fase 8: Traducciones i18n - PENDIENTE
