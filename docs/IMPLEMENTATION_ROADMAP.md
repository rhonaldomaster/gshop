# 🗺️ GSHOP Implementation Roadmap

## 📌 Resumen Ejecutivo

Este documento contiene los planes de implementación para las siguientes mejoras del proyecto GSHOP:

### 1. 💳 Integración de Pasarela de Pago (Plan 1)
**Archivo:** `PLAN_1_PAYMENT_GATEWAY_INTEGRATION.md`
- **Objetivo:** Ejecutar automáticamente el flujo de pago en MercadoPago al confirmar orden
- **Tiempo estimado:** 4-6 horas
- **Prioridad:** 🔴 Alta
- **Estado:** Pendiente

### 2. 🇨🇴 Solo MercadoPago para Colombia (Plan 2)
**Archivo:** `PLAN_2_MERCADOPAGO_ONLY.md`
- **Objetivo:** Deshabilitar Stripe y USDC, dejar solo MercadoPago
- **Tiempo estimado:** 30 minutos (opción simple) / 2-3 horas (opción escalable)
- **Prioridad:** 🟡 Media
- **Estado:** Pendiente

### 3. 🌎 Localización a Español (Plan 3)
**Archivo:** `PLAN_3_SPANISH_LOCALIZATION.md`
- **Objetivo:** Traducir toda la app de inglés a español usando react-i18next
- **Tiempo estimado:** 15-20 horas
- **Prioridad:** 🔴 Alta
- **Estado:** Pendiente

---

## 🎯 Orden de Implementación Recomendado

### Fase 1: Quick Wins (1 hora)
```
📋 PLAN 2 (Opción A - Simple)
   └─ Deshabilitar Stripe y USDC
   └─ Dejar solo MercadoPago
   └─ Testing básico
```

**Justificación:** Es el cambio más rápido y elimina confusión del usuario inmediatamente.

### Fase 2: Integración de Pago (1 semana)
```
📋 PLAN 1 - Pasarela de Pago
   ├─ Backend: MercadoPago preference creation
   ├─ Backend: Webhook handler
   ├─ Mobile: WebView para pago
   ├─ Mobile: Callback handling
   └─ Testing completo con tarjetas de prueba
```

**Justificación:** Funcionalidad crítica para que los usuarios puedan completar compras reales.

### Fase 3: Localización (2 semanas)
```
📋 PLAN 3 - Español
   ├─ Fase 3.1: Setup i18next (1 día)
   ├─ Fase 3.2: Checkout flow (1 día)
   ├─ Fase 3.3: Core screens (2 días)
   ├─ Fase 3.4: Resto de app (4 días)
   └─ Fase 3.5: QA y correcciones (2 días)
```

**Justificación:** Mejora significativa de UX pero puede hacerse gradualmente.

---

## 📊 Timeline Visual

```
Semana 1
├─ Día 1: PLAN 2 (MercadoPago only) ✨
├─ Día 2-3: PLAN 1 - Backend payment gateway
├─ Día 4-5: PLAN 1 - Mobile WebView & callbacks
└─ Fin de semana: Testing intensivo

Semana 2-3
├─ PLAN 3 - Setup i18next
├─ PLAN 3 - Traducción gradual
│   ├─ Checkout (prioridad 1)
│   ├─ Cart & Auth (prioridad 2)
│   └─ Resto de screens (prioridad 3)
└─ QA continuo

Semana 4
├─ Testing final
├─ Bug fixes
└─ Documentación
```

---

## 🚀 Quick Start

### Para empezar con Plan 2 (el más rápido):
```bash
# 1. Abrir archivo de plan
cat PLAN_2_MERCADOPAGO_ONLY.md

# 2. Ir a la sección "Opción A: Simple"

# 3. Hacer solo 2 cambios:
#    - Mobile: PaymentMethodSelection.tsx (línea 74)
#    - Backend: payments-v2.service.ts (validación)

# 4. Testing
npm run dev:mobile
```

### Para empezar con Plan 1 (funcionalidad crítica):
```bash
# 1. Abrir archivo de plan
cat PLAN_1_PAYMENT_GATEWAY_INTEGRATION.md

# 2. Seguir orden de implementación paso a paso

# 3. Instalar dependencias mobile
cd mobile && npm install react-native-webview

# 4. Configurar variables de entorno
# Editar backend/.env y agregar MERCAPAGO_ACCESS_TOKEN
```

### Para empezar con Plan 3 (UX mejorado):
```bash
# 1. Abrir archivo de plan
cat PLAN_3_SPANISH_LOCALIZATION.md

# 2. Instalar dependencias
cd mobile && npm install i18next react-i18next

# 3. Crear estructura de carpetas i18n/

# 4. Empezar con checkout (alta prioridad)
```

---

## ✅ Checklist de Pre-Implementación

Antes de empezar cualquier plan, verificar:

- [ ] Backend corriendo en puerto 3000
- [ ] Mobile corriendo en Expo
- [ ] Base de datos PostgreSQL conectada
- [ ] Variables de entorno configuradas
- [ ] Git branch actualizado
- [ ] Tests pasando (si aplica)

---

## 📞 Soporte

Si tienes dudas sobre cualquier plan:
1. Leer el archivo de plan completo primero
2. Revisar sección de "Consideraciones" en cada plan
3. Verificar "Orden de Implementación" sugerido
4. Consultar ejemplos de código incluidos

---

## 🎨 Notas de Diseño

### Plan 1 (Pago)
- WebView debe tener loading indicator
- Manejar errores de red gracefully
- Timeout de 5 minutos en WebView
- Back button debe mostrar confirmación

### Plan 2 (Solo MercadoPago)
- Opción A es suficiente para MVP
- Opción B solo si se planea expansión internacional pronto

### Plan 3 (Español)
- Mantener consistency en tono (informal/formal)
- Usar términos locales colombianos
- "Carrito" no "Cesta"
- "Checkout" puede quedarse (término común en e-commerce)

---

**Última actualización:** 2025-10-22
**Versión:** 1.0.0
**Autor:** Miyu (Claude Code) ❤️
