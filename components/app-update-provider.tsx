import { usePathname } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler } from 'react-native';

import { APP_VERSION } from '@/constants/app-version';
import { ForceUpdateModal } from '@/components/ForceUpdateModal';
import { UpdateDownloadModal } from '@/components/UpdateDownloadModal';
import { downloadAndInstallApk, fetchLatestAppVersion, getApkDownloadUrl } from '@/services/appUpdateService';
import { checkInternetConnection } from '@/utils/check-internet';
import { isVersionLower } from '@/utils/versionCompare';

export function AppUpdateProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasStartedMandatoryUpdate = useRef(false);
  const isCheckingVersionRef = useRef(false);

  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [forceUpdateRequired, setForceUpdateRequired] = useState(false);
  const [updateUrl, setUpdateUrl] = useState(getApkDownloadUrl());
  const [isInstallingUpdate, setIsInstallingUpdate] = useState(false);
  const [showUpdateProgress, setShowUpdateProgress] = useState(false);
  const [updateDownloadProgress, setUpdateDownloadProgress] = useState(0);
  const [updateDownloadError, setUpdateDownloadError] = useState<string | null>(null);

  const handleOpenUpdateUrl = useCallback(async () => {
    try {
      setShowUpdateProgress(true);
      setIsInstallingUpdate(true);
      setUpdateDownloadError(null);
      setUpdateDownloadProgress(0);
      await downloadAndInstallApk(updateUrl, {
        onProgress: ({ progress }) => {
          setUpdateDownloadProgress(progress);
        },
      });
      setShowUpdateProgress(false);
    } catch (error) {
      hasStartedMandatoryUpdate.current = false;
      const message = error instanceof Error ? error.message : 'Failed to download update. Please try again.';
      setUpdateDownloadError(message);
      setUpdateDownloadProgress(0);
    } finally {
      setIsInstallingUpdate(false);
    }
  }, [updateUrl]);

  const checkAppVersion = useCallback(async () => {
    if (isCheckingVersionRef.current) {
      return;
    }

    isCheckingVersionRef.current = true;
    try {
      const hasInternet = await checkInternetConnection();
      if (!hasInternet) {
        return;
      }

      const versionData = await fetchLatestAppVersion();
      setLatestVersion(versionData.latestVersion);
      setUpdateUrl(versionData.downloadUrl);

      const needsUpdate = isVersionLower(APP_VERSION, versionData.latestVersion);
      setForceUpdateRequired(needsUpdate);

      if (!needsUpdate) {
        hasStartedMandatoryUpdate.current = false;
        setShowUpdateProgress(false);
        setUpdateDownloadError(null);
        setUpdateDownloadProgress(0);
      }
    } catch {
      // Keep navigation usable when version checks fail.
    } finally {
      isCheckingVersionRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!pathname || pathname === '/login') {
      return;
    }

    void checkAppVersion();
  }, [checkAppVersion, pathname]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && pathname && pathname !== '/login') {
        void checkAppVersion();
      }
    });

    return () => subscription.remove();
  }, [checkAppVersion, pathname]);

  useEffect(() => {
    if (!forceUpdateRequired && !showUpdateProgress) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [forceUpdateRequired, showUpdateProgress]);

  useEffect(() => {
    if (
      !forceUpdateRequired ||
      showUpdateProgress ||
      isInstallingUpdate ||
      hasStartedMandatoryUpdate.current
    ) {
      return;
    }

    hasStartedMandatoryUpdate.current = true;
    void handleOpenUpdateUrl();
  }, [forceUpdateRequired, handleOpenUpdateUrl, isInstallingUpdate, showUpdateProgress]);

  return (
    <>
      {children}
      <ForceUpdateModal
        visible={forceUpdateRequired && !showUpdateProgress}
        installedVersion={APP_VERSION}
        latestVersion={latestVersion ?? 'Unknown'}
        onUpdatePress={handleOpenUpdateUrl}
        isUpdating={isInstallingUpdate}
      />
      <UpdateDownloadModal
        visible={showUpdateProgress}
        progress={updateDownloadProgress}
        isInstalling={isInstallingUpdate && !updateDownloadError && updateDownloadProgress >= 1}
        errorMessage={updateDownloadError}
        onRetry={handleOpenUpdateUrl}
      />
    </>
  );
}
