'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Send } from 'lucide-react';

export function EmailSettings() {
  const t = useTranslations('settings');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [settings, setSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'noreply@gshop.com',
    smtpPassword: '****',
    fromName: 'GSHOP',
    fromEmail: 'noreply@gshop.com',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(t('emailSettingsSaved'));
    } catch (error) {
      console.error('Error saving email settings:', error);
      alert(t('errorSavingEmail'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTesting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(t('testEmailSent'));
    } catch (error) {
      console.error('Error sending test email:', error);
      alert(t('errorSendingTest'));
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
            {t('smtpConfigDesc')}
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
          <CardTitle>{t('emailSenderDetails')}</CardTitle>
          <CardDescription>
            {t('emailSenderDetailsDesc')}
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
