import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { usePathname } from 'expo-router';

import { AppUpdateProvider } from '@/components/app-update-provider';

const mockFetchLatestAppVersion = jest.fn();
const mockDownloadAndInstallApk = jest.fn();
const mockCheckInternetConnection = jest.fn();

jest.mock('@/services/appUpdateService', () => ({
  fetchLatestAppVersion: (...args: unknown[]) => mockFetchLatestAppVersion(...args),
  downloadAndInstallApk: (...args: unknown[]) => mockDownloadAndInstallApk(...args),
  getApkDownloadUrl: () => 'https://example.com/app.apk',
}));

jest.mock('@/utils/check-internet', () => ({
  checkInternetConnection: () => mockCheckInternetConnection(),
}));

jest.mock('@/components/ForceUpdateModal', () => ({
  ForceUpdateModal: ({ visible, latestVersion }: { visible: boolean; latestVersion: string }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return visible ? React.createElement(Text, null, `ForceUpdate:${latestVersion}`) : null;
  },
}));

jest.mock('@/components/UpdateDownloadModal', () => ({
  UpdateDownloadModal: ({ visible, progress }: { visible: boolean; progress: number }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return visible ? React.createElement(Text, null, `UpdateProgress:${progress}`) : null;
  },
}));

describe('AppUpdateProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckInternetConnection.mockResolvedValue(true);
    mockFetchLatestAppVersion.mockResolvedValue({
      latestVersion: '1.0.5',
      downloadUrl: 'https://example.com/app.apk',
    });
    mockDownloadAndInstallApk.mockResolvedValue(undefined);
  });

  it('checks for updates again when the route changes and starts the mandatory update flow', async () => {
    const mockedUsePathname = usePathname as jest.Mock;
    mockedUsePathname.mockReturnValue('/(tabs)');

    const screen = render(
      <AppUpdateProvider>
        <Text>Child</Text>
      </AppUpdateProvider>
    );

    await waitFor(() => expect(mockFetchLatestAppVersion).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockDownloadAndInstallApk).toHaveBeenCalledWith(
      'https://example.com/app.apk',
      expect.objectContaining({
        onProgress: expect.any(Function),
      })
    ));

    mockedUsePathname.mockReturnValue('/about');
    screen.rerender(
      <AppUpdateProvider>
        <Text>Child</Text>
      </AppUpdateProvider>
    );

    await waitFor(() => expect(mockFetchLatestAppVersion).toHaveBeenCalledTimes(2));
  });
});
