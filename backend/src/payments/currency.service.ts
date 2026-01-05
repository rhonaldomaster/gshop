import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Currency Conversion Service
 * Handles COP to USD conversion for Stripe payments
 * Uses Exchange Rate API with 1-hour caching and fallback rate
 */
@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  // Exchange rate cache: { 'COP_USD': { rate: 4000, timestamp: Date.now() } }
  private exchangeRateCache: Map<string, { rate: number; timestamp: number }> = new Map();

  // Cache duration: 1 hour (in milliseconds)
  private readonly CACHE_DURATION = 3600000;

  // Fallback rate if API fails (updated: January 2026)
  private readonly FALLBACK_COP_USD_RATE = 4000;

  constructor(private readonly httpService: HttpService) {}

  /**
   * Convert COP (Colombian Peso) to USD
   * @param amountCOP Amount in Colombian Pesos
   * @returns Object with USD amount and exchange rate used
   */
  async convertCOPtoUSD(amountCOP: number): Promise<{ amountUSD: number; rate: number }> {
    const rate = await this.getExchangeRate('COP', 'USD');
    const amountUSD = amountCOP / rate;

    this.logger.log(`Converted ${amountCOP} COP to ${amountUSD.toFixed(2)} USD at rate ${rate}`);

    return {
      amountUSD: Math.round(amountUSD * 100) / 100, // Round to 2 decimals
      rate,
    };
  }

  /**
   * Get exchange rate between two currencies
   * @param from Source currency code (e.g., 'COP')
   * @param to Target currency code (e.g., 'USD')
   * @returns Exchange rate (e.g., 4000 means 4000 COP = 1 USD)
   */
  async getExchangeRate(from: string, to: string): Promise<number> {
    const cacheKey = `${from}_${to}`;
    const cached = this.exchangeRateCache.get(cacheKey);

    // Return cached rate if fresh (within 1 hour)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      this.logger.debug(`Using cached exchange rate ${from}/${to}: ${cached.rate}`);
      return cached.rate;
    }

    // Fetch fresh rate from API
    try {
      const apiUrl = process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest/USD';
      const response = await firstValueFrom(this.httpService.get(apiUrl));
      const rates = response.data.rates;

      if (!rates || !rates[from]) {
        throw new Error(`Currency ${from} not found in API response`);
      }

      // Calculate rate: if converting TO USD, rate is direct (COP/USD)
      // If converting FROM USD, rate is inverse (1 / rates[to])
      const rate = to === 'USD' ? rates[from] : 1 / rates[to];

      // Cache the rate
      this.exchangeRateCache.set(cacheKey, { rate, timestamp: Date.now() });

      this.logger.log(`Fetched fresh exchange rate ${from}/${to}: ${rate}`);
      return rate;

    } catch (error) {
      this.logger.error(`Failed to fetch exchange rate: ${error.message}. Using fallback rate.`);

      // Fallback to hardcoded rate if API fails
      const fallbackRates: Record<string, number> = {
        COP_USD: this.FALLBACK_COP_USD_RATE,
        USD_COP: 1 / this.FALLBACK_COP_USD_RATE,
      };

      const fallbackRate = fallbackRates[cacheKey];

      if (!fallbackRate) {
        this.logger.warn(`No fallback rate for ${cacheKey}, defaulting to 1`);
        return 1;
      }

      // Cache fallback rate (shorter duration: 10 minutes)
      this.exchangeRateCache.set(cacheKey, {
        rate: fallbackRate,
        timestamp: Date.now() - (this.CACHE_DURATION - 600000) // Cache for 10 min only
      });

      return fallbackRate;
    }
  }

  /**
   * Clear exchange rate cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.exchangeRateCache.clear();
    this.logger.log('Exchange rate cache cleared');
  }

  /**
   * Get cache statistics (for monitoring/debugging)
   */
  getCacheStats(): { size: number; entries: Array<{ pair: string; rate: number; age: string }> } {
    const entries = Array.from(this.exchangeRateCache.entries()).map(([pair, data]) => ({
      pair,
      rate: data.rate,
      age: `${Math.round((Date.now() - data.timestamp) / 60000)} minutes ago`,
    }));

    return {
      size: this.exchangeRateCache.size,
      entries,
    };
  }
}
