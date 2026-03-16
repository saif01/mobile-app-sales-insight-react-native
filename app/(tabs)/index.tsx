import { useRouter } from 'expo-router';
import { BarChart3, ChevronRight, LockKeyhole, LogOut } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/components/auth-provider';
import { useLogoutConfirmation } from '@/components/logout-confirmation-provider';
import { AppBar } from '@/components/navigation/AppBar';
import { getAuthHost } from '@/services/auth-api';
import { getDefaultQsrRoute, hasAnyAccessPermission, hasAnyQsrReportAccess } from '@/utils/access-control';
import { getAppName } from '@/utils/app-config';

const ANIM_DURATION = 400;
const STAGGER = 80;

const DEFAULT_AVATAR = require('@/assets/images/icon.png');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accessPermissions, userProfile } = useAuth();
  const confirmLogout = useLogoutConfirmation();
  const defaultQsrRoute = getDefaultQsrRoute(accessPermissions);
  const hasAnyAccess = hasAnyAccessPermission(accessPermissions);
  const [userImageError, setUserImageError] = useState(false);
  const host = getAuthHost();
  const userImageUri =
    userProfile?.image?.trim() ?
      (userProfile.image!.startsWith('http') ? userProfile.image! : `${host}/images/users/small/${userProfile.image!.replace(/^\//, '')}`)
      : null;
  const showDefaultAvatar = !userImageUri || userImageError;

  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const welcomeTranslate = useRef(new Animated.Value(20)).current;
  const welcomeScale = useRef(new Animated.Value(0.9)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(24)).current;
  const qsrOpacity = useRef(new Animated.Value(0)).current;
  const qsrTranslate = useRef(new Animated.Value(24)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const bottomTranslate = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const welcomeAnim = Animated.parallel([
      Animated.timing(welcomeOpacity, {
        toValue: 1,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(welcomeTranslate, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(welcomeScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 14,
        stiffness: 120,
      }),
    ]);

    const iconPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1.08,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
      { resetBeforeIteration: true }
    );

    const cardAnim = Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslate, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
    ]);

    const qsrAnim = Animated.parallel([
      Animated.timing(qsrOpacity, {
        toValue: 1,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(qsrTranslate, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
    ]);

    const bottomAnim = Animated.parallel([
      Animated.timing(bottomOpacity, {
        toValue: 1,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(bottomTranslate, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
    ]);

    const sequence = Animated.stagger(STAGGER, [
      welcomeAnim,
      ...(hasAnyAccess ? [] : [cardAnim]),
      ...(hasAnyQsrReportAccess(accessPermissions) && defaultQsrRoute ? [qsrAnim] : []),
      bottomAnim,
    ]);
    sequence.start();
    iconPulseLoop.start();
    return () => iconPulseLoop.stop();
  }, [hasAnyAccess, accessPermissions, defaultQsrRoute]);

  const welcomeAnimatedStyle = {
    opacity: welcomeOpacity,
    transform: [
      { translateY: welcomeTranslate },
      { scale: welcomeScale },
    ],
  };
  const iconBadgeStyle = {
    transform: [{ scale: iconPulse }],
  };
  const cardAnimatedStyle = {
    opacity: cardOpacity,
    transform: [{ translateY: cardTranslate }],
  };
  const qsrAnimatedStyle = {
    opacity: qsrOpacity,
    transform: [{ translateY: qsrTranslate }],
  };
  const bottomAnimatedStyle = {
    opacity: bottomOpacity,
    transform: [{ translateY: bottomTranslate }],
  };

  return (
    <ImageBackground source={require('@/assets/images/cpbit/home_bg.jpg')} resizeMode="cover" style={styles.backgroundImage}>
      <View style={styles.container}>
        <View style={styles.backgroundOverlay}>
          <AppBar
            showMenuButton
            title={getAppName()}
            subtitle={userProfile?.image ? 'Signed in' : 'Signed in (no profile image)'}
            showBottomBorder
            backgroundColor="rgba(255,255,255,0.94)"
            titleColor="#0c2445"
            subtitleColor="#556987"
            onMenuButtonPress={() => router.push('/navigation-panel?active=index')}
          />

          <View style={styles.content}>
            <View style={styles.topSection}>
              <Animated.View style={[styles.welcomeBlock, welcomeAnimatedStyle]}>
                <Animated.View style={[styles.userAvatarWrap, iconBadgeStyle]}>
                  {showDefaultAvatar ? (
                    <Image source={DEFAULT_AVATAR} style={styles.userAvatar} resizeMode="contain" />
                  ) : (
                    <Image
                      source={{ uri: userImageUri! }}
                      style={styles.userAvatar}
                      onError={() => setUserImageError(true)}
                    />
                  )}
                </Animated.View>
                <Text style={styles.userName}>{userProfile?.name ?? 'Guest'}</Text>
              </Animated.View>

              {!hasAnyAccess ? (
                <Animated.View style={[styles.noAccessCard, cardAnimatedStyle]}>
                  <View style={styles.noAccessIconWrap}>
                    <LockKeyhole size={24} color="#b45309" strokeWidth={2} />
                  </View>
                  <View style={styles.noAccessContent}>
                    <Text style={styles.noAccessTitle}>No access assigned</Text>
                    <Text style={styles.noAccessText}>
                      Your account signed in successfully, but no permissions were returned. Contact your administrator to get access to reports.
                    </Text>
                  </View>
                </Animated.View>
              ) : null}

              {hasAnyQsrReportAccess(accessPermissions) && defaultQsrRoute ? (
                <Animated.View style={qsrAnimatedStyle}>
                  <Pressable
                    onPress={() => defaultQsrRoute && router.push(defaultQsrRoute as '/qsr-reports/sales' | '/qsr-reports/sales-summary')}
                    style={({ pressed }) => [
                      styles.qsrLinkCard,
                      pressed && styles.pressedScale,
                    ]}>
                    <View style={styles.qsrCardLeft}>
                      <View style={styles.qsrLogoWrap}>
                        <Image
                          source={require('@/assets/images/qsr/qsr_logo.png')}
                          style={styles.qsrLogo}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.qsrCardTextWrap}>
                        <Text style={styles.qsrLinkText}>QSR Sales Reports</Text>
                        <Text style={styles.qsrLinkHint}>View reports</Text>
                      </View>
                    </View>
                    <View style={styles.qsrCardRight}>
                      <BarChart3 size={20} color="#0f3567" strokeWidth={2} />
                      <ChevronRight size={20} color="#0f3567" strokeWidth={2.5} />
                    </View>
                  </Pressable>
                </Animated.View>
              ) : null}
            </View>

            <Animated.View style={[styles.bottomSection, bottomAnimatedStyle, { paddingBottom: 24 + insets.bottom }]}>
              <Pressable
                onPress={() => confirmLogout({})}
                style={({ pressed }) => [styles.logoutButton, pressed && styles.pressedScale]}>
                <LogOut size={20} color="#ffffff" strokeWidth={2} />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(248, 251, 255, 0.45)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  topSection: {
    gap: 16,
  },
  bottomSection: {
    paddingTop: 16,
  },
  welcomeBlock: {
    alignItems: 'center',
    gap: 10,
  },
  userAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#0d2d57',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0c2445',
    textAlign: 'center',
  },
  noAccessCard: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 82, 0.5)',
    backgroundColor: 'rgba(255, 249, 235, 0.98)',
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: '#7a4b00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  noAccessIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(244, 179, 80, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAccessContent: {
    flex: 1,
    gap: 6,
  },
  noAccessTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400e',
    letterSpacing: 0.2,
  },
  noAccessText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#a16207',
  },
  qsrLinkCard: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#dbe8fb',
    borderWidth: 1,
    borderColor: '#b8d4f5',
    shadowColor: '#0f3567',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  qsrCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  qsrLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  qsrLogo: {
    width: 40,
    height: 40,
  },
  qsrCardTextWrap: {
    gap: 2,
  },
  qsrLinkText: {
    color: '#0f3567',
    fontWeight: '700',
    fontSize: 16,
  },
  qsrLinkHint: {
    color: '#3d6ba8',
    fontSize: 13,
    fontWeight: '500',
  },
  qsrCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoutButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0d2d57',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#0d2d57',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  pressed: {
    opacity: 0.9,
  },
  pressedScale: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
