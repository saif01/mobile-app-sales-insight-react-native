import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, Platform } from 'react-native';

import { isUatEnabled } from '@/utils/app-config';

const isUat = isUatEnabled();
const APP_NAME = isUat ? 'CPB_IT_APK_UAT' : 'CPB_IT_APK';
const VERSION_CHECK_ENDPOINT = 'https://it.cpbangladesh.com/api/mobileapp/apk_version_check';
const APK_DOWNLOAD_ENDPOINT = 'https://it.cpbangladesh.com/api/mobileapp/apk_download_by_name';
const APK_MIME_TYPE = 'application/vnd.android.package-archive';
const FLAG_GRANT_READ_URI_PERMISSION = 1;
const FLAG_ACTIVITY_NEW_TASK = 268435456;

type VersionApiResult = {
  latestVersion: string;
  downloadUrl: string;
};

type DownloadProgressCallback = (progress: {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  progress: number;
}) => void;

type DownloadAndInstallOptions = {
  onProgress?: DownloadProgressCallback;
};

function getFileSystemModule() {
  const moduleCandidate = FileSystem as typeof FileSystem & {
    default?: typeof FileSystem;
  };

  // Jest can expose expo-file-system/legacy through a default export shape.
  return typeof moduleCandidate.deleteAsync === 'function'
    ? moduleCandidate
    : moduleCandidate.default;
}

function toObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function pickFirstString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function extractLatestVersion(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  const root = toObject(payload);
  if (!root) {
    return null;
  }

  const directVersion = pickFirstString(root, [
    'latest_version',
    'latestVersion',
    'version',
    'apk_version',
    'app_version',
  ]);
  if (directVersion) {
    return directVersion;
  }

  if (typeof root.data === 'string' && root.data.trim()) {
    return root.data.trim();
  }

  const dataNode = toObject(root.data);
  if (!dataNode) {
    return null;
  }

  return pickFirstString(dataNode, [
    'latest_version',
    'latestVersion',
    'version',
    'apk_version',
    'app_version',
  ]);
}

function extractDownloadUrl(payload: unknown): string | null {
  const root = toObject(payload);
  if (!root) {
    return null;
  }

  const directUrl = pickFirstString(root, ['download_url', 'downloadUrl', 'apk_url', 'url']);
  if (directUrl) {
    return directUrl;
  }

  const dataNode = toObject(root.data);
  if (!dataNode) {
    return null;
  }

  return pickFirstString(dataNode, ['download_url', 'downloadUrl', 'apk_url', 'url']);
}

function normalizeDownloadUrl(downloadUrl: string | null | undefined, appName = APP_NAME): string {
  const rawValue = typeof downloadUrl === 'string' ? downloadUrl.trim() : '';
  if (!rawValue) {
    return getApkDownloadUrl(appName);
  }

  try {
    return new URL(rawValue).toString();
  } catch {
    try {
      return new URL(rawValue, APK_DOWNLOAD_ENDPOINT).toString();
    } catch {
      return getApkDownloadUrl(appName);
    }
  }
}

export function getApkDownloadUrl(appName = APP_NAME): string {
  const params = new URLSearchParams({ appname: appName });
  return `${APK_DOWNLOAD_ENDPOINT}?${params.toString()}`;
}

export async function fetchLatestAppVersion(appName = APP_NAME): Promise<VersionApiResult> {
  const params = new URLSearchParams({ appname: appName });
  const requestUrl = `${VERSION_CHECK_ENDPOINT}?${params.toString()}`;

  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json, text/plain;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`Version check failed with status ${response.status}.`);
  }

  const responseText = await response.text();

  let payload: unknown = responseText;
  try {
    payload = JSON.parse(responseText);
  } catch {
    payload = responseText;
  }

  const latestVersion = extractLatestVersion(payload);
  if (!latestVersion) {
    throw new Error('Version check response did not include a valid version.');
  }

  return {
    latestVersion,
    downloadUrl: normalizeDownloadUrl(extractDownloadUrl(payload), appName),
  };
}

function sanitizeAppName(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, '_');
  return normalized || APP_NAME;
}

export async function downloadAndInstallApk(
  downloadUrl: string,
  appNameOrOptions: string | DownloadAndInstallOptions = APP_NAME,
  maybeOptions?: DownloadAndInstallOptions
): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('APK installation is only supported on Android.');
  }

  const appName =
    typeof appNameOrOptions === 'string' ? appNameOrOptions : APP_NAME;
  const options =
    typeof appNameOrOptions === 'string' ? maybeOptions : appNameOrOptions;
  const fileSystem = getFileSystemModule();

  // Use cacheDirectory so the content URI is more likely to work with the package installer
  const baseDir = fileSystem?.cacheDirectory ?? fileSystem?.documentDirectory;
  if (!baseDir) {
    throw new Error('Unable to access app storage for update download.');
  }

  const localApkUri = `${baseDir}${sanitizeAppName(appName)}-update.apk`;
  await fileSystem.deleteAsync(localApkUri, { idempotent: true });

  const downloader = fileSystem.createDownloadResumable(
    downloadUrl,
    localApkUri,
    {
      headers: {
        Accept: 'application/vnd.android.package-archive, application/octet-stream, */*',
      },
    },
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      const progress =
        totalBytesExpectedToWrite > 0
          ? totalBytesWritten / totalBytesExpectedToWrite
          : 0;

      options?.onProgress?.({
        totalBytesWritten,
        totalBytesExpectedToWrite,
        progress: Math.min(Math.max(progress, 0), 1),
      });
    }
  );

  const downloadResult = await downloader.downloadAsync();
  if (!downloadResult?.uri) {
    throw new Error('APK download failed.');
  }

  options?.onProgress?.({
    totalBytesWritten: 1,
    totalBytesExpectedToWrite: 1,
    progress: 1,
  });

  const contentUri = await fileSystem.getContentUriAsync(downloadResult.uri);
  const contentUriString = typeof contentUri === 'string' ? contentUri : (contentUri as { uri?: string })?.uri ?? String(contentUri);

  const commonIntentParams = {
    data: contentUriString,
    type: APK_MIME_TYPE,
    flags: FLAG_GRANT_READ_URI_PERMISSION | FLAG_ACTIVITY_NEW_TASK,
  };

  // Try VIEW first (most compatible with content:// URIs and FileProvider); then INSTALL_PACKAGE
  let firstError: Error | null = null;
  for (const action of ['android.intent.action.VIEW', 'android.intent.action.INSTALL_PACKAGE']) {
    try {
      await IntentLauncher.startActivityAsync(action, commonIntentParams);
      return;
    } catch (e) {
      firstError = e instanceof Error ? e : new Error(String(e));
    }
  }
  const message =
    'Install could not be started. Allow "Install unknown apps" for this app in Settings > Apps > SalesInsight > Install unknown apps, then retry.';
  throw new Error(`${message} (${firstError?.message ?? 'Unknown error'})`);
}

export async function openUpdateDownload(downloadUrl: string, appName = APP_NAME): Promise<void> {
  const resolvedDownloadUrl = normalizeDownloadUrl(downloadUrl, appName);
  const canOpen = await Linking.canOpenURL(resolvedDownloadUrl);

  if (!canOpen) {
    throw new Error('Unable to open update download link.');
  }

  await Linking.openURL(resolvedDownloadUrl);
}
