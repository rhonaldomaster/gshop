# 📱 Home Screen Functionality Implementation Plan

## 🎯 Objetivo
Hacer que todos los elementos de la pantalla Home sean completamente funcionales, incluyendo búsqueda, categorías, productos y quick actions.

---

## 🗃️ Setup Inicial: Datos de Prueba

**IMPORTANTE:** Antes de empezar con la implementación, necesitas poblar la base de datos con datos de prueba.

### Comando para Seed
```bash
npm run db:seed
```

### Datos que se crearán:

#### 👥 Usuarios de Prueba
- **Admin:** `john@doe.com` / `johndoe123`
- **Seller:** `seller@gshop.com` / `seller123`
- **Buyer:** `buyer@gshop.com` / `buyer123`
- **Test User (ya creado):** `test@test.com` / `123456`

#### 📂 Categorías
- **Electronics** (con subcategorías: Smartphones, Laptops)
- **Fashion** (con subcategorías: Men's Clothing, Women's Clothing)
- **Home & Garden**

#### 🛍️ Productos de Prueba
1. **iPhone 15 Pro Max** - $1,299,999.99 ARS
   - Categoría: Smartphones
   - 25 unidades en stock
   - Variantes: Color (4 opciones), Storage (3 opciones)
   - Imágenes reales desde URLs

2. **MacBook Air 15" M3** - $1,749,999.99 ARS
   - Categoría: Laptops
   - 15 unidades en stock
   - Variantes: Color (4 opciones), Memory (3 opciones), Storage (4 opciones)

3. **Premium Cotton T-Shirt** - $15,999.99 ARS
   - Categoría: Men's Clothing
   - 100 unidades en stock
   - Variantes: Size (6 opciones), Color (5 opciones)

#### 💰 Comisiones Configuradas
- Platform Fee: 7%
- Seller Premium: 2%
- Referral Bonus: 1%

### Verificar Datos
```bash
# Contar productos
psql -d gshop_db -c "SELECT COUNT(*) FROM product;"

# Ver productos
psql -d gshop_db -c "SELECT id, name, price FROM product;"

# Ver categorías
psql -d gshop_db -c "SELECT id, name, slug FROM category;"
```

---

## 📋 Checklist de Implementación

### 1. 🔍 Búsqueda Funcional
**Status:** ✅ Completado
**Archivos:** `HomeScreen.tsx`, `SearchScreen.tsx`, `products.service.ts`

#### Tareas:
- [x] Conectar botón de búsqueda con navegación a SearchScreen
- [x] Implementar servicio de búsqueda de productos en `products.service.ts`
  - Endpoint: `GET /api/v1/products/search?search={query}`
  - Soporte para filtros (categoría, precio, rating)
- [x] Actualizar SearchScreen para:
  - Mostrar resultados reales desde API
  - Implementar búsqueda en tiempo real (debounce 300ms)
  - Agregar filtros avanzados (precio, categoría, rating)
  - Mostrar estado de loading y empty state
  - Manejar errores de red

#### Código necesario:
```typescript
// En HomeScreen.tsx línea 73
<TouchableOpacity
  style={styles.searchButton}
  onPress={() => navigation.navigate('Search')}
>
  <Ionicons name="search" size={24} color="#6B7280" />
</TouchableOpacity>

// En products.service.ts
async searchProducts(query: string, filters?: ProductFilters): Promise<Product[]> {
  const params = new URLSearchParams({
    q: query,
    ...filters,
  });
  const response = await apiClient.get<Product[]>(`/products/search?${params}`);
  return response.data;
}
```

---

### 2. 📂 Categorías Clickeables
**Status:** ✅ Completado
**Archivos:** `HomeScreen.tsx`, `CategoryProductsScreen.tsx`, `products.service.ts`

#### Tareas:
- [x] Crear pantalla CategoryScreen para mostrar productos por categoría
- [x] Implementar navegación desde categorías en HomeScreen
- [x] Crear servicio para obtener productos por categoría
  - Endpoint: `GET /api/v1/products/category/{categoryId}`
- [x] Agregar paginación para resultados de categoría
- [x] Implementar "View All" para mostrar todas las categorías
- [x] Sincronizar categorías con backend (categorías reales desde API)

#### Estructura CategoryScreen:
```typescript
// Crear: src/screens/categories/CategoryScreen.tsx
interface CategoryScreenProps {
  route: { params: { categoryId: string; categoryName: string } }
}

// Features:
- Header con nombre de categoría
- Grid de productos filtrados
- Filtros de precio y rating
- Paginación infinita
- Pull to refresh
```

---

### 3. 🛍️ Detalles de Productos
**Status:** ✅ Completado
**Archivos:** `HomeScreen.tsx`, `ProductDetailScreen.tsx`, `products.service.ts`

