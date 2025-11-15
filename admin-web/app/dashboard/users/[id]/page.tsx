'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Loader2, Mail, Phone, Calendar, Shield, User as UserIcon, Trash2 } from 'lucide-react';
import { apiClient, formatDate } from '@/lib/api-client';
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
  createdAt: string;
  lastLoginAt?: string;
}

const getUserRoleColor = (role: string): string => {
  const colors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800',
    seller: 'bg-blue-100 text-blue-800',
    affiliate: 'bg-orange-100 text-orange-800',
    buyer: 'bg-green-100 text-green-800',
    customer: 'bg-green-100 text-green-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
};

const getUserStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export default function UserDetailPage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const userId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await apiClient.get<UserData>(`/users/${userId}`);
      setUser(response);
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

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await apiClient.delete(`/users/${userId}`);

      toast({
        title: t('userDeleted'),
        description: 'El usuario ha sido eliminado exitosamente',
      });

      router.push('/dashboard/users');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'No se pudo eliminar el usuario',
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

  if (!user) {
    return null;
  }

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
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{t('userDetails')}</h1>
            <p className="text-muted-foreground">
              Información completa del usuario
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/users/${userId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                {t('edit')}
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {tCommon('delete')}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* User Profile Card */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="h-32 w-32 rounded-full object-cover border-4 border-border"
                  />
                ) : (
                  <div className="h-32 w-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-border">
                    {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                  </div>
                )}
                <h2 className="mt-4 text-2xl font-bold">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-muted-foreground">{user.email}</p>

                <div className="flex gap-2 mt-4">
                  <Badge variant="outline" className={getUserRoleColor(user.role)}>
                    {t(user.role)}
                  </Badge>
                  <Badge variant="outline" className={getUserStatusColor(user.status)}>
                    {t(user.status)}
                  </Badge>
                </div>

                {user.bio && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {user.bio}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información de contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('email')}</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                {user.phone && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 text-green-600">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('phone')}</p>
                      <p className="font-medium">{user.phone}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información de cuenta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-100 text-purple-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('role')}</p>
                    <p className="font-medium capitalize">{t(user.role)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100 text-orange-600">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('status')}</p>
                    <p className="font-medium capitalize">{t(user.status)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-cyan-100 text-cyan-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('joined')}</p>
                    <p className="font-medium">{formatDate(user.createdAt)}</p>
                  </div>
                </div>

                {user.lastLoginAt && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 text-indigo-600">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('lastLogin')}</p>
                      <p className="font-medium">{formatDate(user.lastLoginAt)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteUser')}</AlertDialogTitle>
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
