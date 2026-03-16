import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricSupport = {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedAuthenticationTypes: LocalAuthentication.AuthenticationType[];
  label: string;
};

function mapAuthenticationLabel(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Fingerprint';
  }

  if (
    types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) ||
    types.includes(LocalAuthentication.AuthenticationType.IRIS)
  ) {
    return 'Biometric';
  }

  return 'Biometric';
}

export async function getBiometricSupport(): Promise<BiometricSupport> {
  const [hasHardware, isEnrolled, supportedAuthenticationTypes] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);

  const isAvailable = hasHardware && isEnrolled && supportedAuthenticationTypes.length > 0;

  return {
    isAvailable,
    hasHardware,
    isEnrolled,
    supportedAuthenticationTypes,
    label: mapAuthenticationLabel(supportedAuthenticationTypes),
  };
}

export async function authenticateWithBiometrics(reason?: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason ?? 'Authenticate to continue',
    cancelLabel: 'Cancel',
    disableDeviceFallback: true,
    requireConfirmation: false,
  });

  return result.success;
}
