'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  FolderTree,
  Folder,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: {
    id: string;
    name: string;
  };
  children?: Category[];
  productCount?: number;
  level?: number;
  createdAt: string;
}

export function CategoriesTable() {
  const t = useTranslations('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'flat' | 'tree'>('flat');

  useEffect(() => {
    fetchCategories();
  }, [searchTerm, viewMode]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const endpoint = viewMode === 'tree' ? '/categories' : '/categories/flat';
      const response = await apiClient.get<Category[]>(endpoint);
      setCategories(response || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm(t('confirmDelete'))) {
      try {
        await apiClient.delete(`/categories/${id}`);
        setCategories(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting category:', error);
        alert(t('deleteError'));
      }
    }
  };

  const renderCategoryRow = (category: Category, level = 0) => {
    const rows = [];

    // Main category row
    rows.push(
      <TableRow key={category.id} className="hover:bg-muted/50">
        <TableCell>
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
            {level > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            {category.children && category.children.length > 0 ? (
              <FolderTree className="h-4 w-4 text-blue-600" />
            ) : (
              <Folder className="h-4 w-4 text-gray-600" />
            )}
            <span className="font-medium">{category.name}</span>
          </div>
        </TableCell>
        <TableCell>
          <code className="text-sm bg-muted px-2 py-1 rounded">
            {category.slug}
          </code>
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground line-clamp-1">
            {category.description || '-'}
          </span>
        </TableCell>
        <TableCell>
          {category.parent ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {category.parent.name}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              {t('root')}
            </Badge>
          )}
        </TableCell>
        <TableCell>
          <span className="font-medium">{category.productCount || 0}</span>
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
                <Link href={`/dashboard/categories/${category.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('edit')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/categories/create?parent=${category.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('addSubcategory')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteCategory(category.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );

    // Children rows (for tree view)
    if (viewMode === 'tree' && category.children) {
      category.children.forEach(child => {
        rows.push(...renderCategoryRow(child, level + 1));
      });
    }

    return rows;
  };

  if (isLoading) {
    return (
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('loading')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
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
          <CardTitle>{t('productCategories')}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
              <Input
                placeholder={t('searchCategories')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button
              variant={viewMode === 'flat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('flat')}
            >
              {t('flat')}
            </Button>
            <Button
              variant={viewMode === 'tree' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('tree')}
            >
              {t('tree')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderTree className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('noCategoriesFound')}</h3>
            <p className="mb-4">{t('startCreatingCategory')}</p>
            <Button className="gshop-button-primary" asChild>
              <Link href="/dashboard/categories/create">
                <Plus className="mr-2 h-4 w-4" />
                {t('addCategory')}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('slug')}</TableHead>
                  <TableHead>{t('description')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('products')}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(category => renderCategoryRow(category))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
