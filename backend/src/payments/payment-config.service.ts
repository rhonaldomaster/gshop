import { Injectable, Logger } from '@nestjs/common';

/**
 * Payment Configuration Service
 * Manages feature flags for payment providers
 * Allows enabling/disabling Stripe, MercadoPago, or both
 */
@Injectable()
export class PaymentConfigService {
  private readonly logger = new Logger(PaymentConfigService.name);

  // Supported payment providers
  private readonly SUPPORTED_PROVIDERS = ['stripe', 'mercadopago'];

  /**
   * Get list of enabled payment providers
   * @returns Array of enabled provider names (e.g., ['stripe', 'mercadopago'])
   */
  getEnabledProviders(): string[] {
    // Read from environment variable (default: both providers enabled)
    const enabledProvidersEnv = process.env.ENABLED_PAYMENT_PROVIDERS || 'stripe,mercadopago';

    // Parse comma-separated list
    const providers = enabledProvidersEnv
      .split(',')
      .map((p) => p.trim().toLowerCase())
      .filter((p) => this.SUPPORTED_PROVIDERS.includes(p));

    // Ensure at least one provider is enabled
    if (providers.length === 0) {
      this.logger.warn('No valid payment providers configured. Falling back to all providers.');
      return this.SUPPORTED_PROVIDERS;
    }

    this.logger.log(`Enabled payment providers: ${providers.join(', ')}`);
    return providers;
  }

  /**
   * Check if a specific provider is enabled
   * @param provider Provider name (e.g., 'stripe', 'mercadopago')
   * @returns True if provider is enabled
   */
  isProviderEnabled(provider: string): boolean {
    const enabledProviders = this.getEnabledProviders();
    return enabledProviders.includes(provider.toLowerCase());
  }

  /**
   * Get configuration info for mobile/frontend apps
   * @returns Object with enabled providers and their display info
   */
  getProvidersConfig() {
    const enabledProviders = this.getEnabledProviders();

    const config = {
      providers: enabledProviders.map((provider) => {
        switch (provider) {
          case 'stripe':
            return {
              id: 'stripe',
              name: 'Credit/Debit Card',
              description: 'Pay with Visa, Mastercard, or Amex',
              icon: '💳',
              enabled: true,
            };
          case 'mercadopago':
            return {
              id: 'mercadopago',
              name: 'MercadoPago',
              description: 'PSE, cash payments, and cards',
              icon: '💵',
              enabled: true,
            };
          default:
            return null;
        }
      }).filter(Boolean), // Remove any null values
    };

    return config;
  }
}
