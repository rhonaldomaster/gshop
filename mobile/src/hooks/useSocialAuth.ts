import { useState, useCallback, useEffect, useMemo } from 'react';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { authService, SocialLoginRequest } from '../services/auth.service';

// Only call this when the module loads
try {
  WebBrowser.maybeCompleteAuthSession();
} catch (e) {
  // Silently ignore if web browser session handling fails
}

export type SocialProvider = 'google' | 'facebook';

interface UseSocialAuthReturn {
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isGoogleEnabled: boolean;
  isFacebookEnabled: boolean;
}

// Lazy load the auth providers to avoid errors when credentials are not set
let GoogleProvider: typeof import('expo-auth-session/providers/google') | null = null;
let FacebookProvider: typeof import('expo-auth-session/providers/facebook') | null = null;
let makeRedirectUri: typeof import('expo-auth-session').makeRedirectUri | null = null;

async function loadProviders() {
  if (!GoogleProvider) {
    try {
      GoogleProvider = await import('expo-auth-session/providers/google');
    } catch (e) {
      console.warn('Failed to load Google provider:', e);
    }
  }
  if (!FacebookProvider) {
    try {
      FacebookProvider = await import('expo-auth-session/providers/facebook');
    } catch (e) {
      console.warn('Failed to load Facebook provider:', e);
    }
  }
  if (!makeRedirectUri) {
    try {
      const authSession = await import('expo-auth-session');
      makeRedirectUri = authSession.makeRedirectUri;
    } catch (e) {
      console.warn('Failed to load expo-auth-session:', e);
    }
  }
}

export function useSocialAuth(
  onSuccess: (response: any) => void,
  onError?: (error: Error) => void,
): UseSocialAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providersLoaded, setProvidersLoaded] = useState(false);

  const extra = Constants.expoConfig?.extra;

  // Check if OAuth credentials are configured
  const isGoogleEnabled = useMemo(() => {
    const webId = extra?.GOOGLE_WEB_CLIENT_ID;
    const iosId = extra?.GOOGLE_IOS_CLIENT_ID;
    const androidId = extra?.GOOGLE_ANDROID_CLIENT_ID;
    return Boolean(webId || iosId || androidId);
  }, [extra]);

  const isFacebookEnabled = useMemo(() => {
    const appId = extra?.FACEBOOK_APP_ID;
    return Boolean(appId);
  }, [extra]);

  // Load providers on mount if any social login is enabled
  useEffect(() => {
    if (isGoogleEnabled || isFacebookEnabled) {
      loadProviders().then(() => setProvidersLoaded(true));
    }
  }, [isGoogleEnabled, isFacebookEnabled]);

  const handleSocialLogin = useCallback(
    async (accessToken: string, provider: SocialProvider) => {
      try {
        setIsLoading(true);
        setError(null);

        const socialLoginData: SocialLoginRequest = {
          accessToken,
          provider,
        };

        const response = await authService.socialLogin(socialLoginData);
        onSuccess(response);
      } catch (err: any) {
        const errorMessage = err.message || 'Social login failed';
        setError(errorMessage);
        onError?.(new Error(errorMessage));
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError],
  );

  const loginWithGoogle = useCallback(async () => {
    if (!isGoogleEnabled) {
      const msg = 'Google login no configurado';
      setError(msg);
      onError?.(new Error(msg));
      return;
    }

    if (!providersLoaded || !GoogleProvider || !makeRedirectUri) {
      await loadProviders();
      if (!GoogleProvider || !makeRedirectUri) {
        const msg = 'Error al cargar Google provider';
        setError(msg);
        onError?.(new Error(msg));
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      const appScheme = extra?.APP_SCHEME || 'gshop';
      const redirectUri = makeRedirectUri({ scheme: appScheme });

      const discovery = GoogleProvider.discovery;
      const request = new (await import('expo-auth-session')).AuthRequest({
        clientId: extra?.GOOGLE_WEB_CLIENT_ID || extra?.GOOGLE_IOS_CLIENT_ID || extra?.GOOGLE_ANDROID_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
      });

      await request.makeAuthUrlAsync(discovery);
      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.params?.code) {
        // Exchange code for token
        const tokenResult = await (await import('expo-auth-session')).exchangeCodeAsync(
          {
            clientId: extra?.GOOGLE_WEB_CLIENT_ID || extra?.GOOGLE_IOS_CLIENT_ID || extra?.GOOGLE_ANDROID_CLIENT_ID,
            code: result.params.code,
            redirectUri,
            extraParams: { code_verifier: request.codeVerifier || '' },
          },
          discovery,
        );

        if (tokenResult.accessToken) {
          await handleSocialLogin(tokenResult.accessToken, 'google');
        } else {
          throw new Error('No access token received');
        }
      } else if (result.type === 'cancel') {
        setError('Login cancelado');
      } else if (result.type === 'error') {
        throw new Error(result.error?.message || 'Error de Google');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error de Google';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [isGoogleEnabled, providersLoaded, extra, handleSocialLogin, onError]);

  const loginWithFacebook = useCallback(async () => {
    if (!isFacebookEnabled) {
      const msg = 'Facebook login no configurado';
      setError(msg);
      onError?.(new Error(msg));
      return;
    }

    if (!providersLoaded || !FacebookProvider || !makeRedirectUri) {
      await loadProviders();
      if (!FacebookProvider || !makeRedirectUri) {
        const msg = 'Error al cargar Facebook provider';
        setError(msg);
        onError?.(new Error(msg));
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      const appScheme = extra?.APP_SCHEME || 'gshop';
      const redirectUri = makeRedirectUri({ scheme: appScheme });

      const discovery = FacebookProvider.discovery;
      const request = new (await import('expo-auth-session')).AuthRequest({
        clientId: extra?.FACEBOOK_APP_ID,
        scopes: ['public_profile', 'email'],
        redirectUri,
      });

      await request.makeAuthUrlAsync(discovery);
      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.authentication?.accessToken) {
        await handleSocialLogin(result.authentication.accessToken, 'facebook');
      } else if (result.type === 'cancel') {
        setError('Login cancelado');
      } else if (result.type === 'error') {
        throw new Error(result.error?.message || 'Error de Facebook');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error de Facebook';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [isFacebookEnabled, providersLoaded, extra, handleSocialLogin, onError]);

  return {
    loginWithGoogle,
    loginWithFacebook,
    isLoading,
    error,
    isGoogleEnabled,
    isFacebookEnabled,
  };
}
