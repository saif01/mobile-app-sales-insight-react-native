import * as SecureStore from 'expo-secure-store';

import type { AccessPermissions } from '@/services/auth-api';

const AUTH_TOKEN_KEY = 'cpbit_auth_token';
const REMEMBERED_LOGIN_KEY = 'cpbit_remembered_login';
const AUTH_USER_PROFILE_KEY = 'cpbit_auth_user_profile';
const AUTH_ACCESS_PERMISSIONS_KEY = 'cpbit_auth_access_permissions';
const BIOMETRIC_CREDENTIALS_KEY = 'cpbit_biometric_credentials';
const BIOMETRIC_ENABLED_KEY = 'cpbit_biometric_enabled';

export type StoredUserProfile = {
  name: string;
  image: string | null;
};

export type StoredBiometricCredentials = {
  loginId: string;
  password: string;
};

const DEFAULT_ACCESS_PERMISSIONS: AccessPermissions = {
  canAccessQsrReports: false,
  canAccessQsrSales: false,
  canAccessQsrSalesSummary: false,
};

const secureDeviceOnlyOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function saveAuthToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token, secureDeviceOnlyOptions);
  } catch {
    // Ignore storage errors and keep app usable.
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function clearAuthToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch {
    // Ignore storage errors and keep app usable.
  }
}

export async function saveRememberedLogin(loginId: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(REMEMBERED_LOGIN_KEY, loginId, secureDeviceOnlyOptions);
  } catch {
    // Ignore storage errors and keep app usable.
  }
}

export async function getRememberedLogin(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REMEMBERED_LOGIN_KEY);
  } catch {
    return null;
  }
}

export async function clearRememberedLogin(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(REMEMBERED_LOGIN_KEY);
  } catch {
    // Ignore storage errors and keep app usable.
  }
}

export async function saveUserProfile(profile: StoredUserProfile): Promise<void> {
  try {
    await SecureStore.setItemAsync(AUTH_USER_PROFILE_KEY, JSON.stringify(profile), secureDeviceOnlyOptions);
  } catch {
    // Ignore storage errors and keep app usable.
  }
}

export async function getUserProfile(): Promise<StoredUserProfile | null> {
  try {
    const stored = await SecureStore.getItemAsync(AUTH_USER_PROFILE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<StoredUserProfile>;
    if (typeof parsed?.name !== 'string' || parsed.name.trim().length === 0) {
      return null;
    }

    return {
      name: parsed.name,
      image: typeof parsed.image === 'string' && parsed.image.trim().length > 0 ? parsed.image : null,
    };
  } catch {
    return null;
  }
}

export async function clearUserProfile(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_USER_PROFILE_KEY);
  } catch {
    // Ignore storage errors and keep app usable.
  }
}

export async function saveAccessPermissions(accessPermissions: AccessPermissions): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      AUTH_ACCESS_PERMISSIONS_KEY,
      JSON.stringify(accessPermissions),
      secureDeviceOnlyOptions
    );
  } catch {
    // Ignore storage errors and keep app usable.
  }
}

export async function getAccessPermissions(): Promise<AccessPermissions> {
  try {
    const stored = await SecureStore.getItemAsync(AUTH_ACCESS_PERMISSIONS_KEY);
    if (!stored) {
      return DEFAULT_ACCESS_PERMISSIONS;
    }

    const parsed = JSON.parse(stored) as Partial<AccessPermissions>;
    return {
      canAccessQsrReports: parsed?.canAccessQsrReports === true,
      canAccessQsrSales: parsed?.canAccessQsrSales === true,
      canAccessQsrSalesSummary: parsed?.canAccessQsrSalesSummary === true,
    };
  } catch {
    return DEFAULT_ACCESS_PERMISSIONS;
  }
}

export async function clearAccessPermissions(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_ACCESS_PERMISSIONS_KEY);
  } catch {
    // Ignore storage errors and keep app usable.
  }
}

export async function saveBiometricCredentials(credentials: StoredBiometricCredentials): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      BIOMETRIC_CREDENTIALS_KEY,
      JSON.stringify(credentials),
      secureDeviceOnlyOptions
    );
  } catch {
    // Ignore storage errors and keep app usable.
  }
}

export async function getBiometricCredentials(): Promise<StoredBiometricCredentials | null> {
  try {
    const stored = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY, secureDeviceOnlyOptions);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<StoredBiometricCredentials>;
    if (typeof parsed?.loginId !== 'string' || !parsed.loginId.trim()) {
      return null;
    }
    if (typeof parsed?.password !== 'string' || !parsed.password.trim()) {
      return null;
    }

    return {
      loginId: parsed.loginId,
      password: parsed.password,
    };
  } catch {
    return null;
  }
}

export async function clearBiometricCredentials(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
  } catch {
    // Ignore storage errors and keep app usable.
  }
}

export async function saveBiometricEnabled(enabled: boolean): Promise<void> {
  try {
    if (!enabled) {
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      return;
    }

    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true', secureDeviceOnlyOptions);
  } catch {
    // Ignore storage errors and keep app usable.
  }
}

export async function getBiometricEnabled(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY, secureDeviceOnlyOptions)) === 'true';
  } catch {
    return false;
  }
}

export async function clearBiometricEnabled(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  } catch {
    // Ignore storage errors and keep app usable.
  }
}
