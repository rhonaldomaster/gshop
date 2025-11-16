import { apiClient } from './api';

export type DocumentType = 'CC' | 'CE' | 'PA' | 'TI';

export interface Address {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  documentType: DocumentType;
  documentNumber: string;
  isDefault: boolean;
}

class AddressesService {
  /**
   * Get all saved addresses for the current user
   */
  async getAddresses(): Promise<Address[]> {
    try {
      const response = await apiClient.get<Address[]>('/users/me/addresses');

      if (response.success && response.data) {
        return response.data;
      }

      return [];
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
      const response = await apiClient.post<Address>('/users/me/addresses', address);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to create address');
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
      const response = await apiClient.patch<Address>(`/users/me/addresses/${id}`, address);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to update address');
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
      await apiClient.delete(`/users/me/addresses/${id}`);
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
      await apiClient.post(`/users/me/addresses/${id}/set-default`);
    } catch (error) {
      console.error('AddressesService: Failed to set default address', error);
      throw error;
    }
  }
}

export const addressesService = new AddressesService();
