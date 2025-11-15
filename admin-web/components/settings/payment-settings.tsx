'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export function PaymentSettings() {
  const t = useTranslations('settings');
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    mercadoPagoClientId: '',
    mercadoPagoClientSecret: '',
    mercadoPagoAccessToken: '',
    defaultCommissionRate: '',
    minWithdrawalAmount: '',
    withdrawalFrequency: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/settings');
      setSettings({
        mercadoPagoClientId: response.mercadoPagoClientId || '',
        mercadoPagoClientSecret: response.mercadoPagoClientSecret || '****',
        mercadoPagoAccessToken: response.mercadoPagoAccessToken || '****',
        defaultCommissionRate: response.defaultCommissionRate?.toString() || '',
        minWithdrawalAmount: response.minWithdrawalAmount?.toString() || '',
        withdrawalFrequency: response.withdrawalFrequency || '',
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: t('error'),
        description: t('errorFetchingSettings'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.put('/settings/payment', {
        ...settings,
        defaultCommissionRate: parseFloat(settings.defaultCommissionRate),
        minWithdrawalAmount: parseFloat(settings.minWithdrawalAmount),
      });
      toast({
        title: t('success'),
        description: t('changesSaved'),
      });
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast({
        title: t('error'),
        description: t('errorSavingSettings'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="gshop-card">
          <CardHeader>
            <CardTitle>Cargando configuración...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('mercadoPagoConfig')}</CardTitle>
          <CardDescription>
            {t('mercadoPagoDescription')}
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
            {t('commissionDescription')}
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
              {t('appliedToAllOrders')}
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
              <Select
                value={settings.withdrawalFrequency}
                onValueChange={(value) => setSettings({ ...settings, withdrawalFrequency: value })}
              >
                <SelectTrigger id="withdrawalFrequency">
                  <SelectValue placeholder="Seleccionar frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{t('weekly')}</SelectItem>
                  <SelectItem value="biweekly">{t('biweekly')}</SelectItem>
                  <SelectItem value="monthly">{t('monthly')}</SelectItem>
                </SelectContent>
              </Select>
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
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('saving')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('saveChanges')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
