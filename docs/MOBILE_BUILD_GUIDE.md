# GSHOP Mobile - Guia de Instalacion

Guia paso a paso para instalar la app GSHOP en tu telefono.

**Compatible con**: macOS, Windows, Linux

---

## Variables de Entorno (Importante)

Las variables de entorno (API URL, keys, etc.) estan en archivos `.env`. Dependiendo del metodo de build, debes configurarlas diferente.

### Archivos disponibles

```
mobile/
├── .env.development    # Variables para desarrollo
├── .env.production     # Variables para produccion (crear si no existe)
└── .env                # Variables que EAS Build usa automaticamente
```

### Configurar API URL para el APK (MUY IMPORTANTE)

Las variables de `.env` no siempre se cargan correctamente durante el build. Para asegurarte de que el APK use la URL correcta de tu backend, **debes modificar directamente `app.config.js`**.

**Archivo:** `mobile/app.config.js` (lineas 107 y 109)

```javascript
extra: {
  // ...
  API_BASE_URL: process.env.API_BASE_URL || 'https://TU-URL-AQUI.ngrok-free.app',
  // ...
  WEBSOCKET_URL: process.env.WEBSOCKET_URL || 'https://TU-URL-AQUI.ngrok-free.app',
  // ...
}
```

**Ejemplo con ngrok:**
```javascript
API_BASE_URL: process.env.API_BASE_URL || 'https://00de96316117.ngrok-free.app',
WEBSOCKET_URL: process.env.WEBSOCKET_URL || 'https://00de96316117.ngrok-free.app',
```

> **Nota**: Cada vez que reinicies ngrok, la URL cambia. Debes actualizar `app.config.js` y regenerar el APK.

### Para Expo Go (Metodo 1)

Las variables se cargan automaticamente desde `.env.development`. No necesitas hacer nada extra.

### Para EAS Build (Metodo 2)

EAS Build **NO** lee `.env.development`. Tienes 3 opciones:

**Opcion A: Copiar archivo (Recomendado para desarrollo)**

```bash
cd mobile
cp .env.development .env
```

EAS encuentra `.env` automaticamente.

**Opcion B: Usar EAS Secrets (Recomendado para produccion)**

```bash
# Agregar cada variable como secreto
eas secret:create --name API_BASE_URL --value "https://api.gshop.com"
eas secret:create --name STRIPE_PUBLISHABLE_KEY --value "pk_live_xxx"

# Ver secretos existentes
eas secret:list
```

**Opcion C: Configurar en eas.json**

Edita `mobile/eas.json` y agrega las variables:

```json
{
  "build": {
    "preview": {
      "env": {
        "API_BASE_URL": "https://api.gshop.com",
        "ENV": "development"
      }
    }
  }
}
```

### Para Build Local (Metodo 3)

Copia el archivo antes de compilar:

```bash
cd mobile
cp .env.development .env
npx expo prebuild --platform android
```

### Resumen rapido

| Metodo | Que hacer |
|--------|-----------|
| Expo Go | Nada, usa `.env.development` automaticamente |
| EAS Build (dev) | `cp .env.development .env` |
| EAS Build (prod) | Usar `eas secret:create` |
| Build Local | `cp .env.development .env` |

---

## Metodo 1: Expo Go (El mas facil - Para desarrollo)

Este metodo te permite probar la app en minutos sin compilar nada.

### Paso 1: Descargar Expo Go en tu telefono

- **Android**: Busca "Expo Go" en Play Store e instala
- **iPhone**: Busca "Expo Go" en App Store e instala

### Paso 2: Iniciar el servidor

Abre la terminal y ejecuta:

**macOS/Linux:**
```bash
cd ~/projects/gshop/mobile
npm start
```

**Windows (PowerShell o CMD):**
```bash
cd C:\ruta\a\tu\proyecto\gshop\mobile
npm start
```

### Paso 3: Conectar tu telefono

1. Aparecera un codigo QR en la terminal
2. **Android**: Abre Expo Go y escanea el QR
3. **iPhone**: Abre la camara y escanea el QR

¡Listo! La app se abrira en tu telefono.

> **Nota**: Tu telefono y tu Mac deben estar en la misma red WiFi.

---

## Metodo 2: APK para Android (App instalable)

Este metodo genera un archivo APK que puedes instalar permanentemente.

### Paso 1: Instalar EAS (solo la primera vez)

```bash
npm install -g eas-cli
```

### Paso 2: Crear cuenta en Expo (solo la primera vez)

