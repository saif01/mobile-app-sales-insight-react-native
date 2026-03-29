import React from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import {
  AuthFlowError,
  AuthProvider,
  BIOMETRIC_NOT_READY_CODE,
  useAuth,
} from '@/components/auth-provider';

const mockLoginWithMockApi = jest.fn();
const mockGetAuthToken = jest.fn();
const mockGetRememberedLogin = jest.fn();
const mockGetUserProfile = jest.fn();
const mockGetAccessPermissions = jest.fn();
const mockGetBiometricEnabled = jest.fn();
const mockGetBiometricCredentials = jest.fn();
const mockGetBiometricSupport = jest.fn();
const mockSaveAuthToken = jest.fn();
const mockSaveUserProfile = jest.fn();
const mockSaveAccessPermissions = jest.fn();
const mockSaveRememberedLogin = jest.fn();
const mockClearRememberedLogin = jest.fn();
const mockSaveBiometricCredentials = jest.fn();
const mockSaveBiometricEnabled = jest.fn();
const mockClearBiometricEnabled = jest.fn();
const mockClearBiometricCredentials = jest.fn();
const mockClearAuthToken = jest.fn();
const mockClearUserProfile = jest.fn();
const mockClearAccessPermissions = jest.fn();
const mockAuthenticateWithBiometrics = jest.fn();
let appStateChangeListener: ((nextState: 'active' | 'background' | 'inactive') => void) | null = null;

jest.mock('@/services/auth-api', () => ({
  loginWithMockApi: (...args: unknown[]) => mockLoginWithMockApi(...args),
}));

jest.mock('@/services/auth-storage', () => ({
  getAuthToken: () => mockGetAuthToken(),
  getRememberedLogin: () => mockGetRememberedLogin(),
  getUserProfile: () => mockGetUserProfile(),
  getAccessPermissions: () => mockGetAccessPermissions(),
  getBiometricEnabled: () => mockGetBiometricEnabled(),
  getBiometricCredentials: () => mockGetBiometricCredentials(),
  saveAuthToken: (...args: unknown[]) => mockSaveAuthToken(...args),
  saveUserProfile: (...args: unknown[]) => mockSaveUserProfile(...args),
  saveAccessPermissions: (...args: unknown[]) => mockSaveAccessPermissions(...args),
  saveRememberedLogin: (...args: unknown[]) => mockSaveRememberedLogin(...args),
  clearRememberedLogin: () => mockClearRememberedLogin(),
  saveBiometricCredentials: (...args: unknown[]) => mockSaveBiometricCredentials(...args),
  saveBiometricEnabled: (...args: unknown[]) => mockSaveBiometricEnabled(...args),
  clearBiometricEnabled: () => mockClearBiometricEnabled(),
  clearBiometricCredentials: () => mockClearBiometricCredentials(),
  clearAuthToken: () => mockClearAuthToken(),
  clearUserProfile: () => mockClearUserProfile(),
  clearAccessPermissions: () => mockClearAccessPermissions(),
}));

jest.mock('@/services/biometric-auth', () => ({
  getBiometricSupport: () => mockGetBiometricSupport(),
  authenticateWithBiometrics: (...args: unknown[]) => mockAuthenticateWithBiometrics(...args),
}));

