# Plan de Implementación: Seller Panel - Página de Pagos y Retiros

## 📋 Resumen Ejecutivo

Implementar la página de pagos y retiros (`/dashboard/payments`) en el seller panel para que los vendedores puedan:
- Ver su balance disponible y pendiente
- Solicitar retiros de fondos
- Ver historial de retiros con estados
- Consultar información de cuenta bancaria configurada

### 📊 Estado Actual

**Backend**: ✅ 90% Implementado
- ✅ Entidad `Seller` con campos de balance (availableBalance, pendingBalance, totalEarnings)
- ✅ Entidad `Withdrawal` con estados (pending, completed, rejected)
- ✅ Endpoint `POST /api/v1/sellers/withdrawal` - Solicitar retiro
- ✅ Endpoint `GET /api/v1/sellers/stats` - Obtener estadísticas (incluye balances)
- ❌ **Falta**: Endpoint `GET /api/v1/sellers/my-withdrawals` - Historial de retiros del vendedor

**Frontend**: ❌ 0% Implementado
- ❌ Página `/dashboard/payments/page.tsx`
- ❌ Componentes de UI
- ❌ Integración con API

**Tiempo estimado total**: 3-4 horas

---

## 🎯 Objetivos

1. **Balance disponible**: Mostrar balance disponible para retiro y balance pendiente
2. **Solicitar retiro**: Formulario para solicitar retiro con validación de monto
3. **Historial de retiros**: Tabla con historial completo de solicitudes
4. **Información bancaria**: Mostrar cuenta configurada para recibir pagos
5. **Estados visuales**: Badges de colores para estados de retiro (pendiente, aprobado, rechazado)

---

## 🏗️ Arquitectura

### Backend (Fase 1)

#### Nuevo Endpoint Requerido

```typescript
// backend/src/sellers/sellers.controller.ts

@Get('my-withdrawals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get seller own withdrawal history' })
@ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
@ApiQuery({ name: 'limit', required: false, description: 'Limit results (default: 20)' })
async getMyWithdrawals(
  @Request() req,
  @Query('status') status?: string,
  @Query('limit') limit?: number,
) {
  return this.sellersService.getSellerWithdrawals(req.user.sellerId, status, limit || 20)
}
```

#### Nuevo Método en SellersService

```typescript
// backend/src/sellers/sellers.service.ts

async getSellerWithdrawals(sellerId: string, status?: string, limit: number = 20) {
  const queryBuilder = this.withdrawalsRepository
    .createQueryBuilder('withdrawal')
    .where('withdrawal.sellerId = :sellerId', { sellerId })
    .orderBy('withdrawal.createdAt', 'DESC')
    .limit(limit)

  if (status && Object.values(WithdrawalStatus).includes(status as WithdrawalStatus)) {
    queryBuilder.andWhere('withdrawal.status = :status', { status })
  }

  const withdrawals = await queryBuilder.getMany()

  return {
    withdrawals,
    total: await queryBuilder.getCount(),
  }
}
```

### Frontend (Fase 2)

#### Estructura de Archivos

```
seller-panel/
└── app/
    └── dashboard/
        └── payments/
            └── page.tsx                 # Página principal ✨ NUEVO
```

#### Componente Principal: `/dashboard/payments/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Wallet, TrendingUp, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface SellerStats {
  totalEarnings: number
  availableBalance: number
  pendingBalance: number
  totalOrders: number
  totalSales: number
}

interface Withdrawal {
  id: string
  amount: number
  status: 'pending' | 'completed' | 'rejected'
  createdAt: string
  processedAt?: string
  notes?: string
}

