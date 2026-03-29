import React from 'react';
import { Alert, Linking, Share } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import AboutAppScreen from '@/app/about';

const mockOpenBrowserAsync = jest.fn();
const mockFetchLatestAppVersion = jest.fn();
const mockOpenUpdateDownload = jest.fn();
const mockCanOpenURL = jest.fn();
const mockOpenURL = jest.fn();
const mockShare = jest.fn();
let mockNetworkState = {
  isOnline: true,
  isChecking: false,
};

jest.mock('expo-updates', () => ({
  createdAt: '2026-03-20T00:00:00.000Z',
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: (...args: unknown[]) => mockOpenBrowserAsync(...args),
}));

jest.mock('@/hooks/use-network-status', () => ({
  useNetworkStatus: () => mockNetworkState,
}));

jest.mock('@/services/appUpdateService', () => ({
  fetchLatestAppVersion: (...args: unknown[]) => mockFetchLatestAppVersion(...args),
  openUpdateDownload: (...args: unknown[]) => mockOpenUpdateDownload(...args),
  getApkDownloadUrl: () => 'https://it.cpbangladesh.com/api/mobileapp/apk_download_by_name?appname=Sales_Insight_APK',
}));

jest.mock('@/utils/app-config', () => ({
  getAboutCompanyWebsite: () => 'https://cpbangladesh.com',
  getAboutDeveloperName: () => 'CPB Application Development Team',
  getAboutSupportEmail: () => 'syful@cpbangladesh.com',
  getAboutSupportPhone: () => '+8801730731201',
}));

jest.mock('@/constants/app-version', () => ({
  APP_NAME: 'SalesInsight',
  APP_VERSION: '1.0.4',
}));

jest.mock('@/components/navigation/AppBar', () => ({
  AppBar: ({ title, subtitle }: { title: string; subtitle?: string }) => {
    const React = require('react');
    const { Text, View } = require('react-native');
    return React.createElement(
      View,
      null,
      React.createElement(Text, null, title),
      subtitle ? React.createElement(Text, null, subtitle) : null
    );
  },
}));

describe('AboutAppScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNetworkState = { isOnline: true, isChecking: false };
    mockFetchLatestAppVersion.mockResolvedValue({
      latestVersion: '1.0.4',
      downloadUrl: 'https://example.com/app.apk',
    });
    mockOpenUpdateDownload.mockResolvedValue(undefined);
    mockOpenBrowserAsync.mockResolvedValue(undefined);
    mockCanOpenURL.mockResolvedValue(true);
    mockOpenURL.mockResolvedValue(undefined);
    mockShare.mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    jest.spyOn(Linking, 'canOpenURL').mockImplementation(mockCanOpenURL);
    jest.spyOn(Linking, 'openURL').mockImplementation(mockOpenURL);
    jest.spyOn(Share, 'share').mockImplementation(mockShare);
  });

  it('renders env-driven metadata and support info', () => {
    const screen = render(<AboutAppScreen />);

    expect(screen.getByText('SalesInsight')).toBeTruthy();
    expect(screen.getAllByText('v1.0.4')).toHaveLength(2);
    expect(screen.getByText('CPB Application Development Team')).toBeTruthy();
    expect(screen.getByText('https://cpbangladesh.com')).toBeTruthy();
    expect(screen.getByText('syful@cpbangladesh.com')).toBeTruthy();
    expect(screen.getByText('+8801730731201')).toBeTruthy();
  });

  it('shares the apk download link', async () => {
    const screen = render(<AboutAppScreen />);

    await act(async () => {
      fireEvent.press(screen.getByText('Share App'));
    });

    expect(mockShare).toHaveBeenCalledWith({
      message: 'SalesInsight by CPB-IT\nhttps://it.cpbangladesh.com/api/mobileapp/apk_download_by_name?appname=Sales_Insight_APK',
      title: 'SalesInsight app',
    });
  });

  it('shows offline UI state and disables update checks while offline', async () => {
    mockNetworkState = { isOnline: false, isChecking: false };
    const screen = render(<AboutAppScreen />);

    expect(screen.getByText('Offline')).toBeTruthy();
    expect(screen.getByText('Offline mode: links and update checks need internet access.')).toBeTruthy();
    expect(screen.getByLabelText('Check for Updates')).toBeDisabled();
    expect(mockFetchLatestAppVersion).not.toHaveBeenCalled();
  });

  it('offers the update download flow when a newer version exists', async () => {
    mockFetchLatestAppVersion.mockResolvedValue({
      latestVersion: '1.0.5',
      downloadUrl: 'https://example.com/app.apk',
    });
    (Alert.alert as jest.Mock).mockImplementation((_title, _message, buttons) => {
      buttons?.[1]?.onPress?.();
    });

    const screen = render(<AboutAppScreen />);

    await act(async () => {
      fireEvent.press(screen.getByText('Check for Updates'));
    });

    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    await waitFor(() => expect(mockOpenUpdateDownload).toHaveBeenCalledWith('https://example.com/app.apk'));
  });
});
