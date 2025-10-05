# 📂 Categories Screen Implementation Plan

## 🎯 Objetivo
Implementar una pantalla de categorías completamente funcional con navegación jerárquica, búsqueda y filtros.

---

## 📋 Estado Actual
- ✅ CategoriesScreen existe pero solo muestra "Coming soon"
- ✅ Datos de categorías disponibles en backend (7 categorías con jerarquía)
- ⏳ Servicios y navegación por implementar

---

## 🗃️ Datos Disponibles

### Categorías Existentes (desde seed):
```
Electronics (parent)
├── Smartphones
└── Laptops

Fashion (parent)
├── Men's Clothing
└── Women's Clothing

Home & Garden (parent)
```

---

## 📋 Checklist de Implementación

### 1. 🔧 Servicio de Categorías
**Status:** ⏳ Pendiente
**Archivos:** `categories.service.ts` (crear)

#### Tareas:
- [ ] Crear `src/services/categories.service.ts`
- [ ] Implementar métodos del servicio:
  - `getAllCategories()` - GET /api/v1/categories
  - `getCategoryDetails(id)` - GET /api/v1/categories/{id}
  - `getCategoryProducts(id, filters)` - GET /api/v1/categories/{id}/products
  - `getSubcategories(parentId)` - GET /api/v1/categories?parent={id}

#### Código del Servicio:
```typescript
// src/services/categories.service.ts
import { apiClient, ApiResponse } from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  icon?: string;
  parentId?: string;
  children?: Category[];
  productsCount?: number;
  isActive: boolean;
  sortOrder: number;
}

export interface CategoryDetails extends Category {
  breadcrumb: Category[];
  featuredProducts?: Product[];
}

class CategoriesService {
  // Get all root categories
  async getAllCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
  }

  // Get category details with subcategories
  async getCategoryDetails(id: string): Promise<CategoryDetails> {
    const response = await apiClient.get<CategoryDetails>(`/categories/${id}`);
    return response.data;
  }

  // Get products in category
  async getCategoryProducts(
    categoryId: string,
    params?: {
      page?: number;
      limit?: number;
      sort?: string;
      minPrice?: number;
      maxPrice?: number;
    }
  ): Promise<PaginatedProducts> {
    const query = new URLSearchParams(params as any);
    const response = await apiClient.get<PaginatedProducts>(
      `/categories/${categoryId}/products?${query}`
    );
    return response.data;
  }

  // Get subcategories
  async getSubcategories(parentId: string): Promise<Category[]> {
    const response = await apiClient.get<Category[]>(
      `/categories?parent=${parentId}`
    );
    return response.data;
  }
}

export const categoriesService = new CategoriesService();
```

---

### 2. 📱 Actualizar CategoriesScreen
**Status:** ⏳ Pendiente
**Archivos:** `CategoriesScreen.tsx`

#### Tareas:
- [ ] Implementar grid de categorías con imágenes/iconos
- [ ] Agregar contador de productos por categoría
- [ ] Implementar navegación a subcategorías
- [ ] Agregar barra de búsqueda de categorías
- [ ] Implementar loading states
- [ ] Agregar pull-to-refresh
- [ ] Mostrar categorías destacadas en la parte superior

#### Diseño de la Pantalla:
```
┌─────────────────────────────┐
│ Categories        [🔍]      │
├─────────────────────────────┤
│                             │
│ 🌟 Featured Categories      │
│ ┌────┐ ┌────┐ ┌────┐       │
│ │ 📱 │ │ 👕 │ │ 🏠 │       │
│ └────┘ └────┘ └────┘       │
│                             │
│ All Categories              │
│ ┌─────────────────────┐    │
│ │ 📱 Electronics       │    │
│ │ 125 products     >   │    │
│ └─────────────────────┘    │
│ ┌─────────────────────┐    │
│ │ 👕 Fashion           │    │
│ │ 89 products      >   │    │
│ └─────────────────────┘    │
│                             │
└─────────────────────────────┘
```

