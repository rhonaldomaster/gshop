# Plan: Implementar Login Social (Google y Facebook) en GSHOP Mobile

## Resumen
Implementar inicio de sesión con Google y Facebook en la app móvil GSHOP, siguiendo el patrón estándar de apps móviles con `expo-auth-session`.

---

## 1. Cambios en Base de Datos

### Migración: Agregar campos sociales a User entity
**Archivo:** `backend/src/database/entities/user.entity.ts`

Nuevos campos:
- `googleId: string` (nullable) - ID único de Google
- `facebookId: string` (nullable) - ID único de Facebook
- `socialProvider: string` (nullable) - Proveedor usado ('google' | 'facebook')
- `socialAvatarUrl: string` (nullable) - Avatar del proveedor social
- `isSocialAccount: boolean` (default: false) - Si se registró con login social

---

## 2. Backend (NestJS)

### 2.1 Nuevo DTO
**Crear:** `backend/src/auth/dto/social-login.dto.ts`
- `SocialLoginDto`: accessToken, provider (enum: google/facebook)
- `SocialUserData`: estructura de datos del usuario social

### 2.2 Nuevo Servicio
**Crear:** `backend/src/auth/services/social-auth.service.ts`
- `validateGoogleToken()`: Valida token con Google API (`googleapis.com/oauth2/v3/userinfo`)
- `validateFacebookToken()`: Valida token con Facebook Graph API
- `validateSocialToken()`: Router para ambos proveedores

### 2.3 Actualizar AuthService
**Modificar:** `backend/src/auth/auth.service.ts`
- Agregar método `socialLogin(socialLoginDto)`:
  1. Validar token con el proveedor
  2. Buscar usuario por ID social
  3. Si no existe, buscar por email
  4. Si existe email, vincular cuenta social automáticamente
  5. Si no existe, crear usuario nuevo
  6. Retornar JWT token

### 2.4 Nuevo Endpoint
**Modificar:** `backend/src/auth/auth.controller.ts`
```
POST /api/v1/auth/social
Body: { accessToken: string, provider: 'google' | 'facebook' }
Response: { user, access_token, token_type, expires_in }
```

### 2.5 Actualizar AuthModule
**Modificar:** `backend/src/auth/auth.module.ts`
- Agregar `HttpModule` para llamadas a APIs externas
- Agregar `SocialAuthService` a providers

---

## 3. Mobile App (React Native/Expo)

### 3.1 Instalar Dependencias
```bash
npx expo install expo-auth-session expo-crypto expo-web-browser
```

### 3.2 Configuración OAuth
**Modificar:** `mobile/app.config.js`
- Agregar variables: `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`, `FACEBOOK_APP_ID`
- Configurar URL schemes para OAuth callbacks

### 3.3 Nuevo Hook
**Crear:** `mobile/src/hooks/useSocialAuth.ts`
- `useAuthRequest` de Google
- `useAuthRequest` de Facebook
- `loginWithGoogle()`: Inicia flujo OAuth de Google
- `loginWithFacebook()`: Inicia flujo OAuth de Facebook
- Manejo de estados: loading, error

### 3.4 Actualizar AuthService
**Modificar:** `mobile/src/services/auth.service.ts`
- Agregar tipo `SocialLoginRequest`
- Agregar método `socialLogin(socialData)`

### 3.5 Actualizar API Config
**Modificar:** `mobile/src/config/api.config.ts`
- Agregar endpoint `AUTH.SOCIAL: '/auth/social'`

### 3.6 Actualizar AuthContext
**Modificar:** `mobile/src/contexts/AuthContext.tsx`
- Agregar `socialLogin` al contexto
- Implementar dispatch para login social

### 3.7 Actualizar LoginScreen
**Modificar:** `mobile/src/screens/auth/LoginScreen.tsx`
- Importar `useSocialAuth` hook
- Conectar botones de Facebook/Google con handlers reales
- Reemplazar emojis por iconos de Ionicons (`logo-facebook`, `logo-google`)
- Agregar estados de loading y manejo de errores con Toast

---

## 4. Variables de Entorno

### Backend (`backend/.env`)
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
```

### Mobile (`mobile/.env.development`)
```
GOOGLE_WEB_CLIENT_ID=
GOOGLE_IOS_CLIENT_ID=
GOOGLE_ANDROID_CLIENT_ID=
FACEBOOK_APP_ID=
```

---

## 5. Archivos a Modificar/Crear

| Acción | Archivo |
|--------|---------|
| Modificar | `backend/src/database/entities/user.entity.ts` |
| Crear | `backend/src/database/migrations/XXXX-AddSocialLoginFields.ts` |
| Crear | `backend/src/auth/dto/social-login.dto.ts` |
| Crear | `backend/src/auth/services/social-auth.service.ts` |
| Modificar | `backend/src/auth/auth.service.ts` |
| Modificar | `backend/src/auth/auth.controller.ts` |
| Modificar | `backend/src/auth/auth.module.ts` |
| Crear | `mobile/src/hooks/useSocialAuth.ts` |
| Modificar | `mobile/src/services/auth.service.ts` |
| Modificar | `mobile/src/config/api.config.ts` |
| Modificar | `mobile/src/contexts/AuthContext.tsx` |
| Modificar | `mobile/src/screens/auth/LoginScreen.tsx` |
| Modificar | `mobile/app.config.js` |
| Modificar | `mobile/locales/es.json` (traducciones) |

---

## 6. Estrategia de Vinculación de Cuentas

| Escenario | Acción |
|-----------|--------|
| Email nuevo | Crear cuenta social nueva |
| Email existe + sin social | Vincular social a cuenta existente (automático) |
| Email existe + otro provider | Error: "Cuenta vinculada a [provider]" |
| Social ID ya vinculado | Login directo |

---

## 7. Verificación

1. **Backend:**
   - Probar endpoint `/auth/social` con tokens válidos de Google/Facebook
   - Verificar creación de usuario en DB con campos sociales
   - Verificar vinculación de cuenta existente

2. **Mobile:**
   - Probar flujo completo en iOS Simulator
   - Probar flujo completo en Android Emulator
   - Verificar cancelación de login
   - Verificar manejo de errores de red

3. **Integración:**
   - Usuario nuevo con Google → Login exitoso
   - Usuario nuevo con Facebook → Login exitoso
   - Usuario existente (email/password) + Google → Vinculación exitosa automática
   - Verificar que email/password sigue funcionando

---

## 8. Configuración de Proveedores OAuth

### Google Cloud Console
1. Ir a https://console.cloud.google.com/apis/credentials
2. Crear proyecto o seleccionar existente
3. Crear credenciales OAuth 2.0:
   - Web Client ID (para desarrollo)
   - iOS Client ID (bundle: com.gshop.app)
   - Android Client ID (package: com.gshop.app, SHA-1 fingerprint)
4. Configurar pantalla de consentimiento OAuth
5. Habilitar Google+ API

### Facebook Developer Console
1. Ir a https://developers.facebook.com/apps/
2. Crear app o seleccionar existente
3. Agregar producto "Facebook Login"
4. Configurar:
   - Valid OAuth Redirect URIs
   - Bundle ID (iOS)
   - Package Name + Key Hash (Android)
5. Obtener App ID y App Secret
