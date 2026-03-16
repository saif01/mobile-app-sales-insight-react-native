import { Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';

import { useAuth } from '@/components/auth-provider';
import { useGlobalLoader } from '@/components/global-loader-provider';
import { AppBar } from '@/components/navigation/AppBar';
import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { useScreenPreloader } from '@/hooks/use-screen-preloader';
import { canAccessQsrRoute, getDefaultAuthenticatedRoute } from '@/utils/access-control';
import { getWebViewToken } from '@/utils/app-config';

const WEB_VIEW_TOKEN = getWebViewToken();
const SALES_SUMMARY_URL = WEB_VIEW_TOKEN
  ? `https://qsr.cpbfivestar.com/embed/sales-summary?token=${encodeURIComponent(WEB_VIEW_TOKEN)}`
  : 'https://qsr.cpbfivestar.com/embed/sales-summary';

export default function SalesSummaryScreen() {
  const router = useRouter();
  const { accessPermissions } = useAuth();
  const { showLoader, hideLoader } = useGlobalLoader();
  useScreenPreloader({ message: 'Loading sales summary...' });

  useEffect(() => {
    return () => hideLoader();
  }, [hideLoader]);

  if (!canAccessQsrRoute(accessPermissions, 'qsr-reports/sales-summary')) {
    return <Redirect href={getDefaultAuthenticatedRoute(accessPermissions)} />;
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <AppBar
          showMenuButton
          onMenuButtonPress={() => router.push('/navigation-panel?active=qsr-reports/sales-summary')}
          title="QSR Sales"
          subtitle="Reports"
          showBottomBorder
          backgroundColor="#ffffff"
        />
        <View style={styles.webFallback}>
          <ThemedText type="title">Sales Summary</ThemedText>
          <ExternalLink href={SALES_SUMMARY_URL}>
            <ThemedText type="link">Open sales summary report</ThemedText>
          </ExternalLink>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <AppBar
        showMenuButton
        onMenuButtonPress={() => router.push('/navigation-panel?active=qsr-reports/sales-summary')}
        title="QSR Sales"
        subtitle="Reports"
        showBottomBorder
        backgroundColor="#ffffff"
      />
      <WebView
        source={{ uri: SALES_SUMMARY_URL }}
        style={styles.webview}
        onLoadStart={() => showLoader('Loading sales summary...')}
        onLoadEnd={hideLoader}
        onError={hideLoader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
});
