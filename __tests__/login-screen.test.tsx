import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { AuthFlowError, BIOMETRIC_CREDENTIALS_INVALID_CODE } from '@/components/auth-provider';
import LoginScreen from '@/app/login';

const mockAuthState = {
  biometricSupport: {
    isAvailable: false,
    hasHardware: false,
    isEnrolled: false,
    supportedAuthenticationTypes: [],
    label: 'Fingerprint',
  },
  canAttemptBiometricLogin: false,
  isAuthenticated: false,
  isRestoring: false,
  rememberedLoginId: '',
  login: jest.fn(),
  loginWithBiometrics: jest.fn(),
};

const mockNetworkState = {
  isOnline: true,
  refreshStatus: jest.fn(),
};

const mockReplace = jest.fn();
const mockFetchLatestAppVersion = jest.fn();
const mockDownloadAndInstallApk = jest.fn();
const mockCheckInternetConnection = jest.fn();

jest.mock('@/components/auth-provider', () => ({
  BIOMETRIC_CANCELLED_CODE: 'biometric_cancelled',
  BIOMETRIC_CREDENTIALS_INVALID_CODE: 'biometric_credentials_invalid',
  AuthFlowError: class AuthFlowError extends Error {
    code: string;

    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
  useAuth: () => mockAuthState,
}));

jest.mock('@/hooks/use-network-status', () => ({
  useNetworkStatus: () => mockNetworkState,
}));

jest.mock('@/hooks/use-screen-preloader', () => ({
  useScreenPreloader: jest.fn(),
}));

jest.mock('@/services/appUpdateService', () => ({
  fetchLatestAppVersion: (...args: unknown[]) => mockFetchLatestAppVersion(...args),
  downloadAndInstallApk: (...args: unknown[]) => mockDownloadAndInstallApk(...args),
  getApkDownloadUrl: () => 'https://example.com/app.apk',
}));

jest.mock('@/utils/check-internet', () => ({
  checkInternetConnection: () => mockCheckInternetConnection(),
}));

jest.mock('@/components/PreLoader', () => ({
  PreLoader: ({ message = 'Loading...' }: { message?: string }) => {
    const React = require('react');
    const { Text } = require('react-native');

    return React.createElement(Text, null, message);
  },
}));

jest.mock('@/components/AppFooter', () => ({
  AppFooter: () => {
    const React = require('react');
    const { Text } = require('react-native');

    return React.createElement(Text, null, 'AppFooter');
  },
}));

jest.mock('@/components/ForceUpdateModal', () => ({
  ForceUpdateModal: ({ visible, latestVersion }: { visible: boolean; latestVersion: string }) => {
    const React = require('react');
    const { Text } = require('react-native');

    return visible ? React.createElement(Text, null, `ForceUpdate:${latestVersion}`) : null;
  },
}));

jest.mock('@/components/UpdateDownloadModal', () => ({
  UpdateDownloadModal: ({ visible, progress }: { visible: boolean; progress: number }) => {
    const React = require('react');
    const { Text } = require('react-native');

    return visible ? React.createElement(Text, null, `UpdateProgress:${progress}`) : null;
  },
}));

jest.mock('@/constants/app-version', () => ({
  APP_VERSION: '1.0.5',
}));

async function waitForVersionCheckToFinish(screen: ReturnType<typeof render>) {
  await waitFor(() => expect(mockFetchLatestAppVersion).toHaveBeenCalled());
  await waitFor(() => expect(screen.queryByText('Checking app version...')).toBeNull());
  await waitFor(() => expect(screen.queryByText('Checking app version…')).toBeNull());
}

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.biometricSupport = {
      isAvailable: false,
      hasHardware: false,
      isEnrolled: false,
      supportedAuthenticationTypes: [],
      label: 'Fingerprint',
    };
    mockAuthState.canAttemptBiometricLogin = false;
    mockAuthState.isAuthenticated = false;
    mockAuthState.isRestoring = false;
    mockAuthState.rememberedLoginId = '';
    mockAuthState.login.mockReset();
    mockAuthState.loginWithBiometrics.mockReset();
    mockNetworkState.isOnline = true;
    mockNetworkState.refreshStatus.mockReset();
    mockFetchLatestAppVersion.mockResolvedValue({
      latestVersion: '1.0.5',
      downloadUrl: 'https://example.com/app.apk',
    });
    mockDownloadAndInstallApk.mockResolvedValue(undefined);
    mockCheckInternetConnection.mockResolvedValue(true);
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
      push: jest.fn(),
    });
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  it('shows required field validation errors for empty login submission', async () => {
    const screen = render(<LoginScreen />);

    await waitForVersionCheckToFinish(screen);

    fireEvent.press(screen.getByText('Sign In'));

    expect(await screen.findByText('AD ID is required.')).toBeTruthy();
    expect(await screen.findByText('AD Password is required.')).toBeTruthy();
    expect(mockAuthState.login).not.toHaveBeenCalled();
  });

  it('shows the manual login panel by default when biometric login is unavailable', async () => {
    const screen = render(<LoginScreen />);

    await waitForVersionCheckToFinish(screen);

    expect(screen.getByText('Welcome Back')).toBeTruthy();
    expect(screen.getByPlaceholderText('AD ID')).toBeTruthy();
    expect(screen.getByPlaceholderText('AD Password')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(screen.getByText('Register Fingerprint')).toBeTruthy();
    expect(screen.queryByText('Fingerprint Login')).toBeNull();
  });

  it('logs in with valid credentials and redirects to the authorized route', async () => {
    mockAuthState.login.mockResolvedValue({
      canAccessQsrReports: true,
      canAccessQsrSales: false,
      canAccessQsrSalesSummary: true,
    });

    const screen = render(<LoginScreen />);

    await waitForVersionCheckToFinish(screen);

    fireEvent.changeText(screen.getByPlaceholderText('AD ID'), 'user.id');
    fireEvent.changeText(screen.getByPlaceholderText('AD Password'), 'secret');
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockAuthState.login).toHaveBeenCalledWith({
        loginId: 'user.id',
        password: 'secret',
        rememberMe: true,
        enableBiometric: false,
      });
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('shows auth progress feedback while the sign-in request is pending', async () => {
    let resolveLogin: ((value: {
      canAccessQsrReports: boolean;
      canAccessQsrSales: boolean;
      canAccessQsrSalesSummary: boolean;
    }) => void) | undefined;

    mockAuthState.login.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
    );

    const screen = render(<LoginScreen />);

    await waitForVersionCheckToFinish(screen);

    fireEvent.changeText(screen.getByPlaceholderText('AD ID'), 'user.id');
    fireEvent.changeText(screen.getByPlaceholderText('AD Password'), 'secret');
    fireEvent.press(screen.getByText('Sign In'));

    expect(await screen.findByText('Signing you in')).toBeTruthy();
    expect(screen.getByText('Submitting your credentials...')).toBeTruthy();
    expect(screen.getByText('Usually completes within a few seconds.')).toBeTruthy();

    resolveLogin?.({
      canAccessQsrReports: true,
      canAccessQsrSales: true,
      canAccessQsrSalesSummary: false,
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('shows auth progress feedback while fingerprint login is pending', async () => {
    let resolveBiometricLogin:
      | ((value: {
          canAccessQsrReports: boolean;
          canAccessQsrSales: boolean;
          canAccessQsrSalesSummary: boolean;
        }) => void)
      | undefined;

    mockAuthState.canAttemptBiometricLogin = true;
    mockAuthState.biometricSupport = {
      isAvailable: true,
      hasHardware: true,
      isEnrolled: true,
      supportedAuthenticationTypes: [],
      label: 'Fingerprint',
    };
    mockAuthState.loginWithBiometrics.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBiometricLogin = resolve;
        })
    );

    const screen = render(<LoginScreen />);

    await waitForVersionCheckToFinish(screen);
    await waitFor(() => expect(mockAuthState.loginWithBiometrics).toHaveBeenCalled());

    expect(await screen.findByText('Authenticating fingerprint')).toBeTruthy();
    expect(screen.getByText('Verifying your fingerprint and signing you in...')).toBeTruthy();
    expect(screen.getByText('Usually completes within a few seconds.')).toBeTruthy();

    resolveBiometricLogin?.({
      canAccessQsrReports: false,
      canAccessQsrSales: false,
      canAccessQsrSalesSummary: false,
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('shows the fingerprint panel by default when biometric login is available', async () => {
    mockAuthState.canAttemptBiometricLogin = true;
    mockAuthState.biometricSupport = {
      isAvailable: true,
      hasHardware: true,
      isEnrolled: true,
      supportedAuthenticationTypes: [],
      label: 'Fingerprint',
    };
    mockAuthState.loginWithBiometrics.mockImplementation(() => new Promise(() => {}));

    const screen = render(<LoginScreen />);

    await waitForVersionCheckToFinish(screen);
    expect(await screen.findByText('Fingerprint Login')).toBeTruthy();
    expect(screen.getByText('Use ID and Password Instead')).toBeTruthy();
    expect(screen.queryByPlaceholderText('AD ID')).toBeNull();
  });

  it('shows auth progress feedback while fingerprint registration is pending', async () => {
    let resolveLogin:
      | ((value: {
          canAccessQsrReports: boolean;
          canAccessQsrSales: boolean;
          canAccessQsrSalesSummary: boolean;
        }) => void)
      | undefined;

    mockAuthState.biometricSupport = {
      isAvailable: true,
      hasHardware: true,
      isEnrolled: true,
      supportedAuthenticationTypes: [],
      label: 'Fingerprint',
    };
    mockAuthState.login.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
    );

    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (title === 'Enable Fingerprint Login') {
        const enableButton = buttons?.find((button: { text: string; onPress?: () => void }) => button.text === 'Enable');
        enableButton?.onPress?.();
      }
    });

    const screen = render(<LoginScreen />);

    await waitForVersionCheckToFinish(screen);

    fireEvent.changeText(screen.getByPlaceholderText('AD ID'), 'user.id');
    fireEvent.changeText(screen.getByPlaceholderText('AD Password'), 'secret');
    fireEvent.press(screen.getByText('Register Fingerprint'));

    expect(await screen.findByText('Signing you in')).toBeTruthy();
    expect(screen.getByText('Submitting your details and enabling fingerprint login...')).toBeTruthy();

    resolveLogin?.({
      canAccessQsrReports: true,
      canAccessQsrSales: true,
      canAccessQsrSalesSummary: false,
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('shows the fingerprint enable confirmation prompt before registration proceeds', async () => {
    mockAuthState.biometricSupport = {
      isAvailable: true,
      hasHardware: true,
      isEnrolled: true,
      supportedAuthenticationTypes: [],
      label: 'Fingerprint',
    };

    const screen = render(<LoginScreen />);

    await waitForVersionCheckToFinish(screen);

    fireEvent.changeText(screen.getByPlaceholderText('AD ID'), 'user.id');
    fireEvent.changeText(screen.getByPlaceholderText('AD Password'), 'secret');
    fireEvent.press(screen.getByText('Register Fingerprint'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Enable Fingerprint Login',
        'Use fingerprint authentication for your next sign-in on this device?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Not Now', style: 'cancel' }),
          expect.objectContaining({ text: 'Enable' }),
        ])
      );
    });
  });

  it('shows no-internet messaging when login connectivity check fails', async () => {
    mockCheckInternetConnection
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const screen = render(<LoginScreen />);

    await waitForVersionCheckToFinish(screen);

    fireEvent.changeText(screen.getByPlaceholderText('AD ID'), 'user.id');
    fireEvent.changeText(screen.getByPlaceholderText('AD Password'), 'secret');
    fireEvent.press(screen.getByText('Sign In'));

    expect(await screen.findByText('No internet connection. Please check your network and try again.')).toBeTruthy();
    expect(Alert.alert).toHaveBeenCalledWith(
      'No Internet',
      'No internet connection. Please check your network and try again.'
    );
    expect(mockAuthState.login).not.toHaveBeenCalled();
  });

  it('shows biometric credential invalidation errors and returns to manual login', async () => {
    mockAuthState.canAttemptBiometricLogin = true;
    mockAuthState.biometricSupport = {
      isAvailable: true,
      hasHardware: true,
      isEnrolled: true,
      supportedAuthenticationTypes: [],
      label: 'Fingerprint',
    };
    mockAuthState.loginWithBiometrics.mockRejectedValue(
      new AuthFlowError(
        BIOMETRIC_CREDENTIALS_INVALID_CODE,
        'Stored fingerprint credentials are no longer valid. Sign in again with your AD ID and password.'
      )
    );

    const screen = render(<LoginScreen />);

    await waitForVersionCheckToFinish(screen);

    await waitFor(() => {
      expect(mockAuthState.loginWithBiometrics).toHaveBeenCalled();
    });

    expect(
      await screen.findByText(
        'Stored fingerprint credentials are no longer valid. Sign in again with your AD ID and password.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Welcome Back')).toBeTruthy();
  });

  it('shows the force update state when a higher latest version is returned', async () => {
    mockFetchLatestAppVersion.mockResolvedValue({
      latestVersion: '1.0.6',
      downloadUrl: 'https://example.com/app.apk',
    });

    const screen = render(<LoginScreen />);

    expect(await screen.findByText('ForceUpdate:1.0.6')).toBeTruthy();

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockDownloadAndInstallApk).toHaveBeenCalledWith(
      'https://example.com/app.apk',
      expect.objectContaining({
        onProgress: expect.any(Function),
      })
    );
  });
});
