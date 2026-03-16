import { Redirect, Slot } from 'expo-router';

import { useAuth } from '@/components/auth-provider';
import { PreLoader } from '@/components/PreLoader';

export default function QsrReportsLayout() {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return <PreLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Slot />;
}