#### Tareas:
- [x] Conectar cards de productos con navegación a ProductDetailScreen
- [x] Implementar servicio para obtener detalles de producto
  - Endpoint: `GET /api/v1/products/:id`
- [x] Actualizar ProductDetailScreen para:
  - Mostrar información completa del producto
  - Galería de imágenes con carousel
  - Botón "Add to Cart" funcional
  - Reviews y ratings
  - Productos relacionados
  - Opciones de envío
  - Descripción expandible

#### Código necesario:
```typescript
// En HomeScreen.tsx línea 143
<TouchableOpacity
  style={styles.productCard}
  onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
>
  {/* ... producto card ... */}
</TouchableOpacity>

// En products.service.ts
async getProductDetails(productId: string): Promise<ProductDetails> {
  const response = await apiClient.get<ProductDetails>(`/products/${productId}`);
  return response.data;
}
```

---

### 4. ⚡ Quick Actions Funcionales
**Status:** ✅ Completado
**Archivos:** `HomeScreen.tsx`, pantallas existentes

#### Tareas:
- [x] **My Orders** (línea 263)
  - Navegar a OrdersScreen
  - Mostrar historial de órdenes del usuario

- [x] **Wishlist** (línea 273)
  - Navegar a WishlistScreen
  - Mostrar productos guardados

- [x] **Payments** (línea 283)
  - Navegar a PaymentMethodsScreen
  - Mostrar métodos de pago guardados

#### Código necesario:
```typescript
// En HomeScreen.tsx
const navigation = useNavigation();

// My Orders
<TouchableOpacity
  style={styles.quickAction}
  onPress={() => navigation.navigate('Orders')}
>

// Wishlist
<TouchableOpacity
  style={styles.quickAction}
  onPress={() => navigation.navigate('Wishlist')}
>

// Payments
<TouchableOpacity
  style={styles.quickAction}
  onPress={() => navigation.navigate('PaymentMethods')}
>
```

---

### 5. 🎨 Hero Banner "Shop Now"
**Status:** ✅ Completado
**Archivos:** `HomeScreen.tsx`

#### Tareas:
- [x] Implementar navegación del botón "Shop Now" (línea 139)
- [x] Opciones:
  - Navegar a categoría destacada
  - Navegar a página de ofertas/sale
  - Navegar a productos trending (implementado)

#### Código necesario:
```typescript
<GSButton
  title="Shop Now"
  variant="secondary"
  size="medium"
  fullWidth={false}
  style={styles.heroButton}
  onPress={() => navigation.navigate('Sale')} // o 'Trending'
/>
```

---

### 6. 🔗 "View All" Links
**Status:** ✅ Completado
**Archivos:** `HomeScreen.tsx`

#### Tareas:
- [x] Implementar "View All" para categorías (línea 153)
  - Navegar a pantalla de todas las categorías

- [x] Implementar "View All" para productos destacados (línea 199)
  - Navegar a pantalla de todos los productos o productos destacados (Trending)

#### Código necesario:
```typescript
// View All Categorías
<TouchableOpacity onPress={() => navigation.navigate('AllCategories')}>
  <GSText variant="body" style={{ color: theme.colors.primary }}>
    View All
  </GSText>
</TouchableOpacity>

// View All Productos
<TouchableOpacity onPress={() => navigation.navigate('AllProducts', { filter: 'featured' })}>
  <GSText variant="body" style={{ color: theme.colors.primary }}>
    View All
  </GSText>
</TouchableOpacity>
```

---

## 🏗️ Nuevas Pantallas Necesarias

### 1. CategoryScreen.tsx
- **Ruta:** `src/screens/categories/CategoryScreen.tsx`
- **Props:** `{ categoryId, categoryName }`
- **Features:** Grid de productos, filtros, paginación

### 2. AllCategoriesScreen.tsx
- **Ruta:** `src/screens/categories/AllCategoriesScreen.tsx`
- **Features:** Lista completa de categorías con imágenes

### 3. SaleScreen.tsx / TrendingScreen.tsx
- **Ruta:** `src/screens/products/SaleScreen.tsx`
- **Features:** Productos en oferta con countdown timer

---

## 🔌 API Endpoints Necesarios

### Backend debe implementar:
```
GET  /api/v1/products/search?q={query}&category={id}&minPrice={price}&maxPrice={price}
GET  /api/v1/products?category={categoryId}&page={page}&limit={limit}
GET  /api/v1/products/{id}
GET  /api/v1/products/trending
GET  /api/v1/products/featured
GET  /api/v1/categories
GET  /api/v1/categories/{id}/products
```

---

## 📦 Servicios a Actualizar

