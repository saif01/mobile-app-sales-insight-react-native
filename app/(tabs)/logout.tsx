import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';

import { PreLoader } from '@/components/PreLoader';
import { useLogoutConfirmation } from '@/components/logout-confirmation-provider';

export default function LogoutScreen() {
  const router = useRouter();
  const confirmLogout = useLogoutConfirmation();

  useFocusEffect(
    useCallback(() => {
      confirmLogout({
        onCancel: () => {
          router.replace('/(tabs)');
        },
      });

      return () => {
        // No-op cleanup.
      };
    }, [confirmLogout, router])
  );

  return (
    <PreLoader message="Preparing logout..." />
  );
}
