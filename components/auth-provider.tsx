import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { type AccessPermissions, loginWithMockApi } from '@/services/auth-api';
import {
  clearBiometricCredentials,
  clearBiometricEnabled,
  clearAccessPermissions,
  clearAuthToken,
  clearRememberedLogin,
  clearUserProfile,
  getBiometricCredentials,
  getBiometricEnabled,
  getAccessPermissions,
  getAuthToken,
  getRememberedLogin,
  getUserProfile,
  saveBiometricCredentials,
  saveBiometricEnabled,
  saveAccessPermissions,
  saveAuthToken,
  saveRememberedLogin,
  saveUserProfile,
} from '@/services/auth-storage';
import {
  authenticateWithBiometrics,
  getBiometricSupport,
  type BiometricSupport,
} from '@/services/biometric-auth';
import { isStoredAccessPermissionsValid } from '@/utils/auth-session-validation';

export type AuthUserProfile = {
  name: string;
  image: string | null;
};

type AuthContextValue = {
  token: string | null;
  userProfile: AuthUserProfile | null;
  accessPermissions: AccessPermissions;
  isAuthenticated: boolean;
  isRestoring: boolean;
  rememberedLoginId: string;
  biometricSupport: BiometricSupport | null;
  biometricEnabled: boolean;
  canAttemptBiometricLogin: boolean;
  login: (params: {
    loginId: string;
    password: string;
    rememberMe: boolean;
    enableBiometric?: boolean;
  }) => Promise<AccessPermissions>;
  loginWithBiometrics: () => Promise<AccessPermissions>;
  refreshBiometricState: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEFAULT_ACCESS_PERMISSIONS: AccessPermissions = {
  canAccessQsrReports: false,
  canAccessQsrSales: false,
  canAccessQsrSalesSummary: false,
};

export const BIOMETRIC_CREDENTIALS_INVALID_CODE = 'biometric_credentials_invalid';
export const BIOMETRIC_NOT_READY_CODE = 'biometric_not_ready';
export const BIOMETRIC_CANCELLED_CODE = 'biometric_cancelled';

export class AuthFlowError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<AuthUserProfile | null>(null);
  const [accessPermissions, setAccessPermissions] = useState<AccessPermissions>(DEFAULT_ACCESS_PERMISSIONS);
  const [rememberedLoginId, setRememberedLoginId] = useState('');
  const [biometricSupport, setBiometricSupport] = useState<BiometricSupport | null>(null);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [hasBiometricCredentials, setHasBiometricCredentials] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const clearAuthenticatedSession = useCallback(async () => {
    await Promise.all([clearAuthToken(), clearUserProfile(), clearAccessPermissions()]);
    setToken(null);
    setUserProfile(null);
    setAccessPermissions(DEFAULT_ACCESS_PERMISSIONS);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const [
        storedToken,
        storedLoginId,
        storedUserProfile,
        storedAccessPermissions,
        storedBiometricEnabled,
        storedBiometricCredentials,
        support,
      ] = await Promise.all([
        getAuthToken(),
        getRememberedLogin(),
        getUserProfile(),
        getAccessPermissions(),
        getBiometricEnabled(),
        getBiometricCredentials(),
        getBiometricSupport(),
      ]);

      if (!mounted) {
        return;
      }

      const hasStoredToken = typeof storedToken === 'string' && storedToken.trim().length > 0;
      const hasValidStoredAccessPermissions = isStoredAccessPermissionsValid(storedAccessPermissions);

      if (hasStoredToken && !hasValidStoredAccessPermissions) {
        await clearAuthenticatedSession();

        if (!mounted) {
          return;
        }
      } else {
        setToken(storedToken);
        setUserProfile(storedUserProfile);
        setAccessPermissions(storedAccessPermissions);
      }

      setRememberedLoginId(storedLoginId ?? '');
      setBiometricSupport(support);
      setBiometricEnabledState(storedBiometricEnabled);
      setHasBiometricCredentials(Boolean(storedBiometricCredentials));
      setIsRestoring(false);
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, [clearAuthenticatedSession]);

  const persistAuthenticatedSession = useCallback(
    async ({
      loginId,
      password,
      rememberMe,
      enableBiometric = false,
    }: {
      loginId: string;
      password: string;
      rememberMe: boolean;
      enableBiometric?: boolean;
    }) => {
      const normalizedLoginId = loginId.trim();
      const result = await loginWithMockApi(loginId, password);
      const profileName = result.name?.trim() || normalizedLoginId;
      const profileImage = result.image?.trim() || null;
      const shouldPersistBiometric = enableBiometric || biometricEnabled;

      const persistenceTasks: Promise<void>[] = [
        saveAuthToken(result.token),
        saveUserProfile({ name: profileName, image: profileImage }),
        saveAccessPermissions(result.accessPermissions),
      ];

      if (rememberMe) {
        persistenceTasks.push(saveRememberedLogin(normalizedLoginId));
      } else {
        persistenceTasks.push(clearRememberedLogin());
      }

      if (shouldPersistBiometric) {
        persistenceTasks.push(
          saveBiometricCredentials({ loginId: normalizedLoginId, password }),
          saveBiometricEnabled(true)
        );
      }

      await Promise.all(persistenceTasks);

      setRememberedLoginId(rememberMe ? normalizedLoginId : '');
      setToken(result.token);
      setUserProfile({ name: profileName, image: profileImage });
      setAccessPermissions(result.accessPermissions);
      setBiometricEnabledState(shouldPersistBiometric);
      setHasBiometricCredentials(shouldPersistBiometric);

      return result.accessPermissions;
    },
    [biometricEnabled]
  );

  const login = useCallback(
    async ({
      loginId,
      password,
      rememberMe,
      enableBiometric = false,
    }: {
      loginId: string;
      password: string;
      rememberMe: boolean;
      enableBiometric?: boolean;
    }) => persistAuthenticatedSession({ loginId, password, rememberMe, enableBiometric }),
    [persistAuthenticatedSession]
  );

  const loginWithBiometrics = useCallback(async () => {
    if (!biometricSupport?.isAvailable || !biometricEnabled) {
      throw new AuthFlowError(BIOMETRIC_NOT_READY_CODE, 'Biometric login is not available on this device.');
    }

    const storedCredentials = await getBiometricCredentials();
    if (!storedCredentials) {
      setHasBiometricCredentials(false);
      setBiometricEnabledState(false);
      await clearBiometricEnabled();
      throw new AuthFlowError(
        BIOMETRIC_NOT_READY_CODE,
        'Secure fingerprint credentials are not available. Please sign in with your AD ID and password.'
      );
    }

    const authenticated = await authenticateWithBiometrics('Authenticate with your fingerprint to sign in');
    if (!authenticated) {
      throw new AuthFlowError(BIOMETRIC_CANCELLED_CODE, 'Biometric authentication was cancelled.');
    }

    try {
      return await persistAuthenticatedSession({
        loginId: storedCredentials.loginId,
        password: storedCredentials.password,
        rememberMe: true,
        enableBiometric: true,
      });
    } catch (error) {
      await Promise.all([clearBiometricCredentials(), clearBiometricEnabled()]);
      setHasBiometricCredentials(false);
      setBiometricEnabledState(false);
      setRememberedLoginId(storedCredentials.loginId);

      if (error instanceof Error) {
        throw new AuthFlowError(
          BIOMETRIC_CREDENTIALS_INVALID_CODE,
          'Stored fingerprint credentials are no longer valid. Sign in again with your AD ID and password.'
        );
      }

      throw error;
    }
  }, [biometricEnabled, biometricSupport, persistAuthenticatedSession]);

  const refreshBiometricState = useCallback(async () => {
    const [support, storedBiometricEnabled, storedBiometricCredentials] = await Promise.all([
      getBiometricSupport(),
      getBiometricEnabled(),
      getBiometricCredentials(),
    ]);

    setBiometricSupport(support);
    setBiometricEnabledState(storedBiometricEnabled);
    setHasBiometricCredentials(Boolean(storedBiometricCredentials));
  }, []);

  const logout = useCallback(async () => {
    await clearAuthenticatedSession();
  }, [clearAuthenticatedSession]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      const movedToBackground =
        previousState === 'active' && (nextState === 'background' || nextState === 'inactive');

      if (movedToBackground) {
        if (token) {
          void clearAuthenticatedSession();
        }
      }
    });

    return () => subscription.remove();
  }, [clearAuthenticatedSession, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      userProfile,
      accessPermissions,
      isAuthenticated: Boolean(token),
      isRestoring,
      rememberedLoginId,
      biometricSupport,
      biometricEnabled,
      canAttemptBiometricLogin: Boolean(biometricSupport?.isAvailable && biometricEnabled && hasBiometricCredentials),
      login,
      loginWithBiometrics,
      refreshBiometricState,
      logout,
    }),
    [
      accessPermissions,
      biometricEnabled,
      biometricSupport,
      hasBiometricCredentials,
      isRestoring,
      login,
      loginWithBiometrics,
      logout,
      rememberedLoginId,
      refreshBiometricState,
      token,
      userProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
