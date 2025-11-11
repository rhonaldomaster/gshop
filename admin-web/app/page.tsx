
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { LoginForm } from '@/components/auth/login-form';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const t = useTranslations('home');

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        {/* GSHOP Logo and Branding */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 gshop-gradient rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
