import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { LogoutConfirmationProvider, useLogoutConfirmation } from '@/components/logout-confirmation-provider';

const mockLogout = jest.fn();
const mockShowLoader = jest.fn();
const mockHideLoader = jest.fn();
const mockReplace = jest.fn();

jest.mock('@/components/auth-provider', () => ({
  useAuth: () => ({
    logout: mockLogout,
  }),
}));

jest.mock('@/components/global-loader-provider', () => ({
  useGlobalLoader: () => ({
    showLoader: mockShowLoader,
    hideLoader: mockHideLoader,
  }),
}));

function Trigger() {
  const requestLogoutConfirmation = useLogoutConfirmation();

  return (
    <Pressable
      onPress={() =>
        requestLogoutConfirmation({
          onCancel: jest.fn(),
        })
      }>
      <Text>Ask Logout</Text>
    </Pressable>
  );
}

describe('LogoutConfirmationProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockLogout.mockReset();
    mockShowLoader.mockReset();
    mockHideLoader.mockReset();
    mockReplace.mockReset();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
      push: jest.fn(),
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('shows the confirmation dialog and cancels cleanly', () => {
    const screen = render(
      <LogoutConfirmationProvider>
        <Trigger />
      </LogoutConfirmationProvider>
    );

    fireEvent.press(screen.getByText('Ask Logout'));

    expect(screen.getByText('Are you sure you want to logout from the app?')).toBeTruthy();

    fireEvent.press(screen.getByText('Cancel'));

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(screen.queryByText('Are you sure you want to logout from the app?')).toBeNull();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('logs out, shows the loader, and redirects to login when confirmed', async () => {
    mockLogout.mockResolvedValue(undefined);

    const screen = render(
      <LogoutConfirmationProvider>
        <Trigger />
      </LogoutConfirmationProvider>
    );

    fireEvent.press(screen.getByText('Ask Logout'));
    fireEvent.press(screen.getAllByText('Logout')[1]);

    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(mockShowLoader).toHaveBeenCalledWith('Signing out...');
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/login');
      expect(mockHideLoader).toHaveBeenCalled();
    });
  });
});