export default function PaymentsPage() {
  const t = useTranslations('payments')
  const tCommon = useTranslations('common')
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Fetch seller stats (incluye balances)
  const { data: stats, isLoading: statsLoading } = useQuery<SellerStats>({
    queryKey: ['seller-stats'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/stats`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      })
      if (!res.ok) throw new Error('Error al cargar estadísticas')
      return res.json()
    },
    enabled: !!session?.accessToken,
  })

  // Fetch withdrawal history
  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['my-withdrawals', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sellers/my-withdrawals?${params}`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      )
      if (!res.ok) throw new Error('Error al cargar retiros')
      return res.json()
    },
    enabled: !!session?.accessToken,
  })

  // Request withdrawal mutation
  const requestWithdrawalMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/withdrawal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ amount }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error al solicitar retiro')
      }

      return res.json()
    },
    onSuccess: () => {
      toast.success(t('withdrawalRequested'))
      setWithdrawalAmount('')
      queryClient.invalidateQueries({ queryKey: ['seller-stats'] })
      queryClient.invalidateQueries({ queryKey: ['my-withdrawals'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleRequestWithdrawal = () => {
    const amount = parseFloat(withdrawalAmount)

    if (isNaN(amount) || amount <= 0) {
      toast.error(t('invalidAmount'))
      return
    }

    if (amount > (stats?.availableBalance || 0)) {
      toast.error(t('insufficientBalance'))
      return
    }

    if (amount < 10000) {
      toast.error(t('minimumAmount'))
      return
    }

    requestWithdrawalMutation.mutate(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: t('pending'), color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      completed: { label: t('completed'), color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: t('rejected'), color: 'bg-red-100 text-red-800', icon: XCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  if (statsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">{tCommon('loading')}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">{t('subtitle')}</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('availableBalance')}
              </CardTitle>
              <Wallet className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${stats?.availableBalance?.toLocaleString('es-CO') || '0'}
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('availableForWithdrawal')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('pendingBalance')}
              </CardTitle>
              <Clock className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                ${stats?.pendingBalance?.toLocaleString('es-CO') || '0'}
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('pendingApproval')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('totalEarnings')}
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                ${stats?.totalEarnings?.toLocaleString('es-CO') || '0'}
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('allTimeEarnings')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Request Withdrawal Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t('requestWithdrawal')}</CardTitle>
            <CardDescription>{t('requestWithdrawalDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="amount">{t('amount')}</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="pl-10"
                    min="10000"
                    step="1000"
                  />
                </div>
                <p className="text-sm text-gray-500">{t('minimumWithdrawal')}: $10.000 COP</p>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleRequestWithdrawal}
                  disabled={requestWithdrawalMutation.isPending || !withdrawalAmount}
                  className="w-full"
                >
                  {requestWithdrawalMutation.isPending ? t('requesting') : t('request')}
                </Button>
              </div>
            </div>

            {/* Bank Account Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                {t('bankAccountInfo')}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">{t('bankName')}:</span>
                  <span className="ml-2 font-medium">{session?.seller?.bankName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('accountType')}:</span>
                  <span className="ml-2 font-medium">
                    {session?.seller?.bankAccountType === 'ahorros' ? 'Ahorros' : 'Corriente'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t('accountNumber')}:</span>
                  <span className="ml-2 font-medium">
                    {session?.seller?.bankAccountNumber
                      ? `****${session.seller.bankAccountNumber.slice(-4)}`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t('accountHolder')}:</span>
                  <span className="ml-2 font-medium">
                    {session?.seller?.bankAccountHolder || 'N/A'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                {t('updateBankInfo')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t('withdrawalHistory')}</CardTitle>
                <CardDescription>{t('withdrawalHistoryDesc')}</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="completed">{t('completed')}</SelectItem>
                  <SelectItem value="rejected">{t('rejected')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {withdrawalsLoading ? (
              <div className="text-center py-8 text-gray-500">{tCommon('loading')}</div>
            ) : withdrawalsData?.withdrawals?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">{t('noWithdrawals')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        {t('date')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        {t('amount')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        {t('status')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        {t('processedDate')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        {t('notes')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalsData?.withdrawals?.map((withdrawal: Withdrawal) => (
                      <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {new Date(withdrawal.createdAt).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          ${withdrawal.amount.toLocaleString('es-CO')}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(withdrawal.status)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {withdrawal.processedAt
                            ? new Date(withdrawal.processedAt).toLocaleDateString('es-CO')
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {withdrawal.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
```

---

## 📝 Traducciones Requeridas

### `seller-panel/messages/es.json`

Agregar nueva sección `payments`:

```json
{
  "payments": {
    "title": "Pagos y Retiros",
    "subtitle": "Gestiona tus retiros de fondos y consulta tu historial de pagos",
    "availableBalance": "Saldo Disponible",
    "pendingBalance": "Saldo Pendiente",
    "totalEarnings": "Ganancias Totales",
    "availableForWithdrawal": "Disponible para retiro",
    "pendingApproval": "En aprobación",
    "allTimeEarnings": "Histórico total",
    "requestWithdrawal": "Solicitar Retiro",
    "requestWithdrawalDesc": "Solicita un retiro de tus fondos disponibles",
    "amount": "Monto",
    "minimumWithdrawal": "Retiro mínimo",
    "request": "Solicitar",
    "requesting": "Solicitando...",
    "bankAccountInfo": "Información Bancaria",
    "bankName": "Banco",
    "accountType": "Tipo de cuenta",
    "accountNumber": "Número de cuenta",
    "accountHolder": "Titular",
    "updateBankInfo": "Puedes actualizar tu información bancaria en Configuración",
    "withdrawalHistory": "Historial de Retiros",
    "withdrawalHistoryDesc": "Consulta el estado de tus solicitudes de retiro",
    "allStatuses": "Todos los estados",
    "pending": "Pendiente",
    "completed": "Completado",
    "rejected": "Rechazado",
    "date": "Fecha de solicitud",
    "status": "Estado",
    "processedDate": "Fecha de procesamiento",
    "notes": "Notas",
    "noWithdrawals": "No has realizado ningún retiro aún",
    "withdrawalRequested": "Retiro solicitado exitosamente",
    "invalidAmount": "Monto inválido",
    "insufficientBalance": "Saldo insuficiente",
    "minimumAmount": "El monto mínimo es $10.000 COP"
  }
}
```

---

## 🚀 Plan de Implementación

### Fase 1: Backend (30 minutos)

**Paso 1.1**: Agregar endpoint `getMyWithdrawals` en controller
- Archivo: `backend/src/sellers/sellers.controller.ts`
- Líneas: ~118 (después del endpoint de stats)
- Agregar decoradores y llamada al service

**Paso 1.2**: Implementar método en service
- Archivo: `backend/src/sellers/sellers.service.ts`
- Líneas: ~325 (antes de los métodos admin)
- Query con QueryBuilder filtrando por sellerId

**Paso 1.3**: Testing
```bash
# Autenticar como vendedor
TOKEN="your-seller-jwt-token"

# Probar endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/sellers/my-withdrawals

# Probar filtro de estado
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/sellers/my-withdrawals?status=pending"
```

### Fase 2: Frontend (2-3 horas)

**Paso 2.1**: Crear archivo de página
- Crear: `seller-panel/app/dashboard/payments/page.tsx`
- Copiar código completo del componente de arriba

**Paso 2.2**: Agregar traducciones
- Archivo: `seller-panel/messages/es.json`
- Agregar sección `payments` con todas las claves

**Paso 2.3**: Actualizar types de session (si es necesario)
- Archivo: `seller-panel/types/next-auth.d.ts`
- Asegurar que `session.seller` incluya campos bancarios

**Paso 2.4**: Testing visual
```bash
cd seller-panel
npm run dev

# Navegar a:
# http://localhost:3002/dashboard/payments
```

### Fase 3: Testing E2E (30 minutos)

**Escenario 1**: Solicitar retiro exitoso
1. Login como vendedor con balance disponible
2. Ir a /dashboard/payments
3. Ingresar monto válido ($50.000)
4. Verificar que balance disponible se reduce
5. Verificar que balance pendiente aumenta
6. Verificar que aparece en historial con estado "Pendiente"

**Escenario 2**: Validaciones
1. Intentar retiro con monto 0 → Error
2. Intentar retiro con monto mayor al balance → Error
3. Intentar retiro con monto < $10.000 → Error

**Escenario 3**: Filtros
1. Crear retiros con diferentes estados (pedir a admin aprobar/rechazar algunos)
2. Usar filtro "Pendiente" → Solo muestra pendientes
3. Usar filtro "Completado" → Solo muestra completados
4. Usar filtro "Todos" → Muestra todos

---

## 🎨 UI/UX Considerations

### Balance Cards
- ✅ **Colores distintivos**: Verde (disponible), Amarillo (pendiente), Azul (total)
- ✅ **Iconos claros**: Wallet, Clock, TrendingUp
- ✅ **Formato de moneda**: `toLocaleString('es-CO')` para separadores de miles

### Formulario de Retiro
- ✅ **Validación en frontend**: Monto mínimo, máximo (balance), números positivos
- ✅ **Ícono de moneda**: $ en input para claridad
- ✅ **Steps sugeridos**: 1.000 COP para facilitar entrada
- ✅ **Feedback inmediato**: Deshabilitar botón si amount inválido

### Información Bancaria
- ✅ **Seguridad**: Ocultar número completo de cuenta (****1234)
- ✅ **Contexto**: Recordar al usuario dónde actualizar la info
- ✅ **Destacado**: Box con fondo azul claro para llamar atención

### Historial
- ✅ **Badges de estado**: Colores consistentes (amarillo=pendiente, verde=completado, rojo=rechazado)
- ✅ **Orden cronológico**: Más recientes primero
- ✅ **Filtros útiles**: Por estado para búsqueda rápida
- ✅ **Responsive**: Overflow-x-auto para mobile

---

## 🔒 Seguridad y Validaciones

### Backend

```typescript
// Validaciones en requestWithdrawal()
✅ Verificar que seller exista
✅ Verificar balance suficiente
✅ Monto mínimo: $10.000 COP
✅ Monto positivo y válido
✅ Transacción atómica: mover dinero de available a pending
```

### Frontend

```typescript
// Validaciones antes de enviar
✅ Monto mayor a 0
✅ Monto no excede balance disponible
✅ Monto >= $10.000 COP
✅ Input numérico con step="1000"
```

---

## 📊 Métricas a Monitorear

### Performance
- Tiempo de carga de historial de retiros
- Tiempo de respuesta del endpoint `my-withdrawals`

### Business
- Promedio de retiros por vendedor
- Tasa de rechazo de retiros
- Monto promedio de retiros

### UX
- Clicks en "Solicitar Retiro"
- Errores de validación más comunes
- Tiempo promedio en la página

---

## ✅ Checklist de Implementación

### Backend
- [ ] Agregar endpoint `GET /sellers/my-withdrawals` en controller
- [ ] Implementar método `getSellerWithdrawals()` en service
- [ ] Probar endpoint con curl/Postman
- [ ] Verificar filtros de estado funcionan
- [ ] Verificar paginación (limit param)

### Frontend
- [ ] Crear archivo `page.tsx` en `/dashboard/payments`
- [ ] Agregar traducciones en `messages/es.json`
- [ ] Implementar fetch de stats
- [ ] Implementar fetch de withdrawals
- [ ] Implementar formulario de solicitud
- [ ] Agregar validaciones de formulario
- [ ] Implementar filtros de historial
- [ ] Mostrar información bancaria
- [ ] Responsive design (mobile-friendly)

### Testing
- [ ] Test: Solicitar retiro exitoso
- [ ] Test: Validación de monto mínimo
- [ ] Test: Validación de balance insuficiente
- [ ] Test: Filtros de estado funcionan
- [ ] Test: Balance cards muestran datos correctos
- [ ] Test: Historial vacío muestra mensaje apropiado
- [ ] Test: Mobile responsive

### Documentación
- [ ] Actualizar CLAUDE.md con ruta de payments
- [ ] Agregar screenshots a README (opcional)
- [ ] Documentar flujo de retiros para vendedores

---

## 🎉 Resultado Final

Al completar este plan, el seller panel tendrá:

✅ **Página de Pagos completa** (`/dashboard/payments`)
✅ **3 Cards de balance** con información clara y visual
✅ **Formulario de retiro** con validaciones robustas
✅ **Historial de retiros** con filtros y estados visuales
✅ **Información bancaria** para transparencia
✅ **API endpoint** para obtener historial propio de retiros
✅ **Traducciones completas** en español
✅ **UX pulida** con feedback inmediato

---

## 🛠️ Comandos Útiles

### Desarrollo

```bash
# Backend
cd backend
npm run start:dev

# Seller Panel
cd seller-panel
npm run dev

# Ver página
open http://localhost:3002/dashboard/payments
```

### Testing API

```bash
# Login como vendedor
curl -X POST http://localhost:3000/api/v1/auth/seller/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@gshop.com","password":"seller123"}'

# Guardar token
TOKEN="<token-from-response>"

# Ver stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/sellers/stats

# Solicitar retiro
curl -X POST http://localhost:3000/api/v1/sellers/withdrawal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":50000}'

# Ver historial
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/sellers/my-withdrawals
```

---

**Fecha de creación**: 2025-01-14
**Versión**: 1.0
**Estado**: ✨ Listo para implementar
**Prioridad**: Media
**Esfuerzo estimado**: 3-4 horas
**Dependencias**: Backend ya tiene 90% implementado

---

*Documento creado para GSHOP - Seller Panel Payments Page*
