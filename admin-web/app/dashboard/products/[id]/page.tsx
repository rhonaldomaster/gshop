'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  DollarSign,
  BarChart3,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { apiClient, formatCurrency, formatDate, getStatusColor } from '@/lib/api-client';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  basePrice: number;
  vatAmount: number;
  vatType: string;
  comparePrice?: number;
  costPerItem?: number;
  sku: string;
  quantity: number;
  trackQuantity: boolean;
  barcode?: string;
  weight?: number;
  images: string[];
  variants?: any[];
  tags: string[];
  status: string;
  isVisible: boolean;
  viewsCount: number;
  ordersCount: number;
  rating: number;
  reviewsCount: number;
  category?: {
    id: string;
    name: string;
  };
  seller?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const VAT_LABELS: Record<string, string> = {
  excluido: 'Excluido (0%)',
  exento: 'Exento (0%)',
  reducido: 'Reducido (5%)',
  general: 'General (19%)',
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Product>(`/products/${params.id}`);
      setProduct(response);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await apiClient.delete(`/products/${params.id}`);
      router.push('/dashboard/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Producto no encontrado</h2>
          <p className="text-muted-foreground mb-4">
            El producto que buscas no existe o ha sido eliminado.
          </p>
          <Button className="gshop-button-primary" asChild>
            <Link href="/dashboard/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a productos
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/products">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
              <p className="text-muted-foreground">SKU: {product.sku}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/products/${product.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                {tCommon('edit')}
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {tCommon('delete')}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Images */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle>{t('images')}</CardTitle>
              </CardHeader>
              <CardContent>
                {product.images?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {product.images.map((image, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-lg border border-border overflow-hidden bg-muted"
                      >
                        <img
                          src={image}
                          alt={`${product.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No hay imágenes disponibles</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle>{t('description')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.shortDescription && (
                  <div>
                    <h4 className="font-medium mb-2">Descripción corta</h4>
                    <p className="text-muted-foreground">{product.shortDescription}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium mb-2">Descripción completa</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
                {product.tags?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Etiquetas</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Details */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle>
                  <DollarSign className="h-5 w-5 inline mr-2" />
                  {t('price')} & IVA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Precio de venta</p>
                    <p className="text-2xl font-bold">{formatCurrency(Number(product.price || 0))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tipo de IVA</p>
                    <Badge variant="outline" className="text-sm">
                      {VAT_LABELS[product.vatType] || 'General (19%)'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Precio base</p>
                    <p className="text-lg font-medium">{formatCurrency(Number(product.basePrice || 0))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Monto IVA</p>
                    <p className="text-lg font-medium">{formatCurrency(Number(product.vatAmount || 0))}</p>
                  </div>
                  {product.comparePrice && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Precio de comparación</p>
                      <p className="text-lg font-medium line-through text-muted-foreground">
                        {formatCurrency(Number(product.comparePrice))}
                      </p>
                    </div>
                  )}
                  {product.costPerItem && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Costo por artículo</p>
                      <p className="text-lg font-medium">{formatCurrency(Number(product.costPerItem))}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Inventory Details */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle>
                  <Package className="h-5 w-5 inline mr-2" />
                  Inventario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Cantidad en stock</p>
                    <p className="text-lg font-medium">{Number(product.quantity || 0)} unidades</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Seguir cantidad</p>
                    <Badge variant={product.trackQuantity ? 'default' : 'secondary'}>
                      {product.trackQuantity ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                  {product.barcode && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Código de barras</p>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{product.barcode}</code>
                    </div>
                  )}
                  {product.weight && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Peso</p>
                      <p className="text-lg font-medium">{Number(product.weight)} kg</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle>{tCommon('status')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Estado del producto</p>
                  <Badge variant="outline" className={getStatusColor(product.status)}>
                    {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Visibilidad</p>
                  <Badge variant={product.isVisible ? 'default' : 'secondary'}>
                    {product.isVisible ? 'Visible' : 'Oculto'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Category & Seller */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle>Organización</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.category && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('category')}</p>
                    <p className="font-medium">{product.category.name}</p>
                  </div>
                )}
                {product.seller && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('seller')}</p>
                      <p className="font-medium">
                        {product.seller.firstName} {product.seller.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{product.seller.email}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle>
                  <BarChart3 className="h-5 w-5 inline mr-2" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Vistas</p>
                    <p className="text-2xl font-bold">{Number(product.viewsCount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pedidos</p>
                    <p className="text-2xl font-bold">{Number(product.ordersCount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Valoración</p>
                    <p className="text-2xl font-bold">{Number(product.rating || 0).toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Reseñas</p>
                    <p className="text-2xl font-bold">{Number(product.reviewsCount || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle>Metadatos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">ID del producto</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block mt-1 break-all">
                    {product.id}
                  </code>
                </div>
                <div>
                  <p className="text-muted-foreground">Slug</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block mt-1">
                    {product.slug}
                  </code>
                </div>
                <div>
                  <p className="text-muted-foreground">Creado</p>
                  <p className="mt-1">{formatDate(product.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Última actualización</p>
                  <p className="mt-1">{formatDate(product.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
