import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PendingAffiliatesTable } from '@/components/affiliates/pending-affiliates-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock } from 'lucide-react';

export const metadata = {
  title: 'Pending Affiliates - GSHOP Admin',
  description: 'Review and approve affiliate applications',
};

export default function PendingAffiliatesPage() {
  const t = useTranslations('affiliates');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('pendingTitle')}</h1>
            <p className="text-muted-foreground">
              {t('pendingDescription')}
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('totalPending')}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">
                {t('pendingDescription')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('documentVerification')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">100%</div>
              <p className="text-xs text-muted-foreground">
                Solicitudes con documentación completa
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Affiliates Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('applicationDetails')}</CardTitle>
            <CardDescription>
              Revisa y toma acción sobre las solicitudes de afiliados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PendingAffiliatesTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
