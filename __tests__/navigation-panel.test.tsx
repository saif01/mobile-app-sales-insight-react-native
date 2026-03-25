import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import NavigationPanelScreen from '@/app/navigation-panel';

const mockConfirmLogout = jest.fn();
const mockPush = jest.fn();

let mockAccessPermissions = {
  canAccessQsrReports: true,
  canAccessQsrSales: true,
  canAccessQsrSalesSummary: true,
};

jest.mock('@/components/auth-provider', () => ({
  useAuth: () => ({
    accessPermissions: mockAccessPermissions,
  }),
}));

jest.mock('@/components/logout-confirmation-provider', () => ({
  useLogoutConfirmation: () => mockConfirmLogout,
}));

jest.mock('@/components/navigation/AppBar', () => ({
  AppBar: ({ title }: { title: string }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, null, title);
  },
}));

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useLocalSearchParams: () => ({ active: 'index' }),
  useRouter: jest.fn(),
}));

describe('NavigationPanelScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessPermissions = {
      canAccessQsrReports: true,
      canAccessQsrSales: true,
      canAccessQsrSalesSummary: true,
    };
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
    });
  });

  it('renders dashboard in the general section and about app in the bottom account section', () => {
    const screen = render(<NavigationPanelScreen />);

    expect(screen.getByText('General')).toBeTruthy();
    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('Account')).toBeTruthy();
    expect(screen.getByText('About App')).toBeTruthy();
  });

  it('opens about page and logout action from the account section', () => {
    const screen = render(<NavigationPanelScreen />);

    fireEvent.press(screen.getByText('About App'));
    fireEvent.press(screen.getByText('Logout'));

    expect(mockPush).toHaveBeenCalledWith('/about');
    expect(mockConfirmLogout).toHaveBeenCalled();
  });

  it('shows empty access warning and hides reports when no access is assigned', () => {
    mockAccessPermissions = {
      canAccessQsrReports: false,
      canAccessQsrSales: false,
      canAccessQsrSalesSummary: false,
    };

    const screen = render(<NavigationPanelScreen />);

    expect(screen.getByText('No access assigned')).toBeTruthy();
    expect(screen.queryByText('Reports')).toBeNull();
  });
});
