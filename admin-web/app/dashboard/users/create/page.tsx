'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
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

export default function CreateUserPage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        role: formData.role,
        avatar: formData.avatar || undefined,
        bio: formData.bio || undefined,
      };

      await apiClient.post('/users', payload);

      toast({
        title: t('userCreated'),
        description: 'El usuario ha sido creado exitosamente',
      });

      router.push('/dashboard/users');
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'No se pudo crear el usuario. Por favor intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/users">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('addUser')}</h1>
            <p className="text-muted-foreground">
              Crea una nueva cuenta de usuario
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
                      Contraseña <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      minLength={6}
                      maxLength={50}
                    />
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
                    disabled={isLoading || !formData.email || !formData.password || !formData.firstName || !formData.lastName}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {tCommon('create')}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/dashboard/users')}
                    disabled={isLoading}
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
