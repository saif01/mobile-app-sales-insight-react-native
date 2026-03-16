const mockDeleteAsync = jest.fn();
const mockGetContentUriAsync = jest.fn();
const mockDownloadAsync = jest.fn();
const mockCreateDownloadResumable = jest.fn();
const mockStartActivityAsync = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  __esModule: true,
  documentDirectory: 'file:///documents/',
  deleteAsync: mockDeleteAsync,
  getContentUriAsync: mockGetContentUriAsync,
  createDownloadResumable: mockCreateDownloadResumable,
  default: {
    documentDirectory: 'file:///documents/',
    deleteAsync: mockDeleteAsync,
    getContentUriAsync: mockGetContentUriAsync,
    createDownloadResumable: mockCreateDownloadResumable,
  },
}));

jest.mock('expo-intent-launcher', () => ({
  __esModule: true,
  startActivityAsync: mockStartActivityAsync,
}));

jest.mock('@/utils/app-config', () => ({
  isUatEnabled: () => false,
}));

import { Linking, Platform } from 'react-native';

import {
  downloadAndInstallApk,
  fetchLatestAppVersion,
  getApkDownloadUrl,
  openUpdateDownload,
} from '@/services/appUpdateService';

describe('appUpdateService', () => {
  beforeEach(() => {
    mockDeleteAsync.mockReset();
    mockGetContentUriAsync.mockReset();
    mockDownloadAsync.mockReset();
    mockCreateDownloadResumable.mockReset();
    mockStartActivityAsync.mockReset();
    global.fetch = jest.fn();

    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });

    Object.assign(Linking, {
      canOpenURL: jest.fn(),
      openURL: jest.fn(),
    });
  });

  it('builds the APK download URL with the app name', () => {
    expect(getApkDownloadUrl('CPB_IT_APK')).toContain('appname=CPB_IT_APK');
  });

  it('parses the latest version and download URL from the API response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            latest_version: '1.0.9',
            download_url: '/apk/latest',
          },
        }),
    });

    await expect(fetchLatestAppVersion('CPB_IT_APK')).resolves.toEqual({
      latestVersion: '1.0.9',
      downloadUrl: 'https://it.cpbangladesh.com/apk/latest',
    });
  });

  it('rejects APK installation on non-android platforms', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'ios',
    });

    await expect(downloadAndInstallApk('https://example.com/update.apk')).rejects.toThrow(
      'APK installation is only supported on Android.'
    );
  });

  it('opens the normalized update URL in the system browser', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
    (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

    await openUpdateDownload('/apk/latest', 'CPB_IT_APK');

    expect(Linking.canOpenURL).toHaveBeenCalledWith('https://it.cpbangladesh.com/apk/latest');
    expect(Linking.openURL).toHaveBeenCalledWith('https://it.cpbangladesh.com/apk/latest');
  });
});
