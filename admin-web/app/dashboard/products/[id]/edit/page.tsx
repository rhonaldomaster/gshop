'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { ImageUpload } from '@/components/ImageUpload';

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
  sellerId: string;
}

const VAT_TYPES = [
  { value: 'excluido', label: 'Excluido (0%)', rate: 0 },
  { value: 'exento', label: 'Exento (0%)', rate: 0 },
  { value: 'reducido', label: 'Reducido (5%)', rate: 0.05 },
  { value: 'general', label: 'General (19%)', rate: 0.19 },
];

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

interface Seller {
  id: string;
  businessName: string;
  email: string;
  kycStatus: string;
}

export default function EditProductPage() {
  const params = useParams();
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(true);
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
    sellerId: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await apiClient.get<Category[]>('/categories/flat');
        const activeCategories = response.filter((cat: Category) => cat.isActive);
        setCategories(activeCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    const fetchSellers = async () => {
      try {
        setLoadingSellers(true);
        const response = await apiClient.get<Seller[]>('/sellers/admin/all');
        // Filter only approved sellers
        const approvedSellers = response.filter((seller: Seller) => seller.kycStatus === 'approved');
        setSellers(approvedSellers);
      } catch (error) {
        console.error('Error fetching sellers:', error);
      } finally {
        setLoadingSellers(false);
      }
    };

    fetchCategories();
    fetchSellers();

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      const product = await apiClient.get<any>(`/products/${params.id}`);

      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: product.price?.toString() || '',
        vatType: product.vatType || 'general',
        comparePrice: product.comparePrice?.toString() || '',
        costPerItem: product.costPerItem?.toString() || '',
        sku: product.sku || '',
        quantity: product.quantity?.toString() || '0',
        trackQuantity: product.trackQuantity ?? true,
        barcode: product.barcode || '',
        weight: product.weight?.toString() || '',
        images: product.images || [],
        tags: product.tags?.join(', ') || '',
        status: product.status || 'draft',
        isVisible: product.isVisible ?? true,
        categoryId: product.categoryId || '',
        sellerId: product.sellerId || '',
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      alert(t('errorLoadingProduct'));
      router.push('/dashboard/products');
    } finally {
      setIsLoading(false);
    }
  };

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

    // Validate categoryId and sellerId
    if (!formData.categoryId || formData.categoryId.trim() === '') {
      alert(t('selectCategoryRequired'));
      return;
    }

    if (!formData.sellerId || formData.sellerId.trim() === '') {
      alert(t('selectSellerRequired'));
      return;
    }

    setIsSaving(true);

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
        sellerId: formData.sellerId,
      };

      await apiClient.patch(`/products/${params.id}`, payload);
      router.push(`/dashboard/products/${params.id}`);
    } catch (error) {
      console.error('Error updating product:', error);
      alert(t('errorUpdatingProduct'));
    } finally {
      setIsSaving(false);
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

  const vatBreakdown = calculateVatBreakdown();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/products/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('editProduct')}</h1>
            <p className="text-muted-foreground">Actualizar detalles del producto</p>
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
                      <Label htmlFor="price">{t('price')} (con IVA) *</Label>
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
                  <CardDescription>{t('imageUpload.uploadDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    images={formData.images}
                    onChange={(images) => handleInputChange('images', images)}
                    maxImages={10}
                    maxSizeMB={20}
                  />
                  <p className="mt-4 text-xs text-muted-foreground">
                    {t('imageUpload.firstImageWillBeMain')}
                  </p>
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
                    <Label htmlFor="categoryId">{t('category')} *</Label>
                    {loadingCategories ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : categories.length === 0 ? (
                      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                        <p className="text-sm text-destructive">
                          No hay categorías disponibles. Por favor crea una categoría primero.
                        </p>
                      </div>
                    ) : (
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => handleInputChange('categoryId', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Selecciona la categoría del producto (requerido)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Seller */}
              <Card className="gshop-card">
                <CardHeader>
                  <CardTitle>{t('seller')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="sellerId">{t('sellerLabel')}</Label>
                    {loadingSellers ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : sellers.length === 0 ? (
                      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                        <p className="text-sm text-destructive">
                          {t('noApprovedSellers')}
                        </p>
                      </div>
                    ) : (
                      <Select
                        value={formData.sellerId}
                        onValueChange={(value) => handleInputChange('sellerId', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectSeller')} />
                        </SelectTrigger>
                        <SelectContent>
                          {sellers.map((seller) => (
                            <SelectItem key={seller.id} value={seller.id}>
                              {seller.businessName} ({seller.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t('selectSellerHelp')}
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
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {tCommon('save')}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      asChild
                      disabled={isSaving}
                    >
                      <Link href={`/dashboard/products/${params.id}`}>{tCommon('cancel')}</Link>
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