#### Código Ejemplo:
```typescript
export default function CategoriesScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (category: Category) => {
    if (category.children && category.children.length > 0) {
      // Navigate to subcategories
      navigation.navigate('Subcategories', {
        categoryId: category.id,
        categoryName: category.name
      });
    } else {
      // Navigate to products
      navigation.navigate('CategoryProducts', {
        categoryId: category.id,
        categoryName: category.name
      });
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search categories..."
        />
      </View>

      {/* Categories Grid */}
      <FlatList
        data={filteredCategories}
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            onPress={() => handleCategoryPress(item)}
          />
        )}
        numColumns={2}
        refreshing={loading}
        onRefresh={loadCategories}
      />
    </SafeAreaView>
  );
}
```

---

### 3. 🆕 Crear SubcategoriesScreen
**Status:** ⏳ Pendiente
**Archivos:** `SubcategoriesScreen.tsx` (crear)

#### Tareas:
- [ ] Crear `src/screens/categories/SubcategoriesScreen.tsx`
- [ ] Mostrar breadcrumb navigation (Electronics > Smartphones)
- [ ] Grid de subcategorías
- [ ] Botón "View All Products" para categoría padre
- [ ] Navegación a productos de subcategoría

#### Diseño:
```
┌─────────────────────────────┐
│ < Electronics               │
├─────────────────────────────┤
│                             │
│ [View All Electronics]      │
│                             │
│ Subcategories               │
│ ┌──────────┐ ┌──────────┐  │
│ │📱        │ │💻        │  │
│ │Smartphones│ │Laptops  │  │
│ │25 items  │ │15 items │  │
│ └──────────┘ └──────────┘  │
│                             │
└─────────────────────────────┘
```

---

### 4. 🆕 Crear CategoryProductsScreen
**Status:** ⏳ Pendiente
**Archivos:** `CategoryProductsScreen.tsx` (crear)

#### Tareas:
- [ ] Crear `src/screens/categories/CategoryProductsScreen.tsx`
- [ ] Mostrar breadcrumb (Electronics > Smartphones)
- [ ] Grid/List de productos filtrados por categoría
- [ ] Filtros de precio, rating, disponibilidad
- [ ] Opciones de ordenamiento (precio, popularidad, recientes)
- [ ] Paginación infinita
- [ ] Empty state cuando no hay productos

#### Features:
- **Filtros:**
  - Precio (min-max slider)
  - Rating (estrellas)
  - Availability (in stock/all)
  - Brands (si aplica)

- **Sort Options:**
  - Price: Low to High
  - Price: High to Low
  - Newest First
  - Most Popular
  - Highest Rated

#### Código Ejemplo:
```typescript
export default function CategoryProductsScreen({ route }) {
  const { categoryId, categoryName } = route.params;
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 10000000,
    sort: 'popular',
  });
  const [page, setPage] = useState(1);

  const loadProducts = async () => {
    const data = await categoriesService.getCategoryProducts(
      categoryId,
      { ...filters, page }
    );
    setProducts(prev => [...prev, ...data.items]);
  };

  return (
    <View style={styles.container}>
      {/* Breadcrumb */}
      <Breadcrumb path={['Home', 'Electronics', categoryName]} />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Products Grid */}
      <FlatList
        data={products}
        renderItem={({ item }) => <ProductCard product={item} />}
        numColumns={2}
        onEndReached={() => setPage(p => p + 1)}
      />
    </View>
  );
}
```

---

### 5. 🎨 Componentes Reutilizables
**Status:** ⏳ Pendiente
**Archivos:** Crear en `src/components/categories/`

#### Componentes a Crear:

**CategoryCard.tsx**
```typescript
interface CategoryCardProps {
  category: Category;
  onPress: () => void;
}
```
- Imagen/icono de categoría
- Nombre
- Contador de productos
- Indicador de subcategorías (chevron)

