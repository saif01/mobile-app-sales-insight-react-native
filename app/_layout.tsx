import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRootNavigationState, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { LogBox, View } from 'react-native';
import 'react-native-reanimated';

// Suppress "Unable to activate keep awake" on Android when activity isn't ready (harmless)
LogBox.ignoreLogs(['Unable to activate keep awake']);

import { AuthProvider, useAuth } from '@/components/auth-provider';
import { GlobalLoaderProvider } from '@/components/global-loader-provider';
import { LogoutConfirmationProvider } from '@/components/logout-confirmation-provider';
import { PreLoader } from '@/components/PreLoader';
import { UatRibbon } from '@/components/UatRibbon';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

void SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { isRestoring } = useAuth();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [minimumDelayComplete, setMinimumDelayComplete] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumDelayComplete(true);
    }, 450);

    return () => clearTimeout(timer);
  }, []);

  const isReady = Boolean(minimumDelayComplete && !isRestoring && navigationState?.key);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    SplashScreen.hideAsync().catch(() => {});
  }, [isReady]);

  useEffect(() => {
    if (!isReady || hasRedirected) {
      return;
    }

    setHasRedirected(true);
    router.replace('/login');
  }, [hasRedirected, isReady, router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="qsr-reports" options={{ headerShown: false }} />
          <Stack.Screen name="appbar-examples" options={{ headerShown: false }} />
          <Stack.Screen name="navigation-panel" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>

        {!isReady ? <PreLoader /> : null}
        <UatRibbon />
      </View>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <GlobalLoaderProvider>
        <LogoutConfirmationProvider>
          <RootLayoutContent />
        </LogoutConfirmationProvider>
      </GlobalLoaderProvider>
    </AuthProvider>
  );
}
