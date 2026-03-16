jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only',
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';

import {
  clearAccessPermissions,
  clearAuthToken,
  clearBiometricCredentials,
  clearBiometricEnabled,
  clearRememberedLogin,
  clearUserProfile,
  getAccessPermissions,
  getAuthToken,
  getBiometricCredentials,
  getBiometricEnabled,
  getRememberedLogin,
  getUserProfile,
  saveAccessPermissions,
  saveAuthToken,
  saveBiometricCredentials,
  saveBiometricEnabled,
  saveRememberedLogin,
  saveUserProfile,
} from '@/services/auth-storage';

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('auth-storage', () => {
  beforeEach(() => {
    mockSecureStore.setItemAsync.mockReset();
    mockSecureStore.getItemAsync.mockReset();
    mockSecureStore.deleteItemAsync.mockReset();
  });

  it('saves and reads auth token values', async () => {
    mockSecureStore.getItemAsync.mockResolvedValue('token-123');

    await saveAuthToken('token-123');
    await expect(getAuthToken()).resolves.toBe('token-123');

    expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
  });

  it('parses user profile and access permissions from secure store', async () => {
    mockSecureStore.getItemAsync
      .mockResolvedValueOnce(JSON.stringify({ name: 'Test User', image: 'https://example.com/a.png' }))
      .mockResolvedValueOnce(
        JSON.stringify({
          canAccessQsrReports: true,
          canAccessQsrSales: false,
          canAccessQsrSalesSummary: true,
        })
      );

    await expect(getUserProfile()).resolves.toEqual({
      name: 'Test User',
      image: 'https://example.com/a.png',
    });
    await expect(getAccessPermissions()).resolves.toEqual({
      canAccessQsrReports: true,
      canAccessQsrSales: false,
      canAccessQsrSalesSummary: true,
    });
  });

  it('parses biometric credentials and enabled state', async () => {
    mockSecureStore.getItemAsync
      .mockResolvedValueOnce(JSON.stringify({ loginId: 'user.id', password: 'secret' }))
      .mockResolvedValueOnce('true');

    await saveBiometricCredentials({ loginId: 'user.id', password: 'secret' });
    await saveBiometricEnabled(true);

    await expect(getBiometricCredentials()).resolves.toEqual({
      loginId: 'user.id',
      password: 'secret',
    });
    await expect(getBiometricEnabled()).resolves.toBe(true);
  });

  it('returns safe defaults when secure store contains invalid values', async () => {
    mockSecureStore.getItemAsync
      .mockResolvedValueOnce('{"name": ""}')
      .mockResolvedValueOnce('invalid json')
      .mockResolvedValueOnce('{"loginId": ""}')
      .mockResolvedValueOnce(null);

    await expect(getUserProfile()).resolves.toBeNull();
    await expect(getAccessPermissions()).resolves.toEqual({
      canAccessQsrReports: false,
      canAccessQsrSales: false,
      canAccessQsrSalesSummary: false,
    });
    await expect(getBiometricCredentials()).resolves.toBeNull();
    await expect(getRememberedLogin()).resolves.toBeNull();
  });

  it('clears all stored values through the clear helpers', async () => {
    await Promise.all([
      clearAuthToken(),
      clearRememberedLogin(),
      clearUserProfile(),
      clearAccessPermissions(),
      clearBiometricCredentials(),
      clearBiometricEnabled(),
    ]);

    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledTimes(6);
  });

  it('stores remembered login and profile values', async () => {
    mockSecureStore.getItemAsync
      .mockResolvedValueOnce('user.id')
      .mockResolvedValueOnce(JSON.stringify({ name: 'User', image: null }));

    await saveRememberedLogin('user.id');
    await saveUserProfile({ name: 'User', image: null });

    await expect(getRememberedLogin()).resolves.toBe('user.id');
    await expect(getUserProfile()).resolves.toEqual({ name: 'User', image: null });
  });

  it('stores access permissions payloads', async () => {
    await saveAccessPermissions({
      canAccessQsrReports: true,
      canAccessQsrSales: true,
      canAccessQsrSalesSummary: false,
    });

    expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
  });
});
