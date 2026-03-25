import * as Updates from 'expo-updates';
import * as WebBrowser from 'expo-web-browser';
import {
  ArrowUpRight,
  BookText,
  Building2,
  CircleCheckBig,
  HeartHandshake,
  Info,
  LifeBuoy,
  RefreshCw,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AboutCard } from '@/components/about/AboutCard';
import { AppBar } from '@/components/navigation/AppBar';
import { APP_NAME, APP_VERSION } from '@/constants/app-version';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { fetchLatestAppVersion, getApkDownloadUrl, openUpdateDownload } from '@/services/appUpdateService';
import {
  getAboutCompanyWebsite,
  getAboutDeveloperName,
  getAboutSupportEmail,
  getAboutSupportPhone,
} from '@/utils/app-config';
import { compareVersions } from '@/utils/versionCompare';

const APP_LOGO = require('@/assets/images/icon.png');

const COMPANY_NAME = 'CPB-IT';
const TAGLINE = 'Reliable reporting and business visibility.';

type InfoRowProps = {
  label: string;
  value: string;
  subdued?: boolean;
};

type LinkRowProps = {
  label: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
};

type ActionButtonProps = {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  primary?: boolean;
};

type HeroStatProps = {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  value: string;
};

function getLastUpdatedLabel(): string {
  const updateCreatedAt = (Updates as { createdAt?: Date | string }).createdAt;
  if (updateCreatedAt instanceof Date) {
    return updateCreatedAt.toLocaleDateString();
  }

  if (typeof updateCreatedAt === 'string') {
    const parsed = new Date(updateCreatedAt);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString();
    }
  }

  return 'Not available';
}

function InfoRow({ label, value, subdued = false }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, subdued && styles.infoValueSubdued]}>{value}</Text>
    </View>
  );
}

function LinkRow({ label, value, onPress, disabled = false }: LinkRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ color: 'rgba(15, 53, 103, 0.08)' }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.linkRow,
        disabled && styles.linkRowDisabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <View style={styles.linkTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text numberOfLines={1} style={styles.linkValue}>
          {value}
        </Text>
      </View>
      <ArrowUpRight size={18} color={disabled ? '#9badc5' : '#0f3567'} strokeWidth={2.1} />
    </Pressable>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onPress,
  disabled = false,
  loading = false,
  primary = false,
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ color: primary ? 'rgba(255,255,255,0.14)' : 'rgba(15, 53, 103, 0.08)' }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        primary ? styles.actionButtonPrimary : styles.actionButtonSecondary,
        (disabled || loading) && styles.actionButtonDisabled,
        pressed && !(disabled || loading) && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={primary ? '#ffffff' : '#0f3567'} />
      ) : (
        <Icon size={18} color={primary ? '#ffffff' : '#0f3567'} strokeWidth={2.1} />
      )}
      <Text style={[styles.actionButtonText, primary ? styles.actionButtonTextPrimary : styles.actionButtonTextSecondary]}>
        {label}
      </Text>
    </Pressable>
  );
}

