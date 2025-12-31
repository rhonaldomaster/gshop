'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { affiliatesService, type Affiliate } from '@/lib/affiliates.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Eye,
  TrendingUp,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/api-client';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreatorsPage() {
  const t = useTranslations('affiliates');
  const tCommon = useTranslations('common');

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
  });

  useEffect(() => {
    fetchAffiliates();
  }, [activeTab]);

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'all' ? undefined : activeTab;
      const response = await affiliatesService.getAffiliates(status);
      setAffiliates(response.affiliates || []);

      // Calculate stats from response
      if (activeTab === 'all') {
        const pending = response.affiliates.filter(a => a.status === 'pending').length;
        const approved = response.affiliates.filter(a => a.status === 'approved').length;
        const rejected = response.affiliates.filter(a => a.status === 'rejected').length;
        const suspended = response.affiliates.filter(a => a.status === 'suspended').length;

        setStats({
          total: response.total,
          pending,
          approved,
          rejected,
          suspended,
        });
      }
    } catch (error) {
      console.error('Error fetching affiliates:', error);
      toast.error('Error al cargar afiliados');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
      pending: { variant: 'outline', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle2 },
      rejected: { variant: 'destructive', icon: XCircle },
      suspended: { variant: 'secondary', icon: Ban },
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Creadores & Afiliados</h1>
            <p className="text-muted-foreground">
              Gestiona creadores de contenido, afiliados y solicitudes pendientes
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Creadores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.approved} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Solicitudes por revisar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">
                Creadores activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">
                Solicitudes rechazadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">
              Pendientes
              {stats.pending > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {stats.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Aprobados</TabsTrigger>
            <TabsTrigger value="rejected">Rechazados</TabsTrigger>
            <TabsTrigger value="suspended">Suspendidos</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === 'all' && 'Todos los Creadores'}
                  {activeTab === 'pending' && 'Solicitudes Pendientes'}
                  {activeTab === 'approved' && 'Creadores Aprobados'}
                  {activeTab === 'rejected' && 'Solicitudes Rechazadas'}
                  {activeTab === 'suspended' && 'Creadores Suspendidos'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'pending' && 'Revisa y toma acción sobre las solicitudes de afiliados'}
                  {activeTab !== 'pending' && `Gestiona creadores en estado: ${tCommon(activeTab)}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : affiliates.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No hay creadores
                    </h3>
                    <p className="text-gray-500">
                      {activeTab === 'pending'
                        ? 'No hay solicitudes pendientes de revisión'
                        : `No hay creadores en estado ${tCommon(activeTab)}`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('name')}</TableHead>
                          <TableHead>{t('email')}</TableHead>
                          <TableHead>{t('username')}</TableHead>
                          <TableHead>{t('commissionRate')}</TableHead>
                          <TableHead>Ganancias</TableHead>
                          <TableHead>Ventas</TableHead>
                          <TableHead>{t('status')}</TableHead>
                          <TableHead>{t('appliedDate')}</TableHead>
                          <TableHead className="text-right">{t('actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {affiliates.map((affiliate) => (
                          <TableRow key={affiliate.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {affiliate.isVerified && (
                                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                )}
                                {affiliate.name}
                              </div>
                            </TableCell>
                            <TableCell>{affiliate.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">@{affiliate.username}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{affiliate.commissionRate}%</Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(affiliate.totalEarnings)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                {affiliate.totalSales}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatDate(affiliate.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <Link href={`/dashboard/creators/${affiliate.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver detalles
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
