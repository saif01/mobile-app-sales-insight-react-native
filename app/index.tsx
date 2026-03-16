import { Redirect } from 'expo-router';

import { useAuth } from '@/components/auth-provider';
import { PreLoader } from '@/components/PreLoader';
import { getDefaultAuthenticatedRoute } from '@/utils/access-control';

export default function RootIndexScreen() {
  const { accessPermissions, isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return <PreLoader />;
  }

  if (isAuthenticated) {
    return <Redirect href={getDefaultAuthenticatedRoute(accessPermissions)} />;
  }

  return <Redirect href="/login" />;
}
