import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PreLoader } from '@/components/PreLoader';

type GlobalLoaderContextValue = {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
};

const GlobalLoaderContext = createContext<GlobalLoaderContextValue | undefined>(undefined);

export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
  const [activeLoaderCount, setActiveLoaderCount] = useState(0);
  const [message, setMessage] = useState('Loading...');

  const showLoader = useCallback((nextMessage?: string) => {
    if (nextMessage) setMessage(nextMessage);
    setActiveLoaderCount((current) => current + 1);
  }, []);

  const hideLoader = useCallback(() => {
    setActiveLoaderCount((current) => Math.max(0, current - 1));
  }, []);

  const visible = activeLoaderCount > 0;
  const value = useMemo(() => ({ showLoader, hideLoader }), [hideLoader, showLoader]);

  return (
    <GlobalLoaderContext.Provider value={value}>
      {children}
      {visible ? (
        <View pointerEvents="auto" style={styles.overlay}>
          <PreLoader message={message} />
        </View>
      ) : null}
    </GlobalLoaderContext.Provider>
  );
}

export function useGlobalLoader() {
  const context = useContext(GlobalLoaderContext);
  if (!context) {
    throw new Error('useGlobalLoader must be used inside GlobalLoaderProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
  },
});