function HeroStat({ icon: Icon, label, value }: HeroStatProps) {
  return (
    <View style={styles.heroStat}>
      <View style={styles.heroStatIconWrap}>
        <Icon size={16} color="#163b6d" strokeWidth={2.1} />
      </View>
      <View style={styles.heroStatText}>
        <Text style={styles.heroStatValue}>{value}</Text>
        <Text style={styles.heroStatLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function AboutAppScreen() {
  const { isOnline, isChecking } = useNetworkStatus();
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(18)).current;
  const logoScale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 13,
        stiffness: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, logoScale, translateAnim]);

  const lastUpdated = useMemo(() => getLastUpdatedLabel(), []);
  const companyWebsite = useMemo(() => getAboutCompanyWebsite(), []);
  const supportEmail = useMemo(() => getAboutSupportEmail(), []);
  const supportPhone = useMemo(() => getAboutSupportPhone(), []);
  const developerName = useMemo(() => getAboutDeveloperName(), []);
  const apkDownloadUrl = useMemo(() => getApkDownloadUrl(), []);
  const supportEmailLink = useMemo(() => `mailto:${supportEmail}`, [supportEmail]);
  const supportPhoneLink = useMemo(() => `tel:${supportPhone}`, [supportPhone]);

  const openExternalUrl = async (url: string) => {
    if (!isOnline && /^https?:/i.test(url)) {
      Alert.alert('Offline', 'Connect to the internet to open this link.');
      return;
    }

    try {
      if (/^https?:/i.test(url)) {
        await WebBrowser.openBrowserAsync(url, {
          controlsColor: '#0f3567',
        });
        return;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        throw new Error('Unsupported URL');
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link', 'The requested link could not be opened on this device.');
    }
  };

  const handleCheckForUpdates = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Internet is required to check for updates.');
      return;
    }

    setIsCheckingUpdate(true);
    try {
      const versionData = await fetchLatestAppVersion();
      const comparison = compareVersions(APP_VERSION, versionData.latestVersion);

      if (comparison < 0) {
        Alert.alert(
          'Update available',
          `A newer version (${versionData.latestVersion}) is available.`,
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Open download',
              onPress: () => {
                void openUpdateDownload(versionData.downloadUrl).catch((error: unknown) => {
                  const message = error instanceof Error ? error.message : 'Unable to open update link.';
                  Alert.alert('Update failed', message);
                });
              },
            },
          ]
        );
        return;
      }

      Alert.alert('Up to date', `You are already using the latest version (${APP_VERSION}).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to check for updates right now.';
      Alert.alert('Update check failed', message);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${APP_NAME} by ${COMPANY_NAME}\n${apkDownloadUrl}`,
        title: `${APP_NAME} app`,
      });
    } catch {
      Alert.alert('Share unavailable', 'Unable to open the share dialog on this device.');
    }
  };

  const containerAnimatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: translateAnim }],
  };

  const logoAnimatedStyle = {
    transform: [{ scale: logoScale }],
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppBar
        showBackButton
        title="About App"
        subtitle="Version, support, and company details"
        showBottomBorder
        backgroundColor="#f6f9fd"
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={containerAnimatedStyle}>
          <View style={styles.heroCard}>
            <View style={styles.heroOrbOne} />
            <View style={styles.heroOrbTwo} />
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Sparkles size={14} color="#163b6d" strokeWidth={2.2} />
                <Text style={styles.heroBadgeText}>Smart Business App</Text>
              </View>
              <View style={[styles.statusPill, isOnline ? styles.statusPillOnline : styles.statusPillOffline]}>
                <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
                <Text style={[styles.statusPillText, !isOnline && styles.statusPillTextOffline]}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
            <Animated.View style={[styles.logoWrap, logoAnimatedStyle]}>
              <Image source={APP_LOGO} style={styles.logo} resizeMode="contain" />
            </Animated.View>
            <Text style={styles.appName}>{APP_NAME}</Text>
            <Text style={styles.tagline}>{TAGLINE}</Text>
            <View style={styles.heroStatsRow}>
              <HeroStat icon={CircleCheckBig} label="Version" value={`v${APP_VERSION}`} />
            </View>
            {!isOnline && !isChecking ? (
              <View style={styles.offlineBadge}>
                <Sparkles size={14} color="#8a5a00" strokeWidth={2.2} />
                <Text style={styles.offlineText}>Offline mode: links and update checks need internet access.</Text>
              </View>
            ) : null}
          </View>
        </Animated.View>

        <Animated.View style={containerAnimatedStyle}>
          <AboutCard title="Version Info" icon={Smartphone}>
            <InfoRow label="App Version" value={`v${APP_VERSION}`} />
            <InfoRow label="Last Updated" value={lastUpdated} subdued={lastUpdated === 'Not available'} />
          </AboutCard>

          <AboutCard title="Company Info" icon={Building2}>
            <InfoRow label="Powered By" value="CPB-IT" />
            <InfoRow label="Developer" value={developerName} />
            <LinkRow label="Website" value={companyWebsite} onPress={() => void openExternalUrl(companyWebsite)} disabled={!isOnline && !isChecking} />
          </AboutCard>

          <AboutCard title="Credits" icon={BookText}>
            <InfoRow label="Core Stack" value="Expo Router, React Native, TypeScript" />
            <InfoRow label="UI & Icons" value="Lucide React Native, Safe Area Context" />
            <InfoRow label="Data & Platform" value="Axios, Expo Updates, WebView support" />
          </AboutCard>

          <AboutCard title="Support" icon={LifeBuoy}>
            <LinkRow label="Email" value={supportEmail} onPress={() => void openExternalUrl(supportEmailLink)} />
            <LinkRow label="Phone" value={supportPhone} onPress={() => void openExternalUrl(supportPhoneLink)} />
          </AboutCard>

          <AboutCard title="Actions" icon={Info}>
            <View style={styles.actionGrid}>
              <ActionButton
                label="Check for Updates"
                icon={RefreshCw}
                onPress={handleCheckForUpdates}
                loading={isCheckingUpdate}
                disabled={!isOnline && !isChecking}
                primary
              />
              <ActionButton label="Share App" icon={Share2} onPress={handleShare} />
            </View>
          </AboutCard>
        </Animated.View>

        <View style={styles.footer}>
          <ShieldCheck size={16} color="#58708d" strokeWidth={2.1} />
          <Text style={styles.footerText}>Powered by CPB-IT</Text>
          <HeartHandshake size={16} color="#58708d" strokeWidth={2.1} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef4fb',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 14,
  },
  heroCard: {
    position: 'relative',
    borderRadius: 26,
    backgroundColor: '#f7fbff',
    borderWidth: 1,
    borderColor: '#d8e5f4',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    overflow: 'hidden',
    shadowColor: '#102644',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
    gap: 10,
  },
  heroOrbOne: {
    position: 'absolute',
    top: -28,
    right: -10,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(62, 111, 184, 0.12)',
  },
  heroOrbTwo: {
    position: 'absolute',
    bottom: -34,
    left: -18,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(132, 180, 228, 0.14)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroBadge: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: '#e9f2ff',
    borderWidth: 1,
    borderColor: '#d4e2f7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#163b6d',
  },
  statusPill: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
  },
  statusPillOnline: {
    backgroundColor: '#ecfbf2',
    borderColor: '#c7ead4',
  },
  statusPillOffline: {
    backgroundColor: '#fff6e5',
    borderColor: '#f0d8a0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotOnline: {
    backgroundColor: '#1d8f4f',
  },
  statusDotOffline: {
    backgroundColor: '#b7791f',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d8f4f',
  },
  statusPillTextOffline: {
    color: '#8a5a00',
  },
  logoWrap: {
    alignSelf: 'center',
    width: 92,
    height: 92,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#d8e5f5',
    shadowColor: '#163252',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
  },
  appName: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: '#0c2445',
    letterSpacing: 0.2,
  },
  tagline: {
    alignSelf: 'center',
    fontSize: 13,
    lineHeight: 19,
    color: '#60748d',
    textAlign: 'center',
    maxWidth: 290,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroStat: {
    flex: 1,
    minHeight: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: '#dbe6f4',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroStatIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#edf4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatText: {
    flex: 1,
    gap: 2,
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#102644',
  },
  heroStatLabel: {
    fontSize: 12,
    color: '#64778f',
    fontWeight: '600',
  },
  offlineBadge: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#fff6e5',
    borderWidth: 1,
    borderColor: '#f0d8a0',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  offlineText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#8a5a00',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 28,
  },
  infoLabel: {
    flex: 1,
    fontSize: 13,
    color: '#667a91',
    fontWeight: '600',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#102644',
    fontWeight: '700',
    textAlign: 'right',
  },
  infoValueSubdued: {
    color: '#8aa0b9',
  },
  linkRow: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#f2f7fd',
    borderWidth: 1,
    borderColor: '#dce6f2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkRowDisabled: {
    opacity: 0.55,
  },
  linkTextWrap: {
    flex: 1,
    gap: 2,
  },
  linkValue: {
    fontSize: 14,
    color: '#0f3567',
    fontWeight: '700',
  },
  actionGrid: {
    gap: 10,
  },
  actionButton: {
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionButtonPrimary: {
    backgroundColor: '#123a70',
    shadowColor: '#123a70',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 3,
  },
  actionButtonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d6e2f3',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionButtonTextPrimary: {
    color: '#ffffff',
  },
  actionButtonTextSecondary: {
    color: '#0f3567',
  },
  footer: {
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#58708d',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.86,
  },
});