### `products.service.ts`
```typescript
class ProductsService {
  // ✅ Ya existe
  async getProducts(params?: ProductQueryParams): Promise<Product[]>

  // 🆕 Agregar
  async searchProducts(query: string, filters?: ProductFilters): Promise<Product[]>
  async getProductDetails(id: string): Promise<ProductDetails>
  async getProductsByCategory(categoryId: string, page?: number): Promise<PaginatedProducts>
  async getTrendingProducts(): Promise<Product[]>
  async getFeaturedProducts(): Promise<Product[]>
  async getRelatedProducts(productId: string): Promise<Product[]>
}
```

### `categories.service.ts` (crear)
```typescript
class CategoriesService {
  async getAllCategories(): Promise<Category[]>
  async getCategoryDetails(id: string): Promise<CategoryDetails>
  async getCategoryProducts(id: string, page?: number): Promise<PaginatedProducts>
}
```

---

## 🎯 Orden de Implementación Sugerido

### Fase 1: Navegación Básica (1-2 horas)
1. ✅ Conectar botón de búsqueda → SearchScreen
2. ✅ Conectar productos → ProductDetailScreen
3. ✅ Conectar Quick Actions → Pantallas existentes
4. ✅ Implementar useNavigation en HomeScreen

### Fase 2: Productos y Detalles (2-3 horas)
1. ✅ Actualizar ProductDetailScreen con datos reales
2. ✅ Implementar servicio getProductDetails
3. ✅ Agregar "Add to Cart" funcional
4. ✅ Mostrar productos relacionados

### Fase 3: Búsqueda (2-3 horas)
1. ✅ Implementar servicio searchProducts
2. ✅ Actualizar SearchScreen con resultados reales
3. ✅ Agregar filtros avanzados
4. ✅ Implementar debounce para búsqueda en tiempo real

### Fase 4: Categorías (2-3 horas)
1. ✅ Crear CategoryScreen
2. ✅ Implementar servicio de categorías
3. ✅ Conectar categorías → CategoryScreen
4. ✅ Crear AllCategoriesScreen

### Fase 5: Features Adicionales (1-2 horas)
1. ✅ Implementar hero banner navigation
2. ✅ Crear SaleScreen/TrendingScreen
3. ✅ Implementar "View All" links
4. ✅ Agregar pull-to-refresh en Home

---

## 📝 Notas de Implementación

### Consideraciones:
- Usar `useNavigation` hook de React Navigation
- Mantener TypeScript strict mode
- Implementar loading states con skeleton screens
- Agregar error handling con fallback UI
- Usar el hook `useProducts` existente donde sea posible
- Implementar optimistic updates para mejor UX
- Agregar analytics tracking para eventos de navegación

### Performance:
- Implementar paginación infinita para listados
- Usar FlatList con optimizaciones (windowSize, maxToRenderPerBatch)
- Cachear resultados de búsqueda con AsyncStorage
- Lazy load de imágenes con placeholder

### UX:
- Agregar animaciones de transición entre pantallas
- Implementar gestos de swipe (back, refresh)
- Mostrar estados vacíos con ilustraciones
- Agregar haptic feedback en iOS

---

## ✅ Criterios de Aceptación

- [x] Todos los botones y elementos clickeables tienen funcionalidad
- [x] Navegación fluida sin crashes
- [x] Datos reales desde API (no mock data)
- [x] Estados de loading, error y vacío implementados
- [x] Imágenes de productos se cargan correctamente
- [x] Búsqueda funciona en tiempo real
- [x] Filtros de categorías funcionan
- [x] Add to cart funciona desde detalles de producto
- [x] Quick actions navegan a pantallas correctas
- [x] No hay console warnings o errors

---

## 🚀 Estado Final

### ✅ IMPLEMENTACIÓN COMPLETADA AL 100%

Todas las fases del plan han sido completadas exitosamente:

1. ✅ **Fase 1:** Navegación Básica - Completada
2. ✅ **Fase 2:** Productos y Detalles - Completada
3. ✅ **Fase 3:** Búsqueda - Completada
4. ✅ **Fase 4:** Categorías - Completada
5. ✅ **Fase 5:** Features Adicionales - Completada

### 🔧 Correcciones Recientes (2025-10-05)
- Fixed backend search endpoint SQL error (tags field handling)
- Fixed parameter mapping (`query` → `search`)
- Fixed search input text visibility
- Fixed Filters button vertical alignment

### 📊 Endpoints Verificados
- ✅ `GET /api/v1/products/search` - Working
- ✅ `GET /api/v1/products/trending` - Working
- ✅ `GET /api/v1/products/categories` - Working
- ✅ `GET /api/v1/products/category/:id` - Working
- ✅ `GET /api/v1/products/:id` - Working

---

**Última actualización:** 2025-10-05
**Estado:** ✅ Completado
**Tiempo real de desarrollo:** ~10 horas
