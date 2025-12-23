'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Send } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface SettingsResponse {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromName?: string;
  fromEmail?: string;
}

export function EmailSettings() {
  const t = useTranslations('settings');
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPassword: '',
    fromName: '',
    fromEmail: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/settings') as SettingsResponse;
      setSettings({
        smtpHost: response.smtpHost || '',
        smtpPort: response.smtpPort?.toString() || '',
        smtpUser: response.smtpUser || '',
        smtpPassword: response.smtpPassword || '****',
        fromName: response.fromName || '',
        fromEmail: response.fromEmail || '',
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
      await apiClient.put('/settings/email', {
        ...settings,
        smtpPort: parseInt(settings.smtpPort),
      });
      toast({
        title: t('success'),
        description: t('changesSaved'),
      });
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast({
        title: t('error'),
        description: t('errorSavingSettings'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTesting(true);
    try {
      await apiClient.post(`/settings/email/test?to=${settings.fromEmail}`, {});
      toast({
        title: t('success'),
        description: t('testEmailSent'),
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: t('error'),
        description: t('errorSendingTest'),
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('smtpConfig')}</CardTitle>
          <CardDescription>
            {t('smtpDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">{t('smtpHost')}</Label>
              <Input
                id="smtpHost"
                value={settings.smtpHost}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPort">{t('smtpPort')}</Label>
              <Input
                id="smtpPort"
                type="number"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtpUser">{t('smtpUsername')}</Label>
              <Input
                id="smtpUser"
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPassword">{t('smtpPassword')}</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('emailSender')}</CardTitle>
          <CardDescription>
            {t('emailSenderDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromName">{t('fromName')}</Label>
              <Input
                id="fromName"
                value={settings.fromName}
                onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromEmail">{t('fromEmail')}</Label>
              <Input
                id="fromEmail"
                type="email"
                value={settings.fromEmail}
                onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          onClick={handleTestEmail}
          disabled={isTesting}
          variant="outline"
        >
          <Send className="mr-2 h-4 w-4" />
          {isTesting ? t('sending') : t('sendTestEmail')}
        </Button>

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
