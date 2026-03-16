import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { ConfirmLogoutModal } from '@/components/ConfirmLogoutModal';
import { useGlobalLoader } from '@/components/global-loader-provider';

type LogoutConfirmationOptions = {
  onCancel?: () => void;
};

type LogoutConfirmationContextValue = {
  requestLogoutConfirmation: (options?: LogoutConfirmationOptions) => void;
};

const LogoutConfirmationContext = createContext<LogoutConfirmationContextValue | undefined>(undefined);

export function LogoutConfirmationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { logout } = useAuth();
  const { hideLoader, showLoader } = useGlobalLoader();
  const [visible, setVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const optionsRef = useRef<LogoutConfirmationOptions | undefined>(undefined);

  const requestLogoutConfirmation = useCallback((options?: LogoutConfirmationOptions) => {
    optionsRef.current = options;
    setVisible(true);
  }, []);

  const handleCancel = useCallback(() => {
    setVisible(false);
    optionsRef.current?.onCancel?.();
    optionsRef.current = undefined;
  }, []);

  const handleConfirm = useCallback(async () => {
    setConfirming(true);
    setVisible(false);

    await new Promise((resolve) => setTimeout(resolve, 160));

    showLoader('Signing out...');

    try {
      await logout();
      router.replace('/login');
    } finally {
      hideLoader();
      setConfirming(false);
      optionsRef.current = undefined;
    }
  }, [hideLoader, logout, router, showLoader]);

  const value = useMemo<LogoutConfirmationContextValue>(
    () => ({ requestLogoutConfirmation }),
    [requestLogoutConfirmation]
  );

  return (
    <LogoutConfirmationContext.Provider value={value}>
      {children}
      <ConfirmLogoutModal
        visible={visible}
        onCancel={handleCancel}
        onConfirm={() => {
          void handleConfirm();
        }}
        confirmLoading={confirming}
      />
    </LogoutConfirmationContext.Provider>
  );
}

export function useLogoutConfirmation() {
  const context = useContext(LogoutConfirmationContext);
  if (!context) {
    throw new Error('useLogoutConfirmation must be used inside LogoutConfirmationProvider');
  }

  return context.requestLogoutConfirmation;
}
