# 🎯 Plan de Implementación: Registro de Afiliados para Usuarios

## 📋 Resumen Ejecutivo

Este documento describe la implementación completa del flujo de registro de afiliados que permite a usuarios de la app mobile solicitar convertirse en afiliados/creators de GSHOP.

**Estado Actual**:
- ✅ Backend tiene sistema completo de afiliados con aprobación por admin
- ✅ Mobile app tiene UI para afiliados ya aprobados
- ❌ No existe endpoint de registro público para nuevos afiliados
- ❌ Mobile app solo muestra alert placeholder en botón "Aplicar"

**Objetivo**:
Implementar flujo completo desde aplicación en mobile → revisión admin → aprobación/rechazo → activación de cuenta de afiliado.

---

## 🏗️ Arquitectura del Sistema

### Flujo de Registro Completo

```
┌─────────────────────────────────────────────────────────────┐
│ PASO 1: Usuario Mobile Aplica                               │
│ - Pantalla: AffiliateRegistrationScreen                     │
│ - Endpoint: POST /api/v1/creators/register                  │
│ - Status inicial: PENDING                                   │
│ - Recibe: JWT token para login inmediato                    │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ PASO 2: Admin Revisa Solicitud                              │
│ - Panel Admin: Lista de afiliados pendientes                │
│ - Endpoint: GET /api/v1/admin/creators?status=pending       │
│ - Admin ve: Perfil, datos bancarios, redes sociales         │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ PASO 3: Admin Aprueba/Rechaza                               │
│ - Aprobar: PUT /api/v1/admin/creators/:id/approve           │
│   • Status: PENDING → APPROVED                              │
│   • Notificación al afiliado                                │
│   • Puede empezar a ganar comisiones                        │
│                                                              │
│ - Rechazar: PUT /api/v1/admin/creators/:id/reject           │
│   • Status: PENDING → REJECTED                              │
│   • Razón de rechazo enviada                                │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ PASO 4: Afiliado Aprobado Accede a Funciones                │
│ - Crear videos con productos                                │
│ - Hacer live streams                                        │
│ - Generar links de afiliado                                 │
│ - Ver dashboard de ganancias                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes a Implementar

### 1. Backend (NestJS)

#### 1.1 DTO: CreateAffiliateDto
**Archivo**: `backend/src/affiliates/dto/create-affiliate.dto.ts`

```typescript
import { IsEmail, IsString, MinLength, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAffiliateDto {
  @ApiProperty({ example: 'creator@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'fashioncreator' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'María García' })
  @IsString()
  name: string;

  @ApiProperty({ example: '+57 300 123 4567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'https://fashionblog.com', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({
    example: '{"instagram": "@fashioncreator", "tiktok": "@fashionista"}',
    required: false
  })
  @IsOptional()
  @IsString()
  socialMedia?: string;

  @ApiProperty({
    example: 'Creadora de contenido especializada en moda y lifestyle',
    required: false
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: ['fashion', 'lifestyle'], required: false })
  @IsOptional()
  @IsArray()
  categories?: string[];

  @ApiProperty({ example: 'Bancolombia', required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ example: '1234567890', required: false })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiProperty({ example: 'AHORROS', required: false })
  @IsOptional()
  @IsString()
  bankAccountType?: string;
}
```

#### 1.2 Service: Método de Registro
**Archivo**: `backend/src/affiliates/affiliates.service.ts`

Agregar método:

```typescript
async registerAffiliate(createAffiliateDto: CreateAffiliateDto) {
  // 1. Validar email único
  const existingAffiliate = await this.affiliateRepository.findOne({
    where: { email: createAffiliateDto.email.toLowerCase() }
  });

  if (existingAffiliate) {
    throw new ConflictException('Email already registered');
  }

  // 2. Validar username único
  const existingUsername = await this.affiliateRepository.findOne({
    where: { username: createAffiliateDto.username }
  });

  if (existingUsername) {
    throw new ConflictException('Username already taken');
  }

  // 3. Hash password
  const passwordHash = await bcrypt.hash(createAffiliateDto.password, 10);

  // 4. Generar affiliateCode único
  const affiliateCode = `AFF-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

  // 5. Crear affiliate con status PENDING
  const affiliate = this.affiliateRepository.create({
    ...createAffiliateDto,
    email: createAffiliateDto.email.toLowerCase(),
    passwordHash,
    affiliateCode,
    status: AffiliateStatus.PENDING,
    commissionRate: 5.0, // Default 5%
    isActive: true,
    isProfilePublic: false, // Private until approved
  });

  const savedAffiliate = await this.affiliateRepository.save(affiliate);

  // 6. Generar JWT token
  const payload = {
    sub: savedAffiliate.id,
    email: savedAffiliate.email,
    role: 'affiliate',
    affiliateId: savedAffiliate.id,
  };

  const access_token = this.jwtService.sign(payload);

  // 7. Remover passwordHash de respuesta
  const { passwordHash: _, ...affiliateWithoutPassword } = savedAffiliate;

  return {
    affiliate: affiliateWithoutPassword,
    access_token,
    token_type: 'Bearer',
    expires_in: '7d',
  };
}
```

#### 1.3 Controller: Endpoint Público
**Archivo**: `backend/src/affiliates/creators.controller.ts`

Agregar endpoint (sin @UseGuards para que sea público):

```typescript
@Post('register')
@ApiOperation({ summary: 'Register as affiliate/creator (public endpoint)' })
@ApiResponse({ status: 201, description: 'Affiliate registered successfully with PENDING status' })
@ApiResponse({ status: 409, description: 'Email or username already exists' })
async registerAffiliate(@Body() createAffiliateDto: CreateAffiliateDto) {
  return this.affiliatesService.registerAffiliate(createAffiliateDto);
}
```

#### 1.4 Login para Afiliados
**Archivo**: `backend/src/auth/auth.service.ts`

Modificar método `login()` para soportar afiliados:

```typescript
async login(loginDto: LoginDto) {
  // Buscar primero en User
  let user = await this.userRepository.findOne({
    where: { email: loginDto.email.toLowerCase() }
  });

  let isAffiliate = false;

  // Si no existe en User, buscar en Affiliate
  if (!user) {
    const affiliate = await this.affiliateRepository.findOne({
      where: { email: loginDto.email.toLowerCase() }
    });

    if (affiliate && await bcrypt.compare(loginDto.password, affiliate.passwordHash)) {
      // Mapear affiliate a formato user para JWT
      user = {
        id: affiliate.id,
        email: affiliate.email,
        role: 'affiliate',
        // ... otros campos
      };
      isAffiliate = true;
    }
  }

  if (!user || (!isAffiliate && !(await bcrypt.compare(loginDto.password, user.password)))) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: isAffiliate ? 'affiliate' : user.role,
    ...(isAffiliate && { affiliateId: user.id })
  };

  return {
    user,
    access_token: this.jwtService.sign(payload),
    token_type: 'Bearer',
    expires_in: '7d',
  };
}
```

---

### 2. Mobile App (React Native)

#### 2.1 Screen: AffiliateRegistrationScreen
**Archivo**: `mobile/src/screens/affiliate/AffiliateRegistrationScreen.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GSInput } from '../../components/ui/GSInput';
import { GSButton } from '../../components/ui/GSButton';
import { GSText } from '../../components/ui/GSText';
import { affiliatesService } from '../../services/affiliates.service';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  name: string;
  phone: string;
  website: string;
  instagram: string;
  tiktok: string;
  bio: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountType: string;
}

export const AffiliateRegistrationScreen = () => {
  const { t } = useTranslation('translation');
  const navigation = useNavigation();
  const { login } = useAuth();
  const { theme } = useTheme();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    name: '',
    phone: '',
    website: '',
    instagram: '',
    tiktok: '',
    bio: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountType: 'AHORROS',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    // Validaciones básicas
    if (!formData.email || !formData.password || !formData.username || !formData.name) {
      Alert.alert(t('common.error'), t('affiliate.registration.fillRequired'));
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordMismatch'));
      return false;
    }

    if (formData.password.length < 8) {
      Alert.alert(t('common.error'), t('auth.passwordTooShort'));
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const socialMedia = JSON.stringify({
        instagram: formData.instagram,
        tiktok: formData.tiktok,
      });

      const response = await affiliatesService.registerAffiliate({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        name: formData.name,
        phone: formData.phone,
        website: formData.website,
        socialMedia,
        bio: formData.bio,
        bankName: formData.bankName,
        bankAccountNumber: formData.bankAccountNumber,
        bankAccountType: formData.bankAccountType,
      });

      // Login automático con el token recibido
      await login(response.affiliate, response.access_token);

      // Mostrar mensaje de éxito
      Alert.alert(
        t('common.success'),
        t('affiliate.registration.pendingApproval'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              // Navegar al dashboard de afiliados
              navigation.navigate('Affiliate');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Affiliate registration error:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('affiliate.registration.failed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <GSText variant="h1" style={styles.title}>
            {t('affiliate.registration.title')}
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.subtitle}>
            {t('affiliate.registration.subtitle')}
          </GSText>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Información Personal */}
          <GSText variant="h3" style={styles.sectionTitle}>
            {t('affiliate.registration.personalInfo')}
          </GSText>

          <GSInput
            label={t('affiliate.registration.fullName')}
            placeholder={t('affiliate.registration.enterFullName')}
            value={formData.name}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
            leftIcon={<Ionicons name="person" size={20} color={theme.colors.textSecondary} />}
          />

          <GSInput
            label={t('affiliate.registration.username')}
            placeholder={t('affiliate.registration.enterUsername')}
            value={formData.username}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, username: text }))}
            autoCapitalize="none"
            leftIcon={<Ionicons name="at" size={20} color={theme.colors.textSecondary} />}
          />

          <GSInput
            label={t('auth.email')}
            placeholder={t('auth.enterEmail')}
            value={formData.email}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail" size={20} color={theme.colors.textSecondary} />}
          />

          <GSInput
            label={t('auth.phone')}
            placeholder={t('auth.enterPhone')}
            value={formData.phone}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, phone: text }))}
            keyboardType="phone-pad"
            leftIcon={<Ionicons name="call" size={20} color={theme.colors.textSecondary} />}
          />

          <GSInput
            label={t('auth.password')}
            placeholder={t('auth.enterPassword')}
            value={formData.password}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, password: text }))}
            secureTextEntry={!showPassword}
            leftIcon={<Ionicons name="lock-closed" size={20} color={theme.colors.textSecondary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            }
          />

          <GSInput
            label={t('auth.confirmPassword')}
            placeholder={t('auth.confirmPassword')}
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, confirmPassword: text }))}
            secureTextEntry={!showConfirmPassword}
            leftIcon={<Ionicons name="lock-closed" size={20} color={theme.colors.textSecondary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            }
          />

          {/* Redes Sociales */}
          <GSText variant="h3" style={styles.sectionTitle}>
            {t('affiliate.registration.socialMedia')}
          </GSText>

          <GSInput
            label="Instagram"
            placeholder="@username"
            value={formData.instagram}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, instagram: text }))}
            autoCapitalize="none"
            leftIcon={<Ionicons name="logo-instagram" size={20} color={theme.colors.textSecondary} />}
          />

          <GSInput
            label="TikTok"
            placeholder="@username"
            value={formData.tiktok}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, tiktok: text }))}
            autoCapitalize="none"
            leftIcon={<Ionicons name="logo-tiktok" size={20} color={theme.colors.textSecondary} />}
          />

          <GSInput
            label={t('affiliate.registration.website')}
            placeholder="https://..."
            value={formData.website}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, website: text }))}
            autoCapitalize="none"
            keyboardType="url"
            leftIcon={<Ionicons name="globe" size={20} color={theme.colors.textSecondary} />}
          />

          <GSInput
            label={t('affiliate.registration.bio')}
            placeholder={t('affiliate.registration.enterBio')}
            value={formData.bio}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, bio: text }))}
            multiline
            numberOfLines={4}
            leftIcon={<Ionicons name="document-text" size={20} color={theme.colors.textSecondary} />}
          />

          {/* Información Bancaria */}
          <GSText variant="h3" style={styles.sectionTitle}>
            {t('affiliate.registration.bankInfo')}
          </GSText>

          <GSInput
            label={t('affiliate.registration.bankName')}
            placeholder="Bancolombia, Davivienda, etc."
            value={formData.bankName}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, bankName: text }))}
            leftIcon={<Ionicons name="business" size={20} color={theme.colors.textSecondary} />}
          />

          <GSInput
            label={t('affiliate.registration.accountNumber')}
            placeholder="1234567890"
            value={formData.bankAccountNumber}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, bankAccountNumber: text }))}
            keyboardType="number-pad"
            leftIcon={<Ionicons name="card" size={20} color={theme.colors.textSecondary} />}
          />

          {/* Submit Button */}
          <GSButton
            title={t('affiliate.registration.submit')}
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
            style={styles.submitButton}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <GSText variant="body" color="textSecondary" style={styles.footerText}>
              {t('affiliate.registration.terms')}
            </GSText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 32,
    marginBottom: 16,
  },
  footer: {
    marginTop: 16,
    marginBottom: 32,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
});
```

#### 2.2 Service: Método de Registro
**Archivo**: `mobile/src/services/affiliates.service.ts`

Agregar método:

```typescript
// Interface para request
export interface AffiliateRegistrationRequest {
  email: string;
  password: string;
  username: string;
  name: string;
  phone?: string;
  website?: string;
  socialMedia?: string;
  bio?: string;
  categories?: string[];
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountType?: string;
}

// Interface para response
export interface AffiliateRegistrationResponse {
  affiliate: {
    id: string;
    email: string;
    username: string;
    name: string;
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    // ... otros campos
  };
  access_token: string;
  token_type: string;
  expires_in: string;
}

// Método en AffiliatesService
async registerAffiliate(data: AffiliateRegistrationRequest): Promise<AffiliateRegistrationResponse> {
  try {
    const response = await api.post('/creators/register', data);
    return response.data;
  } catch (error) {
    console.error('Error registering affiliate:', error);
    throw error;
  }
}
```

#### 2.3 Modificar AffiliateScreen
**Archivo**: `mobile/src/screens/affiliate/AffiliateScreen.tsx`

Cambiar el handler del botón:

```typescript
const handleBecomeAffiliate = useCallback(() => {
  // Navegar a la pantalla de registro
  navigation.navigate('AffiliateRegistration');
}, [navigation]);
```

#### 2.4 Agregar a Navigation
**Archivo**: `mobile/src/navigation/HomeNavigator.tsx` o crear `AffiliateNavigator.tsx`

```typescript
// En el stack correspondiente
<Stack.Screen
  name="AffiliateRegistration"
  component={AffiliateRegistrationScreen}
  options={{ headerShown: false }}
/>
```

---

### 3. Translation Keys (i18n)

#### 3.1 Español
**Archivo**: `mobile/src/i18n/locales/es.json`

```json
{
  "affiliate": {
    "registration": {
      "title": "Registro de Afiliado",
      "subtitle": "Completa tu perfil para comenzar a ganar comisiones",
      "personalInfo": "Información Personal",
      "socialMedia": "Redes Sociales",
      "bankInfo": "Información Bancaria",
      "fullName": "Nombre completo",
      "enterFullName": "Ingresa tu nombre completo",
      "username": "Nombre de usuario",
      "enterUsername": "Elige un nombre de usuario único",
      "website": "Sitio web",
      "bio": "Biografía",
      "enterBio": "Cuéntanos sobre ti y tu contenido",
      "bankName": "Nombre del banco",
      "accountNumber": "Número de cuenta",
      "submit": "Enviar Solicitud",
      "fillRequired": "Por favor completa todos los campos requeridos",
      "pendingApproval": "¡Solicitud enviada! Tu cuenta está pendiente de aprobación por nuestro equipo. Te notificaremos cuando sea aprobada.",
      "failed": "Error al enviar la solicitud. Inténtalo de nuevo.",
      "terms": "Al registrarte, aceptas los términos y condiciones del programa de afiliados de GSHOP"
    }
  }
}
```

---

## 🔄 Flujo de Datos Completo

### Request: Usuario Registra en Mobile
```json
POST /api/v1/creators/register
{
  "email": "creator@example.com",
  "password": "SecurePass123!",
  "username": "fashioncreator",
  "name": "María García",
  "phone": "+57 300 123 4567",
  "website": "https://fashionblog.com",
  "socialMedia": "{\"instagram\":\"@fashioncreator\",\"tiktok\":\"@fashionista\"}",
  "bio": "Creadora de contenido de moda",
  "bankName": "Bancolombia",
  "bankAccountNumber": "1234567890",
  "bankAccountType": "AHORROS"
}
```

### Response: Backend Retorna
```json
{
  "affiliate": {
    "id": "uuid-abc-123",
    "email": "creator@example.com",
    "username": "fashioncreator",
    "name": "María García",
    "status": "pending",
    "commissionRate": 5.0,
    "affiliateCode": "AFF-1234567890-XYZ",
    "isActive": true,
    "isProfilePublic": false,
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": "7d"
}
```

### Mobile: Guarda Token y Navega
```typescript
// AuthContext recibe el token
await login(response.affiliate, response.access_token);

// Navega al dashboard
navigation.navigate('Affiliate');

// Dashboard detecta status PENDING y muestra mensaje
if (affiliate.status === 'pending') {
  return <PendingApprovalScreen />;
}
```

---

## 🎨 UX/UI Consideraciones

### Estado PENDING en AffiliateScreen
Cuando el afiliado tiene `status: 'pending'`, mostrar:

```typescript
if (dashboardStats?.status === 'pending') {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pendingContainer}>
        <Text style={styles.pendingIcon}>⏳</Text>
        <Text style={styles.pendingTitle}>{t('affiliate.pendingTitle')}</Text>
        <Text style={styles.pendingMessage}>
          {t('affiliate.pendingMessage')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
```

### Estado REJECTED
```typescript
if (dashboardStats?.status === 'rejected') {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.rejectedContainer}>
        <Text style={styles.rejectedIcon}>❌</Text>
        <Text style={styles.rejectedTitle}>{t('affiliate.rejectedTitle')}</Text>
        <Text style={styles.rejectedMessage}>
          {t('affiliate.rejectedMessage')}
        </Text>
        <GSButton
          title={t('affiliate.reapply')}
          onPress={() => {/* Lógica de re-aplicación */}}
        />
      </View>
    </SafeAreaView>
  );
}
```

---

## ✅ Checklist de Implementación

### Backend
- [ ] Crear `CreateAffiliateDto` con validaciones
- [ ] Implementar `affiliatesService.registerAffiliate()`
- [ ] Agregar endpoint `POST /creators/register` en controller
- [ ] Modificar `authService.login()` para soportar afiliados
- [ ] Agregar `JwtService` a `AffiliatesModule` imports
- [ ] Agregar `bcrypt` import en service
- [ ] Testing: Probar registro con datos válidos/inválidos
- [ ] Testing: Probar login de afiliado recién registrado
- [ ] Testing: Verificar que status sea PENDING

### Mobile App
- [ ] Crear `AffiliateRegistrationScreen.tsx`
- [ ] Agregar método `registerAffiliate()` en service
- [ ] Modificar `handleBecomeAffiliate()` en `AffiliateScreen`
- [ ] Agregar screen a navigation stack
- [ ] Crear translation keys en `es.json` (y `en.json`)
- [ ] Implementar vista de PENDING status
- [ ] Implementar vista de REJECTED status
- [ ] Testing: Probar flujo completo de registro
- [ ] Testing: Validación de formulario
- [ ] Testing: Manejo de errores (email duplicado, username duplicado)

### Admin Panel (Opcional pero recomendado)
- [ ] Agregar sección "Afiliados Pendientes" en dashboard
- [ ] Mostrar notificación badge con cantidad pending
- [ ] Vista detalle de solicitud de afiliado
- [ ] Botones de aprobar/rechazar con confirmación

---

## 🔐 Consideraciones de Seguridad

1. **Password Hashing**: Usar bcrypt con 10 rounds (ya implementado)
2. **Email Validation**: Lowercase y unique constraint
3. **Username Validation**: Unique constraint y sanitización
4. **Rate Limiting**: Implementar rate limit en endpoint de registro
5. **Email Verification** (opcional): Enviar email de verificación antes de aprobar

---

## 📊 Métricas de Éxito

- Tiempo promedio de aprobación < 24 horas
- Tasa de aprobación > 70%
- Tasa de conversión usuario → afiliado registrado > 15%
- Satisfacción de nuevos afiliados > 4/5

---

## 🚀 Próximos Pasos Post-Implementación

1. **Email Notifications**: Enviar emails cuando cambia status
2. **Push Notifications**: Notificar en app cuando se aprueba/rechaza
3. **Re-aplicación**: Permitir re-aplicar después de rechazo
4. **KYC Mejorado**: Agregar verificación de identidad
5. **Onboarding**: Tutorial para nuevos afiliados aprobados
6. **Analytics**: Tracking de funnel de registro

---

## 📝 Notas Técnicas

### Diferencias con Seller Registration
- **Sellers**: Tienen tabla `User` + tabla `Seller` (duplicación)
- **Affiliates**: Tabla única `Affiliate` (más limpio)
- **Affiliates**: No necesitan campos de empresa/documentos como sellers

### JWT Payload para Afiliados
```json
{
  "sub": "affiliate-uuid",
  "email": "creator@example.com",
  "role": "affiliate",
  "affiliateId": "affiliate-uuid"
}
```

### Database Migration
No se requiere migración - `affiliate.entity.ts` ya tiene todos los campos necesarios.

---

**Documento creado**: 2024-01-15
**Versión**: 1.0
**Autor**: Claude (Miyu) 💙