**Breadcrumb.tsx**
```typescript
interface BreadcrumbProps {
  path: string[];
  onNavigate?: (index: number) => void;
}
```
- Home > Electronics > Smartphones
- Clickeable navigation

**FilterModal.tsx**
```typescript
interface FilterModalProps {
  visible: boolean;
  filters: ProductFilters;
  onApply: (filters: ProductFilters) => void;
  onClose: () => void;
}
```
- Price range slider
- Rating filter
- Stock filter
- Sort options

---

## 🔌 Backend Endpoints Necesarios

### Implementar en Backend:
```
GET  /api/v1/categories
     - Devuelve todas las categorías raíz
     - Include: subcategorías, contador de productos

GET  /api/v1/categories/{id}
     - Detalles de categoría específica
     - Include: breadcrumb, subcategorías, productos destacados

GET  /api/v1/categories/{id}/products
     - Productos en una categoría
     - Query params: page, limit, sort, minPrice, maxPrice, inStock
     - Paginación

GET  /api/v1/categories/search?q={query}
     - Búsqueda de categorías por nombre
```

---

## 🎯 Orden de Implementación

### Fase 1: Backend & Servicio (1-2 horas)
1. ✅ Verificar endpoints del backend
2. 🔧 Crear `categories.service.ts`
3. 🔧 Agregar TypeScript types
4. 🔧 Implementar error handling

### Fase 2: CategoriesScreen (2-3 horas)
1. 🔧 Diseñar layout con grid
2. 🔧 Implementar carga de datos
3. 🔧 Agregar búsqueda
4. 🔧 Implementar navegación
5. 🔧 Agregar loading/error states

### Fase 3: SubcategoriesScreen (1-2 horas)
1. 🔧 Crear pantalla
2. 🔧 Implementar breadcrumb
3. 🔧 Grid de subcategorías
4. 🔧 Navegación a productos

### Fase 4: CategoryProductsScreen (2-3 horas)
1. 🔧 Crear pantalla con grid de productos
2. 🔧 Implementar filtros
3. 🔧 Agregar sort options
4. 🔧 Implementar paginación infinita

### Fase 5: Componentes Reutilizables (1-2 horas)
1. 🔧 CategoryCard component
2. 🔧 Breadcrumb component
3. 🔧 FilterModal component
4. 🔧 SortSelector component

---

## 📝 Navegación a Actualizar

### Agregar a Stack Navigator:
```typescript
// src/navigation/MainNavigator.tsx
<Stack.Screen
  name="Subcategories"
  component={SubcategoriesScreen}
  options={({ route }) => ({
    title: route.params.categoryName
  })}
/>

<Stack.Screen
  name="CategoryProducts"
  component={CategoryProductsScreen}
  options={({ route }) => ({
    title: route.params.categoryName
  })}
/>
```

---

## ✅ Criterios de Aceptación

- [ ] Todas las categorías del backend se muestran correctamente
- [ ] Navegación jerárquica funciona (padre > hijo)
- [ ] Breadcrumb navigation implementado
- [ ] Búsqueda de categorías funcional
- [ ] Filtros de productos funcionan
- [ ] Paginación infinita implementada
- [ ] Loading/Error states implementados
- [ ] Pull-to-refresh funciona
- [ ] Imágenes de categorías se cargan correctamente
- [ ] Contadores de productos son precisos
- [ ] Transiciones suaves entre pantallas

---

## 🎨 Mejoras Futuras (Opcional)

### Nice to Have:
- [ ] Categorías favoritas del usuario
- [ ] Historial de categorías visitadas
- [ ] Sugerencias de categorías basadas en compras
- [ ] Categorías trending
- [ ] Animaciones de transición
- [ ] Gestos de swipe para navegar
- [ ] Modo de vista: Grid / List toggle
- [ ] Share category link

---

**Estimado total:** 7-12 horas de desarrollo
**Prioridad:** Alta (es un tab principal de navegación)
