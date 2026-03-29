import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { usePathname } from 'expo-router';

import { AuthSessionGuardProvider } from '@/components/auth-session-guard-provider';

const mockLogout = jest.fn();
const mockGetAuthToken = jest.fn();
const mockGetAccessPermissions = jest.fn();

jest.mock('@/components/auth-provider', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isRestoring: false,
    logout: (...args: unknown[]) => mockLogout(...args),
  }),
}));

jest.mock('@/services/auth-storage', () => ({
  getAuthToken: () => mockGetAuthToken(),
  getAccessPermissions: () => mockGetAccessPermissions(),
}));

describe('AuthSessionGuardProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthToken.mockResolvedValue('stored-token');
    mockGetAccessPermissions.mockResolvedValue({
      canAccessQsrReports: false,
      canAccessQsrSales: false,
      canAccessQsrSalesSummary: false,
    });
  });

  it('logs out when a route change finds an invalid stored access list', async () => {
    const mockedUsePathname = usePathname as jest.Mock;
    mockedUsePathname.mockReturnValue('/(tabs)');

    const screen = render(
      <AuthSessionGuardProvider>
        <Text>Child</Text>
      </AuthSessionGuardProvider>
    );

    await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));

    mockedUsePathname.mockReturnValue('/about');
    screen.rerender(
      <AuthSessionGuardProvider>
        <Text>Child</Text>
      </AuthSessionGuardProvider>
    );

    await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(2));
  });
});
