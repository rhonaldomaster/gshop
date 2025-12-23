'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Shield } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface SecuritySettingsResponse {
  twoFactorEnabled?: boolean;
  sessionTimeout?: number;
  passwordMinLength?: number;
  passwordRequireUppercase?: boolean;
  passwordRequireNumbers?: boolean;
  passwordRequireSymbols?: boolean;
  maxLoginAttempts?: number;
  lockoutDuration?: number;
}

export function SecuritySettings() {
  const t = useTranslations('settings');
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '',
    passwordMinLength: '',
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: true,
    maxLoginAttempts: '',
    lockoutDuration: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/settings') as SecuritySettingsResponse;
      setSettings({
        twoFactorEnabled: response.twoFactorEnabled || false,
        sessionTimeout: response.sessionTimeout?.toString() || '',
        passwordMinLength: response.passwordMinLength?.toString() || '',
        passwordRequireUppercase: response.passwordRequireUppercase || true,
        passwordRequireNumbers: response.passwordRequireNumbers || true,
        passwordRequireSymbols: response.passwordRequireSymbols || true,
        maxLoginAttempts: response.maxLoginAttempts?.toString() || '',
        lockoutDuration: response.lockoutDuration?.toString() || '',
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
      await apiClient.put('/settings/security', {
        twoFactorEnabled: settings.twoFactorEnabled,
        sessionTimeout: parseInt(settings.sessionTimeout),
        passwordMinLength: parseInt(settings.passwordMinLength),
        passwordRequireUppercase: settings.passwordRequireUppercase,
        passwordRequireNumbers: settings.passwordRequireNumbers,
        passwordRequireSymbols: settings.passwordRequireSymbols,
        maxLoginAttempts: parseInt(settings.maxLoginAttempts),
        lockoutDuration: parseInt(settings.lockoutDuration),
      });
      toast({
        title: t('success'),
        description: t('changesSaved'),
      });
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast({
        title: t('error'),
        description: t('errorSavingSettings'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('authSecurity')}</CardTitle>
          <CardDescription>
            {t('authSecurityDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="twoFactorEnabled">{t('twoFactorAuth')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('require2FA')}
              </p>
            </div>
            <Switch
              id="twoFactorEnabled"
              checked={settings.twoFactorEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, twoFactorEnabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">{t('sessionTimeout')}</Label>
            <Input
              id="sessionTimeout"
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {t('autoLogout')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('passwordPolicy')}</CardTitle>
          <CardDescription>
            {t('passwordPolicyDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passwordMinLength">{t('minPasswordLength')}</Label>
            <Input
              id="passwordMinLength"
              type="number"
              min="6"
              max="32"
              value={settings.passwordMinLength}
              onChange={(e) => setSettings({ ...settings, passwordMinLength: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="passwordRequireUppercase">{t('requireUppercase')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('uppercaseDescription')}
              </p>
            </div>
            <Switch
              id="passwordRequireUppercase"
              checked={settings.passwordRequireUppercase}
              onCheckedChange={(checked) => setSettings({ ...settings, passwordRequireUppercase: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="passwordRequireNumbers">{t('requireNumbers')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('numbersDescription')}
              </p>
            </div>
            <Switch
              id="passwordRequireNumbers"
              checked={settings.passwordRequireNumbers}
              onCheckedChange={(checked) => setSettings({ ...settings, passwordRequireNumbers: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="passwordRequireSymbols">{t('requireSymbols')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('symbolsDescription')}
              </p>
            </div>
            <Switch
              id="passwordRequireSymbols"
              checked={settings.passwordRequireSymbols}
              onCheckedChange={(checked) => setSettings({ ...settings, passwordRequireSymbols: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('loginSecurity')}</CardTitle>
          <CardDescription>
            {t('loginSecurityDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">{t('maxLoginAttempts')}</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                min="3"
                max="10"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {t('lockAccount')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lockoutDuration">{t('lockoutDuration')}</Label>
              <Input
                id="lockoutDuration"
                type="number"
                value={settings.lockoutDuration}
                onChange={(e) => setSettings({ ...settings, lockoutDuration: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {t('lockDuration')}
              </p>
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
