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
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  phone?: string;
  avatar?: string;
  bio?: string;
}

export default function EditUserPage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const userId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'buyer',
    avatar: '',
    bio: '',
  });

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await apiClient.get<UserData>(`/users/${userId}`);
      setFormData({
        email: response.email,
        password: '', // Don't load password
        firstName: response.firstName || '',
        lastName: response.lastName || '',
        phone: response.phone || '',
        role: response.role,
        avatar: response.avatar || '',
        bio: response.bio || '',
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el usuario',
        variant: 'destructive',
      });
      router.push('/dashboard/users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload: any = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        role: formData.role,
        avatar: formData.avatar || undefined,
        bio: formData.bio || undefined,
      };

      // Only include password if it's been changed
      if (formData.password) {
        payload.password = formData.password;
      }

      await apiClient.patch(`/users/${userId}`, payload);

      toast({
        title: t('userUpdated'),
        description: 'El usuario ha sido actualizado exitosamente',
      });

      router.push(`/dashboard/users/${userId}`);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'No se pudo actualizar el usuario. Por favor intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
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
            <Link href={`/dashboard/users/${userId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('editUser')}</h1>
            <p className="text-muted-foreground">
              Actualiza la información del usuario
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Información básica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {t('email')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Nueva contraseña
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Dejar vacío para mantener la actual"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      minLength={6}
                      maxLength={50}
                    />
                    <p className="text-sm text-muted-foreground">
                      Solo completa este campo si deseas cambiar la contraseña
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* First Name */}
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        {t('firstName')} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="Nombre"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        required
                        minLength={2}
                        maxLength={50}
                      />
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        {t('lastName')} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Apellido"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        required
                        minLength={2}
                        maxLength={50}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('phone')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+57 300 123 4567"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Información adicional</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Avatar URL */}
                  <div className="space-y-2">
                    <Label htmlFor="avatar">URL de avatar</Label>
                    <Input
                      id="avatar"
                      type="url"
                      placeholder="https://ejemplo.com/avatar.jpg"
                      value={formData.avatar}
                      onChange={(e) =>
                        setFormData({ ...formData, avatar: e.target.value })
                      }
                    />
                    {formData.avatar && (
                      <div className="mt-2">
                        <img
                          src={formData.avatar}
                          alt="Avatar preview"
                          className="h-20 w-20 rounded-full object-cover border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografía</Label>
                    <Textarea
                      id="bio"
                      placeholder="Descripción del usuario..."
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-sm text-muted-foreground">
                      {formData.bio.length}/500 caracteres
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* User Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuración</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Role */}
                  <div className="space-y-2">
                    <Label htmlFor="role">
                      {t('role')} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">{t('buyer')}</SelectItem>
                        <SelectItem value="seller">{t('seller')}</SelectItem>
                        <SelectItem value="affiliate">{t('affiliate')}</SelectItem>
                        <SelectItem value="admin">{t('admin')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      El rol determina los permisos del usuario
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <Button
                    type="submit"
                    className="w-full gshop-button-primary"
                    disabled={isSaving || !formData.email || !formData.firstName || !formData.lastName}
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
                    onClick={() => router.push(`/dashboard/users/${userId}`)}
                    disabled={isSaving}
                  >
                    {tCommon('cancel')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
