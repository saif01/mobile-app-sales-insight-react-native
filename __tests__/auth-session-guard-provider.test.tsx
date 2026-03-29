import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { usePathname, useRouter } from 'expo-router';

import { AuthSessionGuardProvider } from '@/components/auth-session-guard-provider';

const mockLogout = jest.fn();
const mockGetAuthToken = jest.fn();
const mockGetAccessPermissions = jest.fn();
const mockReplace = jest.fn();
let mockIsAuthenticated = true;

jest.mock('@/components/auth-provider', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    isRestoring: false,
    logout: (...args: unknown[]) => mockLogout(...args),
  }),
}));

jest.mock('@/services/auth-storage', () => ({
  getAuthToken: () => mockGetAuthToken(),
  getAccessPermissions: () => mockGetAccessPermissions(),
}));

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

describe('AuthSessionGuardProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = true;
    mockGetAuthToken.mockResolvedValue('stored-token');
    mockGetAccessPermissions.mockResolvedValue({
      canAccessQsrReports: false,
      canAccessQsrSales: false,
      canAccessQsrSalesSummary: false,
    });
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
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

  it('redirects unauthenticated users away from protected routes', async () => {
    mockIsAuthenticated = false;
    mockGetAuthToken.mockResolvedValue(null);
    mockGetAccessPermissions.mockResolvedValue({
      canAccessQsrReports: false,
      canAccessQsrSales: false,
      canAccessQsrSalesSummary: false,
    });

    const mockedUsePathname = usePathname as jest.Mock;
    mockedUsePathname.mockReturnValue('/navigation-panel');

    render(
      <AuthSessionGuardProvider>
        <Text>Child</Text>
      </AuthSessionGuardProvider>
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
    expect(mockLogout).not.toHaveBeenCalled();
  });
});
