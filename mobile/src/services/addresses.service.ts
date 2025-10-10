import { apiClient } from './api';

export interface Address {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

class AddressesService {
  /**
   * Get all saved addresses for the current user
   */
  async getAddresses(): Promise<Address[]> {
    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await apiClient.get<Address[]>('/addresses');
      // return response.data;

      // Mock data for now
      const mockAddresses: Address[] = [
        {
          id: '1',
          fullName: 'Juan Pérez',
          phoneNumber: '+57 300 123 4567',
          address: 'Carrera 15 #93-45, Apto 501',
          city: 'Bogotá',
          state: 'Bogotá D.C.',
          postalCode: '110221',
          isDefault: true,
        },
        {
          id: '2',
          fullName: 'María González',
          phoneNumber: '+57 310 987 6543',
          address: 'Calle 10 #5-25',
          city: 'Medellín',
          state: 'Antioquia',
          postalCode: '050001',
          isDefault: false,
        },
      ];

      return mockAddresses;
    } catch (error) {
      console.error('AddressesService: Failed to get addresses', error);
      throw error;
    }
  }

  /**
   * Get the default address for the current user
   */
  async getDefaultAddress(): Promise<Address | null> {
    try {
      const addresses = await this.getAddresses();
      const defaultAddress = addresses.find(addr => addr.isDefault);
      return defaultAddress || addresses[0] || null;
    } catch (error) {
      console.error('AddressesService: Failed to get default address', error);
      return null;
    }
  }

  /**
   * Get a specific address by ID
   */
  async getAddressById(id: string): Promise<Address | null> {
    try {
      const addresses = await this.getAddresses();
      return addresses.find(addr => addr.id === id) || null;
    } catch (error) {
      console.error('AddressesService: Failed to get address by ID', error);
      return null;
    }
  }

  /**
   * Create a new address
   */
  async createAddress(address: Omit<Address, 'id'>): Promise<Address> {
    try {
      // TODO: Replace with actual API call
      // const response = await apiClient.post<Address>('/addresses', address);
      // return response.data;

      const newAddress: Address = {
        ...address,
        id: Date.now().toString(),
      };

      return newAddress;
    } catch (error) {
      console.error('AddressesService: Failed to create address', error);
      throw error;
    }
  }

  /**
   * Update an existing address
   */
  async updateAddress(id: string, address: Partial<Address>): Promise<Address> {
    try {
      // TODO: Replace with actual API call
      // const response = await apiClient.put<Address>(`/addresses/${id}`, address);
      // return response.data;

      const addresses = await this.getAddresses();
      const existingAddress = addresses.find(addr => addr.id === id);

      if (!existingAddress) {
        throw new Error('Address not found');
      }

      return { ...existingAddress, ...address };
    } catch (error) {
      console.error('AddressesService: Failed to update address', error);
      throw error;
    }
  }

  /**
   * Delete an address
   */
  async deleteAddress(id: string): Promise<void> {
    try {
      // TODO: Replace with actual API call
      // await apiClient.delete(`/addresses/${id}`);
      console.log('Address deleted:', id);
    } catch (error) {
      console.error('AddressesService: Failed to delete address', error);
      throw error;
    }
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(id: string): Promise<void> {
    try {
      // TODO: Replace with actual API call
      // await apiClient.post(`/addresses/${id}/set-default`);
      console.log('Set as default:', id);
    } catch (error) {
      console.error('AddressesService: Failed to set default address', error);
      throw error;
    }
  }
}

export const addressesService = new AddressesService();