1. Ve a https://expo.dev/signup
2. Crea una cuenta gratis
3. En la terminal, inicia sesion:

```bash
eas login
```

Te pedira tu email y contrasena de Expo.

### Paso 3: Generar el APK

```bash
cd /Users/rhonalf.martinez/projects/gshop/mobile
eas build --platform android --profile preview
```

Esto tomara unos 10-15 minutos. Veras algo como:

```
Build details: https://expo.dev/accounts/tu-usuario/projects/gshop/builds/xxxxx
```

### Paso 4: Descargar e instalar

1. Cuando termine, te dara un link para descargar el APK
2. Abre ese link en tu telefono Android
3. Descarga el archivo
4. Toca el archivo descargado para instalar

> **Nota**: Si te dice "instalacion bloqueada", ve a Ajustes > Seguridad > habilita "Fuentes desconocidas" o "Instalar apps desconocidas".

---

## Metodo 3: Build Local Android (Sin cuenta Expo)

Si no quieres crear cuenta en Expo o no quieres esperar la cola de EAS, puedes compilar localmente.

### Requisitos previos

Necesitas tener instalado:
- Android Studio (https://developer.android.com/studio)
- Java 11+ (Android Studio incluye Java 21 que funciona perfectamente)

### Paso 1: Configurar JAVA_HOME

Android Studio incluye su propio JDK. Usaremos ese.

**macOS:**
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

Para hacerlo permanente, agrega esa linea a tu `~/.zshrc` o `~/.bashrc`.

**Windows:**
1. Busca "Variables de entorno" en el menu inicio
2. Click en "Variables de entorno..."
3. En "Variables del sistema", agrega o edita:
   - `JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr`
   - `ANDROID_HOME` = `C:\Users\TU_USUARIO\AppData\Local\Android\Sdk`
4. Edita `Path` y agrega:
   - `%ANDROID_HOME%\platform-tools`
   - `%JAVA_HOME%\bin`

### Paso 2: Verificar Java

```bash
$JAVA_HOME/bin/java -version   # macOS/Linux
%JAVA_HOME%\bin\java -version  # Windows
```

Debe mostrar version 11 o superior.

### Paso 3: Configurar Android Studio

1. Abre Android Studio
2. Ve a Settings > Languages & Frameworks > Android SDK
3. Asegurate de tener instalado "Android SDK Build-Tools" y "Android SDK Platform 34"

### Paso 4: Instalar dependencias (IMPORTANTE)

El proyecto mobile debe instalarse **separado** del monorepo para evitar conflictos de versiones.

```bash
cd gshop/mobile
rm -rf node_modules package-lock.json
npm install
```

> **Nota**: El `mobile` fue removido de los npm workspaces del proyecto raiz para evitar conflictos de Metro bundler con admin-web.

### Paso 5: Generar el proyecto Android

```bash
cd gshop/mobile
rm -rf android  # Limpia cualquier build anterior
npx expo prebuild --platform android
```

### Paso 6: Compilar el APK

**macOS/Linux:**
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
cd android
./gradlew assembleRelease
```

**Windows (CMD o PowerShell):**
```bash
cd android
gradlew.bat assembleRelease
```

Esto tomara 15-20 minutos la primera vez. Builds posteriores seran mas rapidos (~5 min).

### Paso 7: Encontrar el APK

El archivo estara en:
```
mobile/android/app/build/outputs/apk/release/app-release.apk
```

Tamano aproximado: ~105 MB

### Paso 8: Instalar en tu telefono

**Opcion A: Con ADB (recomendado)**
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

**Opcion B: Transferencia manual**
1. Copia el APK a tu telefono (USB, Google Drive, email, etc.)
2. Abre el archivo en tu telefono
3. Toca "Instalar"

> **Nota**: Si te dice "instalacion bloqueada", ve a Ajustes > Seguridad > habilita "Instalar apps desconocidas" para tu app de archivos o navegador.

---

### Problemas comunes en Build Local

#### Error: "Package subpath './src/lib/TerminalReporter' is not defined"

Este error indica conflicto de versiones de Metro bundler. Solucion:

```bash
cd gshop/mobile
rm -rf node_modules package-lock.json android
npm install
npx expo prebuild --platform android
```

#### Error: "Missing classes detected while running R8"

Faltan reglas de ProGuard. Agrega esto a `android/app/proguard-rules.pro`:

```proguard
# Stripe Push Provisioning (optional feature)
-dontwarn com.stripe.android.pushProvisioning.**
-keep class com.stripe.android.pushProvisioning.** { *; }

# Amazon IVS Broadcast (Cronet)
-dontwarn org.chromium.net.**
-keep class org.chromium.net.** { *; }
```

#### Error: "Unable to resolve module expo-file-system/legacy"

Cambia el import en el archivo afectado:
```typescript
// Antes (incorrecto para SDK 52)
import * as FileSystem from 'expo-file-system/legacy';

// Despues (correcto)
import * as FileSystem from 'expo-file-system';
```

#### Build muy lento o se queda sin memoria

Agrega mas memoria a Gradle. Edita `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

#### Error: "JAVA_HOME is not set"

Asegurate de exportar JAVA_HOME antes de ejecutar gradlew:
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

---

## Para iPhone (iOS)

> **Nota**: Para compilar apps de iOS necesitas una Mac. Desde Windows solo puedes usar Expo Go o EAS Build (en la nube).

### Opcion A: Expo Go (Desarrollo) - Windows/Mac/Linux

Igual que el Metodo 1, pero escaneando el QR con la camara del iPhone.

### Opcion B: EAS Build (Desde Windows sin Mac)

Puedes generar el IPA en la nube sin necesidad de Mac:

```bash
cd gshop/mobile
eas build --platform ios --profile preview
```

Esto genera el build en servidores de Expo. Necesitas cuenta Apple Developer ($99/ano) para instalar en dispositivos fisicos.

### Opcion C: Dispositivo fisico con Xcode (Solo Mac)

Necesitas:
- Mac con Xcode instalado
- Cable USB para conectar el iPhone

```bash
cd gshop/mobile
npx expo prebuild --platform ios
npx expo run:ios --device
```

Selecciona tu iPhone de la lista.

### Opcion D: TestFlight (Para distribuir a otros)

Necesitas una cuenta Apple Developer ($99/ano).

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

---

## Resumen rapido

| Quiero... | Usa este metodo |
|-----------|-----------------|
| Probar rapido en mi Android | Metodo 1 (Expo Go) |
| Instalar APK en mi Android | Metodo 2 (EAS) |
| No quiero crear cuentas | Metodo 3 (Local) |
| Probar en iPhone | Metodo 1 (Expo Go) |
| App para App Store | Opcion C (TestFlight) |

---

## Problemas comunes

### "No se puede conectar al servidor"

- Verifica que tu telefono y Mac esten en la misma red WiFi
- Intenta con: `npm start -- --tunnel`

### "Build failed" en EAS

```bash
# Limpia el cache e intenta de nuevo
eas build --platform android --profile preview --clear-cache
```

### "Fuentes desconocidas" en Android

1. Ajustes del telefono
2. Busca "Instalar apps desconocidas" o "Fuentes desconocidas"
3. Permite instalar desde Chrome/Archivos

### El APK no se instala

- Verifica que tu telefono tenga Android 6.0 o superior
- Desinstala cualquier version anterior de GSHOP

---

## Comandos de referencia rapida

### macOS/Linux

```bash
# Desarrollo con Expo Go
cd mobile && npm start

# APK con EAS (necesita cuenta Expo)
cd mobile && eas build --platform android --profile preview

# APK local (necesita Android Studio)
cd mobile
rm -rf android node_modules package-lock.json
npm install
npx expo prebuild --platform android
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
cd android && ./gradlew assembleRelease

# El APK queda en: android/app/build/outputs/apk/release/app-release.apk

# iOS con Xcode (solo Mac)
cd mobile && npx expo run:ios --device
```

### Windows

```bash
# Desarrollo con Expo Go
cd mobile
npm start

# APK con EAS (necesita cuenta Expo)
cd mobile
eas build --platform android --profile preview

# APK local (necesita Android Studio)
cd mobile
rmdir /s /q android node_modules
del package-lock.json
npm install
npx expo prebuild --platform android
cd android
gradlew.bat assembleRelease

# El APK queda en: android\app\build\outputs\apk\release\app-release.apk
```

---

## Comparativa: Windows vs Mac

| Caracteristica | Windows | Mac |
|----------------|---------|-----|
| Expo Go (Android) | Si | Si |
| Expo Go (iOS) | Si | Si |
| APK local | Si | Si |
| EAS Build Android | Si | Si |
| EAS Build iOS | Si | Si |
| Build iOS local | No (necesita Xcode) | Si |
| Simulador iOS | No | Si |

**En resumen**: Desde Windows puedes hacer casi todo excepto compilar iOS localmente. Para eso usas EAS Build que compila en la nube.

---

¿Dudas? Preguntale a Miyu~
