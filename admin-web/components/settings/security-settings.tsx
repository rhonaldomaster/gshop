'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Shield } from 'lucide-react';

export function SecuritySettings() {
  const t = useTranslations('settings');
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '60',
    passwordMinLength: '8',
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: true,
    maxLoginAttempts: '5',
    lockoutDuration: '30',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(t('securitySettingsSaved'));
    } catch (error) {
      console.error('Error saving security settings:', error);
      alert(t('errorSavingSecurity'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('authenticationSecurity')}</CardTitle>
          <CardDescription>
            {t('authenticationSecurityDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="twoFactorEnabled">{t('twoFactorAuth')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('twoFactorAuthDesc')}
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
              {t('sessionTimeoutDesc')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('passwordPolicy')}</CardTitle>
          <CardDescription>
            {t('passwordPolicyDesc')}
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
                {t('requireUppercaseDesc')}
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
                {t('requireNumbersDesc')}
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
                {t('requireSymbolsDesc')}
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
            {t('loginSecurityDesc')}
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
                {t('maxLoginAttemptsDesc')}
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
                {t('lockoutDurationDesc')}
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
