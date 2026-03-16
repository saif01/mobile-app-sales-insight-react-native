import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useState } from 'react';

import { hasInternetAccess } from '@/utils/check-internet';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  const refreshStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const state = await NetInfo.fetch();
      setIsOnline(hasInternetAccess(state));
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(hasInternetAccess(state));
      setIsChecking(false);
    });

    return unsubscribe;
  }, [refreshStatus]);

  return {
    isOnline,
    isChecking,
    refreshStatus,
  };
}
