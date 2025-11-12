
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Package,
  ImageIcon
} from 'lucide-react';
import { apiClient, formatCurrency, formatDate, getStatusColor } from '@/lib/api-client';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  basePrice?: number;
  vatAmount?: number;
  vatType?: string;
  quantity: number;
  status: string;
  images?: string[];
  category?: {
    name: string;
  };
  seller?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

const getVatLabel = (vatType?: string): string => {
  const labels: Record<string, string> = {
    excluido: 'Excluido (0%)',
    exento: 'Exento (0%)',
    reducido: 'Reducido (5%)',
    general: 'General (19%)',
  };
  return labels[vatType || 'general'] || 'General (19%)';
};

const getVatBadgeColor = (vatType?: string): string => {
  const colors: Record<string, string> = {
    excluido: 'bg-gray-100 text-gray-800',
    exento: 'bg-green-100 text-green-800',
    reducido: 'bg-yellow-100 text-yellow-800',
    general: 'bg-blue-100 text-blue-800',
  };
  return colors[vatType || 'general'] || 'bg-blue-100 text-blue-800';
};

export function ProductsTable() {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const tOrders = useTranslations('orders');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, statusFilter, currentPage]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await apiClient.get<{ data: Product[] }>(`/products?${params}`);
      setProducts(response?.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Mock data for demo
      setProducts([
        {
          id: '1',
          name: 'iPhone 15 Pro Max',
          sku: 'IPH15PM-256-TIT',
          price: 1299999.99,
          quantity: 25,
          status: 'active',
          images: ['/api/placeholder/60/60'],
          category: { name: 'Smartphones' },
          seller: { firstName: 'Maria', lastName: 'Rodriguez' },
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'MacBook Air 15" M3',
          sku: 'MBA15M3-512-MID',
          price: 1749999.99,
          quantity: 15,
          status: 'active',
          images: ['/api/placeholder/60/60'],
          category: { name: 'Laptops' },
          seller: { firstName: 'Maria', lastName: 'Rodriguez' },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm(t('confirmDelete'))) {
      try {
        await apiClient.delete(`/products/${id}`);
        setProducts(prev => prev?.filter?.(p => p?.id !== id));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{tCommon('loading')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5]?.map?.((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-muted rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-48"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gshop-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('allProducts')}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
              <Input
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon('status')}</SelectItem>
                <SelectItem value="active">{tCommon('active')}</SelectItem>
                <SelectItem value="draft">{t('draft')}</SelectItem>
                <SelectItem value="inactive">{tCommon('inactive')}</SelectItem>
                <SelectItem value="out_of_stock">{t('stock')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {products?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('noProducts')}</h3>
            <p className="mb-4">{t('noProducts')}</p>
            <Button className="gshop-button-primary" asChild>
              <Link href="/dashboard/products/create">
                {t('addProduct')}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16"></TableHead>
                  <TableHead>{t('productName')}</TableHead>
                  <TableHead>{t('sku')}</TableHead>
                  <TableHead>{t('price')}</TableHead>
                  <TableHead>IVA</TableHead>
                  <TableHead>{t('stock')}</TableHead>
                  <TableHead>{tCommon('status')}</TableHead>
                  <TableHead>{t('category')}</TableHead>
                  <TableHead>{t('seller')}</TableHead>
                  <TableHead>{tOrders('date')}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map?.((product) => (
                  <TableRow key={product?.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        {product?.images?.[0] ? (
                          <img 
                            src={product?.images?.[0]} 
                            alt={product?.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              (e.currentTarget.nextElementSibling as HTMLElement)?.style?.setProperty?.('display', 'flex');
                            }}
                          />
                        ) : null}
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium line-clamp-1">
                          {product?.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {product?.sku}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(product?.price)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getVatBadgeColor(product?.vatType)}`}>
                        {getVatLabel(product?.vatType)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`${
                        product?.quantity === 0 ? 'text-red-600' :
                        product?.quantity < 10 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {product?.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(product?.status)}
                      >
                        {product?.status?.charAt?.(0)?.toUpperCase?.() + product?.status?.slice?.(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {product?.category?.name || 'Sin categoría'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {product?.seller?.firstName} {product?.seller?.lastName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(product?.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/products/${product?.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              {tCommon('viewDetails')}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/products/${product?.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              {tCommon('edit')}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteProduct(product?.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {tCommon('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
