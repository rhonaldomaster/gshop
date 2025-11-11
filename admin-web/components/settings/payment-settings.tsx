'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

export function PaymentSettings() {
  const t = useTranslations('settings');
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    mercadoPagoClientId: '****',
    mercadoPagoClientSecret: '****',
    mercadoPagoAccessToken: '****',
    defaultCommissionRate: '7',
    minWithdrawalAmount: '100000',
    withdrawalFrequency: 'weekly',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(t('paymentSettingsSaved'));
    } catch (error) {
      console.error('Error saving payment settings:', error);
      alert(t('errorSavingPayment'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('mercadoPagoConfig')}</CardTitle>
          <CardDescription>
            {t('mercadoPagoConfigDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mercadoPagoClientId">{t('clientId')}</Label>
            <Input
              id="mercadoPagoClientId"
              type="password"
              value={settings.mercadoPagoClientId}
              onChange={(e) => setSettings({ ...settings, mercadoPagoClientId: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mercadoPagoClientSecret">{t('clientSecret')}</Label>
            <Input
              id="mercadoPagoClientSecret"
              type="password"
              value={settings.mercadoPagoClientSecret}
              onChange={(e) => setSettings({ ...settings, mercadoPagoClientSecret: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mercadoPagoAccessToken">{t('accessToken')}</Label>
            <Input
              id="mercadoPagoAccessToken"
              type="password"
              value={settings.mercadoPagoAccessToken}
              onChange={(e) => setSettings({ ...settings, mercadoPagoAccessToken: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('commissionSettings')}</CardTitle>
          <CardDescription>
            {t('commissionSettingsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultCommissionRate">{t('defaultCommissionRate')}</Label>
            <Input
              id="defaultCommissionRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={settings.defaultCommissionRate}
              onChange={(e) => setSettings({ ...settings, defaultCommissionRate: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {t('commissionRateDesc')}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minWithdrawalAmount">{t('minWithdrawalAmount')}</Label>
              <Input
                id="minWithdrawalAmount"
                type="number"
                value={settings.minWithdrawalAmount}
                onChange={(e) => setSettings({ ...settings, minWithdrawalAmount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawalFrequency">{t('withdrawalFrequency')}</Label>
              <Input
                id="withdrawalFrequency"
                value={settings.withdrawalFrequency}
                onChange={(e) => setSettings({ ...settings, withdrawalFrequency: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gshop-button-primary"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </div>
  );
}
