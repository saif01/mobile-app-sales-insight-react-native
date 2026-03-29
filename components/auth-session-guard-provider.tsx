import { usePathname } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/components/auth-provider';
import { getAccessPermissions, getAuthToken } from '@/services/auth-storage';
import { isStoredAccessPermissionsValid } from '@/utils/auth-session-validation';

export function AuthSessionGuardProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isRestoring, logout } = useAuth();
  const isCheckingSessionRef = useRef(false);

  const validateStoredSession = useCallback(async () => {
    if (isRestoring || isCheckingSessionRef.current) {
      return;
    }

    isCheckingSessionRef.current = true;
    try {
      const [storedToken, storedAccessPermissions] = await Promise.all([getAuthToken(), getAccessPermissions()]);
      const hasStoredToken = typeof storedToken === 'string' && storedToken.trim().length > 0;
      const hasValidStoredAccessPermissions = isStoredAccessPermissionsValid(storedAccessPermissions);

      if ((hasStoredToken && !hasValidStoredAccessPermissions) || (isAuthenticated && !hasStoredToken)) {
        await logout();
      }
    } finally {
      isCheckingSessionRef.current = false;
    }
  }, [isAuthenticated, isRestoring, logout]);

  useEffect(() => {
    if (!pathname || pathname === '/login') {
      return;
    }

    void validateStoredSession();
  }, [pathname, validateStoredSession]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && pathname && pathname !== '/login') {
        void validateStoredSession();
      }
    });

    return () => subscription.remove();
  }, [pathname, validateStoredSession]);

  return <>{children}</>;
}
