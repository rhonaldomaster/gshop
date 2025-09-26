import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const EasyPost = require('@easypost/api');
import { ShippingOptionDto } from './dto';

export interface EasyPostAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface EasyPostParcel {
  length: number;
  width: number;
  height: number;
  weight: number;
}

@Injectable()
export class EasyPostService {
  private readonly logger = new Logger(EasyPostService.name);
  private easyPost: any; // EasyPost client instance

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('EASYPOST_API_KEY');
    if (!apiKey) {
      this.logger.warn('EasyPost API key not found. Shipping functionality will be limited.');
      return;
    }

    this.easyPost = new EasyPost(apiKey);
  }

  async getShippingRates(
    fromAddress: EasyPostAddress,
    toAddress: EasyPostAddress,
    parcel: EasyPostParcel,
  ): Promise<ShippingOptionDto[]> {
    try {
      if (!this.easyPost) {
        // Return mock rates for development
        return this.getMockRates();
      }

      const shipment = await this.easyPost.Shipment.create({
        to_address: toAddress,
        from_address: fromAddress,
        parcel: parcel,
      });

      return shipment.rates.map((rate: any) => ({
        carrier: rate.carrier,
        service: rate.service,
        rate: parseFloat(rate.rate),
        deliveryTime: rate.delivery_days ? `${rate.delivery_days} days` : 'Standard',
        easypostRateId: rate.id,
      }));
    } catch (error) {
      this.logger.error('Error getting shipping rates from EasyPost:', error);
      return this.getMockRates();
    }
  }

  async createShipment(
    rateId: string,
  ): Promise<{ trackingCode: string; easypostShipmentId: string }> {
    try {
      if (!this.easyPost) {
        // Return mock data for development
        return {
          trackingCode: `MOCK${Date.now()}`,
          easypostShipmentId: `mock_shipment_${Date.now()}`,
        };
      }

      const shipment = await this.easyPost.Shipment.buy(rateId);

      return {
        trackingCode: shipment.tracking_code,
        easypostShipmentId: shipment.id,
      };
    } catch (error) {
      this.logger.error('Error creating shipment with EasyPost:', error);
      return {
        trackingCode: `ERROR${Date.now()}`,
        easypostShipmentId: `error_shipment_${Date.now()}`,
      };
    }
  }

  async getTrackingInfo(trackingCode: string): Promise<any> {
    try {
      if (!this.easyPost) {
        return {
          status: 'in_transit',
          lastUpdate: new Date(),
          events: [
            {
              status: 'shipped',
              datetime: new Date(),
              message: 'Package shipped',
            },
          ],
        };
      }

      const tracker = await this.easyPost.Tracker.create({ tracking_code: trackingCode });
      return {
        status: tracker.status,
        lastUpdate: tracker.updated_at,
        events: tracker.tracking_details,
      };
    } catch (error) {
      this.logger.error('Error getting tracking info from EasyPost:', error);
      return null;
    }
  }

  private getMockRates(): ShippingOptionDto[] {
    return [
      {
        carrier: 'Servientrega',
        service: 'Standard',
        rate: 8500,
        deliveryTime: '3-5 days',
        easypostRateId: 'mock_servientrega_1',
      },
      {
        carrier: 'Coordinadora',
        service: 'Express',
        rate: 12500,
        deliveryTime: '1-2 days',
        easypostRateId: 'mock_coordinadora_1',
      },
      {
        carrier: 'DHL',
        service: 'Express',
        rate: 25000,
        deliveryTime: '1 day',
        easypostRateId: 'mock_dhl_1',
      },
      {
        carrier: 'FedEx',
        service: 'Ground',
        rate: 18000,
        deliveryTime: '2-3 days',
        easypostRateId: 'mock_fedex_1',
      },
    ];
  }
}