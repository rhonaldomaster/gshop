'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { affiliatesService, type Affiliate } from '@/lib/affiliates.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2,
  XCircle,
  Ban,
  Play,
  DollarSign,
  Users,
  Eye,
  Video,
  ShoppingBag,
  TrendingUp,
  ArrowLeft,
  Loader2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Percent,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/api-client';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('affiliates');
  const tCommon = useTranslations('common');

  const [creator, setCreator] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialogs state
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showCommissionDialog, setShowCommissionDialog] = useState(false);

  const [rejectionReason, setRejectionReason] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [newCommissionRate, setNewCommissionRate] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchCreatorDetails();
    }
  }, [params.id]);

  const fetchCreatorDetails = async () => {
    try {
      setLoading(true);
      const data = await affiliatesService.getAffiliateById(params.id as string);
      setCreator(data);
      setNewCommissionRate(data.commissionRate.toString());
    } catch (error) {
      console.error('Error fetching creator details:', error);
      toast.error('Error al cargar detalles del creador');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!creator) return;

    try {
      setActionLoading(true);
      await affiliatesService.approveAffiliate(creator.id);
      toast.success('Creador aprobado exitosamente');
      setShowApproveDialog(false);
      fetchCreatorDetails();
    } catch (error) {
      console.error('Error approving creator:', error);
      toast.error('Error al aprobar creador');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!creator) return;

    try {
      setActionLoading(true);
      await affiliatesService.rejectAffiliate(creator.id, { reason: rejectionReason });
      toast.success('Creador rechazado');
      setShowRejectDialog(false);
      setRejectionReason('');
      fetchCreatorDetails();
    } catch (error) {
      console.error('Error rejecting creator:', error);
      toast.error('Error al rechazar creador');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!creator) return;

    try {
      setActionLoading(true);
      await affiliatesService.suspendAffiliate(creator.id, suspensionReason);
      toast.success('Creador suspendido');
      setShowSuspendDialog(false);
      setSuspensionReason('');
      fetchCreatorDetails();
    } catch (error) {
      console.error('Error suspending creator:', error);
      toast.error('Error al suspender creador');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCommission = async () => {
    if (!creator) return;

    try {
      setActionLoading(true);
      const rate = parseFloat(newCommissionRate);
      if (isNaN(rate) || rate < 0 || rate > 50) {
        toast.error('Tasa de comisión inválida (0-50%)');
        return;
      }

      await affiliatesService.updateCommissionRate(creator.id, rate);
      toast.success('Tasa de comisión actualizada');
      setShowCommissionDialog(false);
      fetchCreatorDetails();
    } catch (error) {
      console.error('Error updating commission:', error);
      toast.error('Error al actualizar comisión');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any, color: string }> = {
      pending: { variant: 'outline', icon: CheckCircle2, color: 'text-yellow-600' },
      approved: { variant: 'default', icon: CheckCircle2, color: 'text-green-600' },
      rejected: { variant: 'destructive', icon: XCircle, color: 'text-red-600' },
      suspended: { variant: 'secondary', icon: Ban, color: 'text-gray-600' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {tCommon(status)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!creator) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-1">Creador no encontrado</h3>
          <Button asChild className="mt-4">
            <Link href="/dashboard/creators">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Creadores
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard/creators">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{creator.name}</h1>
                {creator.isVerified && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    Verificado
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">@{creator.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(creator.status)}
          </div>
        </div>

        {/* Action Buttons */}
        {creator.status === 'pending' && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <h3 className="font-semibold text-yellow-900">Solicitud pendiente de revisión</h3>
                <p className="text-sm text-yellow-700">Revisa la información y toma una decisión</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprobar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {creator.status === 'approved' && (
          <Card>
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCommissionDialog(true)}
                >
                  <Percent className="h-4 w-4 mr-2" />
                  Cambiar Comisión
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowSuspendDialog(true)}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Suspender
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancias Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(creator.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                Disponible: {formatCurrency(creator.availableBalance)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creator.totalSales}</div>
              <p className="text-xs text-muted-foreground">
                Productos promocionados: {creator.productsPromoted}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seguidores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creator.followersCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Siguiendo: {creator.followingCount.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contenido</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creator.videosCount}</div>
              <p className="text-xs text-muted-foreground">
                Lives: {creator.liveStreamsCount} | Vistas: {creator.totalViews.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">{creator.email}</p>
                </div>
              </div>
              {creator.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-gray-600">{creator.phone}</p>
                  </div>
                </div>
              )}
              {creator.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Ubicación</p>
                    <p className="text-sm text-gray-600">{creator.location}</p>
                  </div>
                </div>
              )}
              {creator.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Sitio web</p>
                    <a
                      href={creator.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {creator.website}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles de Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Código de Afiliado</p>
                <Badge variant="outline" className="mt-1">{creator.affiliateCode}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Tasa de Comisión</p>
                <p className="text-2xl font-bold text-green-600">{creator.commissionRate}%</p>
              </div>
              {creator.documentType && creator.documentNumber && (
                <div>
                  <p className="text-sm font-medium">Documento</p>
                  <p className="text-sm text-gray-600">
                    {creator.documentType}: {creator.documentNumber}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Miembro desde</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-600">{formatDate(creator.createdAt)}</p>
                </div>
              </div>
              {creator.lastActiveAt && (
                <div>
                  <p className="text-sm font-medium">Última actividad</p>
                  <p className="text-sm text-gray-600">{formatDate(creator.lastActiveAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bio */}
        {creator.bio && (
          <Card>
            <CardHeader>
              <CardTitle>Biografía</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{creator.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Social Media */}
        {creator.socialMedia && (
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociales</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-50 p-4 rounded-md overflow-auto">
                {JSON.stringify(JSON.parse(creator.socialMedia), null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Categories */}
        {creator.categories && creator.categories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Categorías</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {creator.categories.map((category, index) => (
                  <Badge key={index} variant="secondary">{category}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprobar Creador</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas aprobar a <strong>{creator.name}</strong> como creador?
              <div className="mt-4 p-4 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">
                  • El creador podrá crear contenido y generar enlaces de afiliado
                </p>
                <p className="text-sm text-green-800">
                  • Comenzará a ganar comisiones del {creator.commissionRate}%
                </p>
                <p className="text-sm text-green-800">
                  • Recibirá una notificación de aprobación
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechazar Solicitud</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas rechazar la solicitud de <strong>{creator.name}</strong>?
              <div className="mt-4 space-y-2">
                <Label htmlFor="rejection-reason">Motivo del rechazo (opcional)</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explica por qué se rechaza la solicitud..."
                  rows={4}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspender Creador</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas suspender a <strong>{creator.name}</strong>?
              <div className="mt-4 space-y-2">
                <Label htmlFor="suspension-reason">Motivo de la suspensión</Label>
                <Textarea
                  id="suspension-reason"
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Explica por qué se suspende al creador..."
                  rows={4}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspend}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Suspender
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Commission Rate Dialog */}
      <Dialog open={showCommissionDialog} onOpenChange={setShowCommissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Tasa de Comisión</DialogTitle>
            <DialogDescription>
              Cambia la tasa de comisión para <strong>{creator.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="commission-rate">Nueva tasa de comisión (%)</Label>
              <Input
                id="commission-rate"
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={newCommissionRate}
                onChange={(e) => setNewCommissionRate(e.target.value)}
                placeholder="0.0 - 50.0"
              />
              <p className="text-sm text-gray-500">
                Tasa actual: {creator.commissionRate}%
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommissionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateCommission} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
