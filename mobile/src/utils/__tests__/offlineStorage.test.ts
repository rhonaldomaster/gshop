import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveToCache,
  loadFromCache,
  clearCache,
  queuePendingAction,
  getPendingActions,
  removePendingAction,
} from '../offlineStorage';

jest.mock('@react-native-async-storage/async-storage');

describe('OfflineStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveToCache', () => {
    it('should save data to AsyncStorage', async () => {
      const testData = { id: 1, name: 'Test' };
      await saveToCache('test-key', testData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        expect.stringContaining('"id":1')
      );
    });

    it('should include timestamp in cached data', async () => {
      const testData = { value: 'test' };
      await saveToCache('test-key', testData);

      const call = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const savedData = JSON.parse(call[1]);

      expect(savedData).toHaveProperty('timestamp');
      expect(typeof savedData.timestamp).toBe('number');
    });
  });

  describe('loadFromCache', () => {
    it('should load data from AsyncStorage', async () => {
      const testData = { id: 1, name: 'Test' };
      const cachedData = {
        data: testData,
        timestamp: Date.now(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(cachedData)
      );

      const result = await loadFromCache('test-key');

      expect(result).toEqual(testData);
    });

    it('should return null for non-existent key', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await loadFromCache('non-existent');

      expect(result).toBeNull();
    });

    it('should return null and clear expired data', async () => {
      const expiredData = {
        data: { value: 'test' },
        timestamp: Date.now() - 10000, // 10 seconds ago
        expiresIn: 5000, // 5 second expiration
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(expiredData)
      );

      const result = await loadFromCache('expired-key');

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('expired-key');
    });
  });

  describe('clearCache', () => {
    it('should remove item from AsyncStorage', async () => {
      await clearCache('test-key');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test-key');
    });
  });

  describe('queuePendingAction', () => {
    it('should add action to queue', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await queuePendingAction('ADD_TO_CART', { productId: '1' });

      const call = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const savedData = JSON.parse(call[1]);
      const actions = savedData.data;

      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({
        type: 'ADD_TO_CART',
        payload: { productId: '1' },
        retryCount: 0,
      });
    });

    it('should append to existing queue', async () => {
      const existingActions = {
        data: [
          {
            id: '1',
            type: 'EXISTING_ACTION',
            payload: {},
            timestamp: Date.now(),
            retryCount: 0,
          },
        ],
        timestamp: Date.now(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(existingActions)
      );

      await queuePendingAction('NEW_ACTION', { data: 'test' });

      const call = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const savedData = JSON.parse(call[1]);
      const actions = savedData.data;

      expect(actions).toHaveLength(2);
    });
  });

  describe('getPendingActions', () => {
    it('should return empty array when no actions exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const actions = await getPendingActions();

      expect(actions).toEqual([]);
    });

    it('should return all pending actions', async () => {
      const cachedActions = {
        data: [
          { id: '1', type: 'ACTION_1', payload: {}, timestamp: Date.now(), retryCount: 0 },
          { id: '2', type: 'ACTION_2', payload: {}, timestamp: Date.now(), retryCount: 0 },
        ],
        timestamp: Date.now(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(cachedActions)
      );

      const actions = await getPendingActions();

      expect(actions).toHaveLength(2);
    });
  });

  describe('removePendingAction', () => {
    it('should remove specific action from queue', async () => {
      const cachedActions = {
        data: [
          { id: '1', type: 'ACTION_1', payload: {}, timestamp: Date.now(), retryCount: 0 },
          { id: '2', type: 'ACTION_2', payload: {}, timestamp: Date.now(), retryCount: 0 },
          { id: '3', type: 'ACTION_3', payload: {}, timestamp: Date.now(), retryCount: 0 },
        ],
        timestamp: Date.now(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(cachedActions)
      );

      await removePendingAction('2');

      const call = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const savedData = JSON.parse(call[1]);
      const actions = savedData.data;

      expect(actions).toHaveLength(2);
      expect(actions.find((a: any) => a.id === '2')).toBeUndefined();
    });
  });
});