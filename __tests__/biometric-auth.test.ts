import * as LocalAuthentication from 'expo-local-authentication';

import { authenticateWithBiometrics, getBiometricSupport } from '@/services/biometric-auth';

jest.mock('expo-local-authentication', () => ({
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

const mockedLocalAuthentication = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;

describe('biometric-auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns available fingerprint support with label', async () => {
    mockedLocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    mockedLocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    mockedLocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);

    await expect(getBiometricSupport()).resolves.toEqual({
      isAvailable: true,
      hasHardware: true,
      isEnrolled: true,
      supportedAuthenticationTypes: [LocalAuthentication.AuthenticationType.FINGERPRINT],
      label: 'Fingerprint',
    });
  });

  it('returns generic biometric label for face or iris auth', async () => {
    mockedLocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    mockedLocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
    mockedLocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValue([
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ]);

    const result = await getBiometricSupport();

    expect(result.label).toBe('Biometric');
    expect(result.isAvailable).toBe(true);
  });

  it('authenticates with the expected local-auth options', async () => {
    mockedLocalAuthentication.authenticateAsync.mockResolvedValue({ success: true } as never);

    await expect(authenticateWithBiometrics('Authenticate now')).resolves.toBe(true);
    expect(mockedLocalAuthentication.authenticateAsync).toHaveBeenCalledWith({
      promptMessage: 'Authenticate now',
      cancelLabel: 'Cancel',
      disableDeviceFallback: true,
      requireConfirmation: false,
    });
  });
});