function TestConsumer() {
  const auth = useAuth();

  return (
    <View>
      <Text>{`restoring:${String(auth.isRestoring)}`}</Text>
      <Text>{`authenticated:${String(auth.isAuthenticated)}`}</Text>
      <Text>{`remembered:${auth.rememberedLoginId}`}</Text>
      <Text>{`user:${auth.userProfile?.name ?? 'none'}`}</Text>
      <Text>{`canBiometric:${String(auth.canAttemptBiometricLogin)}`}</Text>
      <Pressable
        onPress={() =>
          void auth.login({
            loginId: ' user.id ',
            password: 'secret',
            rememberMe: true,
            enableBiometric: true,
          })
        }>
        <Text>Do Login</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          void auth
            .loginWithBiometrics()
            .catch((error: Error) => {
              (globalThis as typeof globalThis & { __authError?: string }).__authError = error.message;
            });
        }}>
        <Text>Do Biometric Login</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          void auth.logout();
        }}>
        <Text>Do Logout</Text>
      </Pressable>
    </View>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as typeof globalThis & { __authError?: string }).__authError = undefined;
    appStateChangeListener = null;

    jest.spyOn(AppState, 'addEventListener').mockImplementation(
      (_type, listener: (nextState: 'active' | 'background' | 'inactive') => void) => {
        appStateChangeListener = listener;
        return {
          remove: jest.fn(),
        } as { remove: () => void };
      }
    );
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      value: 'active',
    });

    mockGetAuthToken.mockResolvedValue(null);
    mockGetRememberedLogin.mockResolvedValue('stored.user');
    mockGetUserProfile.mockResolvedValue({ name: 'Stored User', image: null });
    mockGetAccessPermissions.mockResolvedValue({
      canAccessQsrReports: true,
      canAccessQsrSales: true,
      canAccessQsrSalesSummary: false,
    });
    mockGetBiometricEnabled.mockResolvedValue(true);
    mockGetBiometricCredentials.mockResolvedValue({ loginId: 'stored.user', password: 'secret' });
    mockGetBiometricSupport.mockResolvedValue({
      isAvailable: true,
      hasHardware: true,
      isEnrolled: true,
      supportedAuthenticationTypes: [1],
      label: 'Fingerprint',
    });
    mockLoginWithMockApi.mockResolvedValue({
      token: 'token-123',
      name: 'User Name',
      image: 'https://example.com/avatar.png',
      accessPermissions: {
        canAccessQsrReports: true,
        canAccessQsrSales: true,
        canAccessQsrSalesSummary: false,
      },
    });
    mockAuthenticateWithBiometrics.mockResolvedValue(true);
    mockSaveAuthToken.mockResolvedValue(undefined);
    mockSaveUserProfile.mockResolvedValue(undefined);
    mockSaveAccessPermissions.mockResolvedValue(undefined);
    mockSaveRememberedLogin.mockResolvedValue(undefined);
    mockClearRememberedLogin.mockResolvedValue(undefined);
    mockSaveBiometricCredentials.mockResolvedValue(undefined);
    mockSaveBiometricEnabled.mockResolvedValue(undefined);
    mockClearBiometricEnabled.mockResolvedValue(undefined);
    mockClearBiometricCredentials.mockResolvedValue(undefined);
    mockClearAuthToken.mockResolvedValue(undefined);
    mockClearUserProfile.mockResolvedValue(undefined);
    mockClearAccessPermissions.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('restores stored auth and biometric state on mount', async () => {
    const screen = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('restoring:false')).toBeTruthy());
    expect(screen.getByText('authenticated:false')).toBeTruthy();
    expect(screen.getByText('remembered:stored.user')).toBeTruthy();
    expect(screen.getByText('user:Stored User')).toBeTruthy();
    expect(screen.getByText('canBiometric:true')).toBeTruthy();
  });

  it('persists login session, remembered login, and biometric credentials', async () => {
    const screen = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('restoring:false')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByText('Do Login'));
    });

    await waitFor(() => expect(mockLoginWithMockApi).toHaveBeenCalledWith(' user.id ', 'secret'));
    expect(mockSaveAuthToken).toHaveBeenCalledWith('token-123');
    expect(mockSaveUserProfile).toHaveBeenCalledWith({
      name: 'User Name',
      image: 'https://example.com/avatar.png',
    });
    expect(mockSaveAccessPermissions).toHaveBeenCalled();
    expect(mockSaveRememberedLogin).toHaveBeenCalledWith('user.id');
    expect(mockSaveBiometricCredentials).toHaveBeenCalledWith({
      loginId: 'user.id',
      password: 'secret',
    });
    expect(mockSaveBiometricEnabled).toHaveBeenCalledWith(true);
    expect(screen.getByText('authenticated:true')).toBeTruthy();
  });

  it('rejects biometric login when enabled state has no stored credentials', async () => {
    mockGetBiometricCredentials.mockResolvedValue(null);

    const screen = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('restoring:false')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByText('Do Biometric Login'));
    });

    await waitFor(() => {
      expect((globalThis as typeof globalThis & { __authError?: string }).__authError).toBe(
        'Secure fingerprint credentials are not available. Please sign in with your AD ID and password.'
      );
    });
    expect(mockClearBiometricEnabled).toHaveBeenCalled();
  });

  it('clears session state on logout', async () => {
    const screen = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('restoring:false')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByText('Do Logout'));
    });

    expect(mockClearAuthToken).toHaveBeenCalled();
    expect(mockClearUserProfile).toHaveBeenCalled();
    expect(mockClearAccessPermissions).toHaveBeenCalled();
    expect(screen.getByText('authenticated:false')).toBeTruthy();
    expect(screen.getByText('user:none')).toBeTruthy();
  });

  it('logs out on background and stays logged out when returning to active', async () => {
    mockGetAuthToken.mockResolvedValue('stored-token');

    const screen = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('restoring:false')).toBeTruthy());
    expect(screen.getByText('authenticated:true')).toBeTruthy();

    await act(async () => {
      appStateChangeListener?.('background');
      await Promise.resolve();
    });

    await waitFor(() => expect(mockClearAuthToken).toHaveBeenCalled());
    expect(screen.getByText('authenticated:false')).toBeTruthy();

    await act(async () => {
      appStateChangeListener?.('active');
      await Promise.resolve();
    });

    expect(mockLoginWithMockApi).not.toHaveBeenCalled();
    expect(screen.getByText('authenticated:false')).toBeTruthy();
  });
});
