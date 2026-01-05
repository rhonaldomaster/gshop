import React from 'react';
import { StripeProvider as StripeProviderSDK } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';

interface StripeProviderProps {
  children: React.ReactNode;
}

/**
 * Stripe Payment Provider
 * Wraps the app with Stripe SDK provider for payment processing
 * Uses publishable key from environment variables
 */
export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  // Get publishable key from expo constants (loaded from .env.development)
  const publishableKey = Constants.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY || '';

  if (!publishableKey) {
    console.warn(
      '[StripeProvider] STRIPE_PUBLISHABLE_KEY not found in environment variables. ' +
      'Stripe payment features will not work. ' +
      'Please add STRIPE_PUBLISHABLE_KEY to .env.development'
    );
  }

  return (
    <StripeProviderSDK
      publishableKey={publishableKey}
      merchantIdentifier="merchant.com.gshop.app" // iOS Apple Pay
      urlScheme="gshop" // For 3D Secure authentication redirects
    >
      {children}
    </StripeProviderSDK>
  );
};

export default StripeProvider;
