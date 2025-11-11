
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock } from 'lucide-react';

export function LoginForm() {
  const t = useTranslations('auth.login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('invalidCredentials'));
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      setError(t('errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="gshop-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">{t('welcomeBack')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gshop-button-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('signingIn')}
              </>
            ) : (
              t('signIn')
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>{t('demoCredentials')}</p>
          <p>{t('demoInfo')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
