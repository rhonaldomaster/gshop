'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const t = useTranslations('auth.login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(t('invalidCredentials'))
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError(t('somethingWentWrong'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full shadow-2xl animate-fade-in">
        <CardHeader className="gshop-gradient text-white rounded-t-lg">
          <CardTitle className="text-center text-3xl font-bold">
            🏪 GSHOP Seller
          </CardTitle>
          <p className="text-center text-white/90">
            {t('subtitle')}
          </p>
        </CardHeader>

        <CardContent className="pt-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder={t('email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
              </div>
              <div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>

            {error && (
              <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 gshop-button-primary text-lg font-semibold"
            >
              {isLoading ? t('signingIn') : t('signIn')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('noAccount')}{' '}
              <Link
                href="/auth/register"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {t('createAccount')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}