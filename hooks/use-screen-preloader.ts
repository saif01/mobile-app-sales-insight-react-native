import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useGlobalLoader } from '@/components/global-loader-provider';

type UseScreenPreloaderOptions = {
  message?: string;
  durationMs?: number;
};

export function useScreenPreloader(options?: UseScreenPreloaderOptions) {
  const { showLoader, hideLoader } = useGlobalLoader();
  const message = options?.message ?? 'Loading your expenses...';
  const durationMs = options?.durationMs ?? 550;

  useFocusEffect(
    useCallback(() => {
      showLoader(message);
      const timer = setTimeout(() => {
        hideLoader();
      }, durationMs);

      return () => {
        clearTimeout(timer);
        hideLoader();
      };
    }, [durationMs, hideLoader, message, showLoader])
  );
}
