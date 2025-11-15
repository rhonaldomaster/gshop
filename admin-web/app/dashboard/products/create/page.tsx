'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: string;
  vatType: string;
  comparePrice: string;
  costPerItem: string;
  sku: string;
  quantity: string;
  trackQuantity: boolean;
  barcode: string;
  weight: string;
  images: string[];
  tags: string;
  status: string;
  isVisible: boolean;
  categoryId: string;
}

const VAT_TYPES = [
  { value: 'excluido', label: 'Excluido (0%)', rate: 0 },
  { value: 'exento', label: 'Exento (0%)', rate: 0 },
  { value: 'reducido', label: 'Reducido (5%)', rate: 0.05 },
  { value: 'general', label: 'General (19%)', rate: 0.19 },
];

export default function CreateProductPage() {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: '',
    vatType: 'general',
    comparePrice: '',
    costPerItem: '',
    sku: '',
    quantity: '0',
    trackQuantity: true,
    barcode: '',
    weight: '',
    images: [],
    tags: '',
    status: 'draft',
    isVisible: true,
    categoryId: '',
  });

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const calculateVatBreakdown = () => {
    const priceValue = parseFloat(formData.price) || 0;
    const vatType = VAT_TYPES.find((v) => v.value === formData.vatType);
    if (!vatType) return { base: 0, vat: 0, total: 0 };

    const basePrice = priceValue / (1 + vatType.rate);
    const vatAmount = priceValue - basePrice;

    return {
      base: basePrice,
      vat: vatAmount,
      total: priceValue,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription || undefined,
        price: parseFloat(formData.price) || 0,
        vatType: formData.vatType,
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
        costPerItem: formData.costPerItem ? parseFloat(formData.costPerItem) : undefined,
        sku: formData.sku,
        quantity: parseInt(formData.quantity) || 0,
        trackQuantity: formData.trackQuantity,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        images: formData.images.filter((img) => img.trim() !== ''),
        tags: formData.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag !== ''),
        status: formData.status,
        isVisible: formData.isVisible,
        categoryId: formData.categoryId,
      };

      await apiClient.post('/products', payload);
      router.push('/dashboard/products');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error creating product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const vatBreakdown = calculateVatBreakdown();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('addProduct')}</h1>
            <p className="text-muted-foreground">{t('addProduct')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="gshop-card">
                <CardHeader>
                  <CardTitle>{t('productName')}</CardTitle>
                  <CardDescription>{t('description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('productName')} *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="iPhone 15 Pro Max"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="iphone-15-pro-max"
                      required
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Generado automáticamente
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shortDescription">Descripción corta</Label>
                    <Textarea
                      id="shortDescription"
                      value={formData.shortDescription}
                      onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                      placeholder="Resumen breve del producto..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t('description')} *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Descripción completa del producto..."
                      rows={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Etiquetas</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="smartphone, apple, 5g (separado por comas)"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card className="gshop-card">
                <CardHeader>
                  <CardTitle>{t('price')} & IVA</CardTitle>
                  <CardDescription>Configurar precios incluyendo IVA colombiano</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="price">{t('price')} (with VAT) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="1299999.99"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vatType">Tipo de IVA *</Label>
                      <Select
                        value={formData.vatType}
                        onValueChange={(value) => handleInputChange('vatType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VAT_TYPES.map((vat) => (
                            <SelectItem key={vat.value} value={vat.value}>
                              {vat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* VAT Breakdown */}
                  {formData.price && (
                    <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                      <h4 className="font-medium text-sm">Desglose de IVA</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Precio base</p>
                          <p className="font-medium">
                            ${vatBreakdown.base.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Monto IVA</p>
                          <p className="font-medium">
                            ${vatBreakdown.vat.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-medium">
                            ${vatBreakdown.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="comparePrice">Precio de comparación</Label>
                      <Input
                        id="comparePrice"
                        type="number"
                        step="0.01"
                        value={formData.comparePrice}
                        onChange={(e) => handleInputChange('comparePrice', e.target.value)}
                        placeholder="1499999.99"
                      />
                      <p className="text-xs text-muted-foreground">
                        Precio original (para descuentos)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="costPerItem">Costo por artículo</Label>
                      <Input
                        id="costPerItem"
                        type="number"
                        step="0.01"
                        value={formData.costPerItem}
                        onChange={(e) => handleInputChange('costPerItem', e.target.value)}
                        placeholder="999999.99"
                      />
                      <p className="text-xs text-muted-foreground">
                        Tu costo (para seguimiento de ganancias)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inventory */}
              <Card className="gshop-card">
                <CardHeader>
                  <CardTitle>Inventario</CardTitle>
                  <CardDescription>Gestionar stock y seguimiento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => handleInputChange('sku', e.target.value)}
                        placeholder="IPH15PM-256-TIT"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="barcode">Código de barras</Label>
                      <Input
                        id="barcode"
                        value={formData.barcode}
                        onChange={(e) => handleInputChange('barcode', e.target.value)}
                        placeholder="1234567890123"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">{t('stock')} *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange('quantity', e.target.value)}
                        placeholder="25"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.01"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        placeholder="0.25"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="trackQuantity"
                      checked={formData.trackQuantity}
                      onCheckedChange={(checked) =>
                        handleInputChange('trackQuantity', checked)
                      }
                    />
                    <Label htmlFor="trackQuantity" className="cursor-pointer">
                      Seguir cantidad (actualizar stock automáticamente)
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Media */}
              <Card className="gshop-card">
                <CardHeader>
                  <CardTitle>{t('images')}</CardTitle>
                  <CardDescription>Imágenes del producto (URLs)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="space-y-2">
                      <Label htmlFor={`image-${index}`}>Imagen {index + 1} URL</Label>
                      <Input
                        id={`image-${index}`}
                        type="url"
                        value={formData.images[index] || ''}
                        onChange={(e) => {
                          const newImages = [...formData.images];
                          newImages[index] = e.target.value;
                          handleInputChange('images', newImages);
                        }}
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                    </div>
                  ))}
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
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('status')} *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">{t('draft')}</SelectItem>
                        <SelectItem value="active">{tCommon('active')}</SelectItem>
                        <SelectItem value="inactive">{tCommon('inactive')}</SelectItem>
                        <SelectItem value="out_of_stock">Sin stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isVisible"
                      checked={formData.isVisible}
                      onCheckedChange={(checked) =>
                        handleInputChange('isVisible', checked)
                      }
                    />
                    <Label htmlFor="isVisible" className="cursor-pointer">
                      Visible en la tienda
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Category */}
              <Card className="gshop-card">
                <CardHeader>
                  <CardTitle>{t('category')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">{t('category')}</Label>
                    <Input
                      id="categoryId"
                      value={formData.categoryId}
                      onChange={(e) => handleInputChange('categoryId', e.target.value)}
                      placeholder="UUID de categoría"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ingresar ID de categoría (opcional)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="gshop-card">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Button
                      type="submit"
                      className="gshop-button-primary w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {tCommon('create')} {t('productName')}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      asChild
                      disabled={isLoading}
                    >
                      <Link href="/dashboard/products">{tCommon('cancel')}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
