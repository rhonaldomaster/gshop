'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  parentId?: string;
}

export default function EditCategoryPage() {
  const t = useTranslations('categories');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const categoryId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    isActive: true,
    sortOrder: 0,
    parentId: 'none',
  });

  useEffect(() => {
    fetchCategory();
    fetchCategories();
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      const response = await apiClient.get<Category>(`/categories/${categoryId}`);
      setFormData({
        name: response.name,
        description: response.description || '',
        image: response.image || '',
        isActive: response.isActive,
        sortOrder: response.sortOrder || 0,
        parentId: response.parentId || 'none',
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la categoría',
        variant: 'destructive',
      });
      router.push('/dashboard/categories');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get<Category[]>('/categories/flat');
      // Filter out the current category and its descendants to prevent circular references
      const filtered = (response || []).filter((cat) => cat.id !== categoryId);
      setCategories(filtered);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        image: formData.image || undefined,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder || 0,
        parentId: formData.parentId === 'none' ? undefined : formData.parentId,
      };

      await apiClient.patch(`/categories/${categoryId}`, payload);

      toast({
        title: '¡Categoría actualizada!',
        description: 'La categoría ha sido actualizada exitosamente',
      });

      router.push('/dashboard/categories');
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'No se pudo actualizar la categoría. Por favor intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await apiClient.delete(`/categories/${categoryId}`);

      toast({
        title: '¡Categoría eliminada!',
        description: 'La categoría ha sido eliminada exitosamente',
      });

      router.push('/dashboard/categories');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || t('deleteError'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/categories">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{t('editCategory')}</h1>
            <p className="text-muted-foreground">
              Actualiza la información de la categoría
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isSaving || isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {tCommon('delete')}
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información básica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {t('name')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ej: Electrónicos"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      maxLength={100}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('description')}</Label>
                    <Textarea
                      id="description"
                      placeholder="Descripción de la categoría..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-sm text-muted-foreground">
                      {formData.description.length}/500 caracteres
                    </p>
                  </div>

                  {/* Image URL */}
                  <div className="space-y-2">
                    <Label htmlFor="image">URL de imagen</Label>
                    <Input
                      id="image"
                      type="url"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      value={formData.image}
                      onChange={(e) =>
                        setFormData({ ...formData, image: e.target.value })
                      }
                    />
                    {formData.image && (
                      <div className="mt-2">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="h-32 w-32 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Category Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Opciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Parent Category */}
                  <div className="space-y-2">
                    <Label htmlFor="parent">{t('parent')}</Label>
                    <Select
                      value={formData.parentId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, parentId: value })
                      }
                    >
                      <SelectTrigger id="parent">
                        <SelectValue placeholder="Categoría raíz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguna (Raíz)</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">Orden</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      min="0"
                      value={formData.sortOrder}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sortOrder: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Orden de visualización (menor aparece primero)
                    </p>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isActive">Estado</Label>
                      <p className="text-sm text-muted-foreground">
                        {formData.isActive ? 'Activa' : 'Inactiva'}
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <Button
                    type="submit"
                    className="w-full gshop-button-primary"
                    disabled={isSaving || isDeleting || !formData.name}
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
                    onClick={() => router.push('/dashboard/categories')}
                    disabled={isSaving || isDeleting}
                  >
                    {tCommon('cancel')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteCategory')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDelete')} Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {tCommon('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                tCommon('delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
