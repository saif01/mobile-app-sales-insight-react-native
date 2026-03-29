import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { AppBar } from '@/components/navigation/AppBar';

const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn();
const mockDispatch = jest.fn();
const mockGetState = jest.fn();
const mockGetParent = jest.fn();

jest.mock('@react-navigation/native', () => ({
  DrawerActions: {
    toggleDrawer: () => ({ type: 'TOGGLE_DRAWER' }),
  },
  useNavigation: () => ({
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
    dispatch: mockDispatch,
    getState: mockGetState,
    getParent: mockGetParent,
  }),
}));

jest.mock('@/constants/app-version', () => ({
  APP_VERSION: '1.0.4',
}));

describe('AppBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
    mockGetState.mockReturnValue({ type: 'stack' });
    mockGetParent.mockReturnValue({
      getState: () => ({ type: 'drawer' }),
      dispatch: mockDispatch,
      getParent: () => undefined,
    });
  });

  it('renders title and app version by default', () => {
    const screen = render(<AppBar title="About App" subtitle="Details" />);

    expect(screen.getByText('About App')).toBeTruthy();
    expect(screen.getByText('v1.0.4')).toBeTruthy();
  });

  it('handles back navigation', () => {
    const screen = render(<AppBar title="Back" showBackButton />);

    fireEvent.press(screen.getByLabelText('Go back'));

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('opens drawer navigation from the menu button', () => {
    const screen = render(<AppBar title="Menu" showMenuButton />);

    fireEvent.press(screen.getByLabelText('Open menu'));

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'TOGGLE_DRAWER' });
  });
});
