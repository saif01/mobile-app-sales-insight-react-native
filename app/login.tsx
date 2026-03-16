import { Redirect, useRouter } from 'expo-router';
import { Eye, EyeOff, Fingerprint, Lock, LogIn, UserRound, WifiOff } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  Alert,
  BackHandler,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter } from '@/components/AppFooter';
import {
  BIOMETRIC_CANCELLED_CODE,
  BIOMETRIC_CREDENTIALS_INVALID_CODE,
  AuthFlowError,
  useAuth,
} from '@/components/auth-provider';
import { ForceUpdateModal } from '@/components/ForceUpdateModal';
import { PreLoader } from '@/components/PreLoader';
import { UpdateDownloadModal } from '@/components/UpdateDownloadModal';
import { useNetworkStatus } from '@/hooks/use-network-status';
import {
  downloadAndInstallApk,
  fetchLatestAppVersion,
  getApkDownloadUrl,
} from '@/services/appUpdateService';
import { useScreenPreloader } from '@/hooks/use-screen-preloader';
import { APP_VERSION } from '@/constants/app-version';
import { checkInternetConnection } from '@/utils/check-internet';
import { getAppName } from '@/utils/app-config';
import { getDefaultAuthenticatedRoute } from '@/utils/access-control';
import { isVersionLower } from '@/utils/versionCompare';

type FormErrors = {
  loginId?: string;
  password?: string;
  form?: string;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 740;
const isTablet = screenWidth >= 600;

export default function LoginScreen() {
  const router = useRouter();
  const {
    biometricSupport,
    canAttemptBiometricLogin,
    isAuthenticated,
    isRestoring,
    login,
    loginWithBiometrics,
    rememberedLoginId,
  } = useAuth();
  const { isOnline, refreshStatus } = useNetworkStatus();
  useScreenPreloader({ message: 'Preparing login...', durationMs: 450 });
  const passwordRef = useRef<TextInput>(null);
  const hasAutoPromptedBiometric = useRef(false);
  const hasStartedMandatoryUpdate = useRef(false);
  const installedVersion = APP_VERSION;

  const [loginId, setLoginId] = useState(rememberedLoginId);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [isRegisteringBiometric, setIsRegisteringBiometric] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [isCheckingVersion, setIsCheckingVersion] = useState(true);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [forceUpdateRequired, setForceUpdateRequired] = useState(false);
  const [versionCheckError, setVersionCheckError] = useState<string | null>(null);
  const [updateUrl, setUpdateUrl] = useState(getApkDownloadUrl());
  const [isInstallingUpdate, setIsInstallingUpdate] = useState(false);
  const [showUpdateProgress, setShowUpdateProgress] = useState(false);
  const [updateDownloadProgress, setUpdateDownloadProgress] = useState(0);
  const [updateDownloadError, setUpdateDownloadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showManualLogin, setShowManualLogin] = useState(!canAttemptBiometricLogin);
  const [isLoginIdFocused, setIsLoginIdFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const orbOneAnim = useRef(new Animated.Value(0)).current;
  const orbTwoAnim = useRef(new Animated.Value(0)).current;
  const orbThreeAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const authProgressAnim = useRef(new Animated.Value(0)).current;
  const getInitialAuthProgressMessage = useCallback(() => {
    if (isBiometricLoading) {
      return 'Verifying your fingerprint and signing you in...';
    }

    if (isRegisteringBiometric) {
      return 'Submitting your details and enabling fingerprint login...';
    }

    return 'Submitting your credentials...';
  }, [isBiometricLoading, isRegisteringBiometric]);
  const [authProgressMessage, setAuthProgressMessage] = useState('Submitting your credentials...');

  const inputDisabled =
    loading ||
    isBiometricLoading ||
    isRegisteringBiometric ||
    isCheckingConnection ||
    isCheckingVersion ||
    forceUpdateRequired;
  const isAuthRequestInFlight = loading || isRegisteringBiometric || isBiometricLoading;

  const checkAppVersion = useCallback(async (): Promise<boolean> => {
    setIsCheckingVersion(true);
    setVersionCheckError(null);

    try {
      const hasInternet = await checkInternetConnection();

      if (!hasInternet) {
        setForceUpdateRequired(false);
        hasStartedMandatoryUpdate.current = false;
        setVersionCheckError('Internet is required to verify app version. Please reconnect and retry.');
        return false;
      }

      const versionData = await fetchLatestAppVersion();
      setLatestVersion(versionData.latestVersion);
      setUpdateUrl(versionData.downloadUrl);

      const needsUpdate = isVersionLower(installedVersion, versionData.latestVersion);
      setForceUpdateRequired(needsUpdate);
      if (!needsUpdate) {
        hasStartedMandatoryUpdate.current = false;
      }
      setVersionCheckError(null);
      return !needsUpdate;
    } catch (error) {
      setForceUpdateRequired(false);
      hasStartedMandatoryUpdate.current = false;
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Unable to verify app version right now. Please try again.';
      setVersionCheckError(message);
      return false;
    } finally {
      setIsCheckingVersion(false);
    }
  }, [installedVersion]);

  useEffect(() => {
    setLoginId(rememberedLoginId);
  }, [rememberedLoginId]);

  useEffect(() => {
    setShowManualLogin(!canAttemptBiometricLogin);

    if (!canAttemptBiometricLogin) {
      hasAutoPromptedBiometric.current = false;
    }
  }, [canAttemptBiometricLogin]);

  useEffect(() => {
    const orbOneLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbOneAnim, { toValue: 1, duration: 5500, useNativeDriver: true }),
        Animated.timing(orbOneAnim, { toValue: 0, duration: 5500, useNativeDriver: true }),
      ])
    );
    const orbTwoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbTwoAnim, { toValue: 1, duration: 6800, useNativeDriver: true }),
        Animated.timing(orbTwoAnim, { toValue: 0, duration: 6800, useNativeDriver: true }),
      ])
    );
    const orbThreeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbThreeAnim, { toValue: 1, duration: 6100, useNativeDriver: true }),
        Animated.timing(orbThreeAnim, { toValue: 0, duration: 6100, useNativeDriver: true }),
      ])
    );

    orbOneLoop.start();
    orbTwoLoop.start();
    orbThreeLoop.start();

    return () => {
      orbOneLoop.stop();
      orbTwoLoop.stop();
      orbThreeLoop.stop();
    };
  }, [orbOneAnim, orbThreeAnim, orbTwoAnim]);

  useEffect(() => {
    Animated.timing(formAnim, {
      toValue: 1,
      duration: 520,
      delay: 150,
      useNativeDriver: true,
    }).start();
  }, [formAnim]);

  useEffect(() => {
    if (!isAuthRequestInFlight) {
      authProgressAnim.stopAnimation();
      authProgressAnim.setValue(0);
      setAuthProgressMessage(getInitialAuthProgressMessage());
      return undefined;
    }

    setAuthProgressMessage(getInitialAuthProgressMessage());
    const messageTimers = [
      setTimeout(
        () =>
          setAuthProgressMessage(
            isBiometricLoading
              ? 'Contacting authentication server after fingerprint verification...'
              : isRegisteringBiometric
                ? 'Saving your fingerprint login setup...'
                : 'Contacting authentication server...'
          ),
        900
      ),
      setTimeout(
        () =>
          setAuthProgressMessage(
            isBiometricLoading
              ? 'Waiting for fingerprint sign-in response...'
              : isRegisteringBiometric
                ? 'Waiting for enrollment confirmation...'
                : 'Waiting for sign-in response...'
          ),
        2200
      ),
      setTimeout(
        () =>
          setAuthProgressMessage(
            isBiometricLoading
              ? 'Completing secure fingerprint login...'
              : isRegisteringBiometric
                ? 'Completing fingerprint registration...'
                : 'Completing secure login...'
          ),
        4200
      ),
    ];

    authProgressAnim.setValue(0.1);
    Animated.sequence([
      Animated.timing(authProgressAnim, {
        toValue: 0.32,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(authProgressAnim, {
        toValue: 0.58,
        duration: 1300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(authProgressAnim, {
        toValue: 0.82,
        duration: 2200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(authProgressAnim, {
        toValue: 0.9,
        duration: 2800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();

    return () => {
      authProgressAnim.stopAnimation();
      messageTimers.forEach(clearTimeout);
    };
  }, [authProgressAnim, getInitialAuthProgressMessage, isAuthRequestInFlight, isBiometricLoading, isRegisteringBiometric]);

  useEffect(() => {
    void checkAppVersion();
  }, [checkAppVersion]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void checkAppVersion();
      }
    });

    return () => subscription.remove();
  }, [checkAppVersion]);

  useEffect(() => {
    if (!forceUpdateRequired && !showUpdateProgress) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [forceUpdateRequired, showUpdateProgress]);

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
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to download update. Please try again.';
      setUpdateDownloadError(message);
      setUpdateDownloadProgress(0);
      Alert.alert('Update Failed', message);
    } finally {
      setIsInstallingUpdate(false);
    }
  }, [updateUrl]);

  useEffect(() => {
    if (
      !forceUpdateRequired ||
      isCheckingVersion ||
      Boolean(versionCheckError) ||
      showUpdateProgress ||
      isInstallingUpdate ||
      hasStartedMandatoryUpdate.current
    ) {
      return;
    }

    hasStartedMandatoryUpdate.current = true;
    void handleOpenUpdateUrl();
  }, [
    forceUpdateRequired,
    handleOpenUpdateUrl,
    isCheckingVersion,
    isInstallingUpdate,
    showUpdateProgress,
    versionCheckError,
  ]);

  const orbOneStyle = {
    transform: [
      { translateY: orbOneAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }) },
      { translateX: orbOneAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
    ],
  };

  const orbTwoStyle = {
    transform: [
      { translateY: orbTwoAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -16] }) },
      { translateX: orbTwoAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) },
      { scale: orbTwoAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) },
    ],
  };

  const orbThreeStyle = {
    transform: [
      { translateY: orbThreeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) },
      { translateX: orbThreeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) },
    ],
  };

  const formEntranceStyle = {
    opacity: formAnim,
    transform: [
      {
        translateY: formAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [28, 0],
        }),
      },
    ],
  };
  const authProgressWidth = authProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const onLoginChange = (value: string) => {
    setLoginId(value);
    setErrors((prev) => ({ ...prev, loginId: undefined, form: undefined }));
  };

  const onPasswordChange = (value: string) => {
    setPassword(value);
    setErrors((prev) => ({ ...prev, password: undefined, form: undefined }));
  };

  const ensureInternetConnection = useCallback(async () => {
    setIsCheckingConnection(true);
    const hasInternet = await checkInternetConnection();
    setIsCheckingConnection(false);

    if (!hasInternet) {
      const message = 'No internet connection. Please check your network and try again.';
      setErrors((prev) => ({ ...prev, form: message }));
      Alert.alert('No Internet', message);
      return false;
    }

    return true;
  }, []);

  const confirmBiometricEnrollment = useCallback(() => {
    if (!biometricSupport?.isAvailable) {
      return Promise.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        'Enable Fingerprint Login',
        `Use ${biometricSupport.label.toLowerCase()} authentication for your next sign-in on this device?`,
        [
          { text: 'Not Now', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Enable', onPress: () => resolve(true) },
        ]
      );
    });
  }, [biometricSupport]);

  const validate = useCallback(() => {
    const nextErrors: FormErrors = {};

    if (!loginId.trim()) {
      nextErrors.loginId = 'AD ID is required.';
    }
    if (!password.trim()) {
      nextErrors.password = 'AD Password is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [loginId, password]);

  const handleSubmit = async () => {
    if (forceUpdateRequired || isCheckingVersion || versionCheckError) {
      return;
    }

    const isUpToDate = await checkAppVersion();
    if (!isUpToDate) {
      return;
    }

    if (!validate()) {
      return;
    }

    const hasInternet = await ensureInternetConnection();
    if (!hasInternet) {
      return;
    }

    try {
      setLoading(true);
      const accessPermissions = await login({ loginId, password, rememberMe: true, enableBiometric: false });
      router.replace(getDefaultAuthenticatedRoute(accessPermissions));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setErrors((prev) => ({ ...prev, form: message }));
    } finally {
      setLoading(false);
    }
  };

  const handleFingerprintRegistration = useCallback(async () => {
    if (forceUpdateRequired || isCheckingVersion || versionCheckError) {
      return;
    }

    const isUpToDate = await checkAppVersion();
    if (!isUpToDate) {
      return;
    }

    if (!validate()) {
      return;
    }

    if (!biometricSupport?.isAvailable) {
      const message = biometricSupport?.hasHardware
        ? 'No fingerprint or biometric enrollment was found on this device.'
        : 'Biometric authentication is not available on this device.';
      setErrors((prev) => ({ ...prev, form: message }));
      return;
    }

    const hasInternet = await ensureInternetConnection();
    if (!hasInternet) {
      return;
    }

    try {
      setErrors((prev) => ({ ...prev, form: undefined }));
      setIsRegisteringBiometric(true);

      const shouldEnableBiometric = await confirmBiometricEnrollment();
      if (!shouldEnableBiometric) {
        return;
      }

      const accessPermissions = await login({
        loginId,
        password,
        rememberMe: true,
        enableBiometric: true,
      });

      Alert.alert('Fingerprint Registered', 'Fingerprint login has been enabled for future sign-ins.');
      router.replace(getDefaultAuthenticatedRoute(accessPermissions));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Fingerprint registration failed. Please try again.';
      setErrors((prev) => ({ ...prev, form: message }));
    } finally {
      setIsRegisteringBiometric(false);
    }
  }, [
    biometricSupport,
    confirmBiometricEnrollment,
    ensureInternetConnection,
    forceUpdateRequired,
    isCheckingVersion,
    login,
    loginId,
    password,
    router,
    validate,
    checkAppVersion,
    versionCheckError,
  ]);

  const handleBiometricLogin = useCallback(async () => {
    if (forceUpdateRequired || isCheckingVersion || versionCheckError || isBiometricLoading || loading) {
      return;
    }

    const isUpToDate = await checkAppVersion();
    if (!isUpToDate) {
      return;
    }

    const hasInternet = await ensureInternetConnection();
    if (!hasInternet) {
      return;
    }

    try {
      setErrors((prev) => ({ ...prev, form: undefined }));
      setIsBiometricLoading(true);
      const accessPermissions = await loginWithBiometrics();
      router.replace(getDefaultAuthenticatedRoute(accessPermissions));
    } catch (error) {
      if (error instanceof AuthFlowError && error.code === BIOMETRIC_CANCELLED_CODE) {
        return;
      }

      const message =
        error instanceof AuthFlowError && error.code === BIOMETRIC_CREDENTIALS_INVALID_CODE
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Fingerprint login failed. Please sign in with your AD ID and password.';

      if (error instanceof AuthFlowError && error.code === BIOMETRIC_CREDENTIALS_INVALID_CODE) {
        setShowManualLogin(true);
      }

      setPassword('');
      setErrors((prev) => ({ ...prev, form: message }));
    } finally {
      setIsBiometricLoading(false);
    }
  }, [
    ensureInternetConnection,
    forceUpdateRequired,
    isBiometricLoading,
    isCheckingVersion,
    loading,
    loginWithBiometrics,
    router,
    checkAppVersion,
    versionCheckError,
  ]);

  useEffect(() => {
    if (
      showManualLogin ||
      hasAutoPromptedBiometric.current ||
      !canAttemptBiometricLogin ||
      isCheckingVersion ||
      forceUpdateRequired ||
      Boolean(versionCheckError)
    ) {
      return;
    }

    hasAutoPromptedBiometric.current = true;
    void handleBiometricLogin();
  }, [
    canAttemptBiometricLogin,
    forceUpdateRequired,
    handleBiometricLogin,
    isCheckingVersion,
    showManualLogin,
    versionCheckError,
  ]);

  if (isRestoring) {
    return <PreLoader />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ImageBackground
      source={require('@/assets/images/cpbit/login_bg.jpg')}
      resizeMode="cover"
      style={styles.backgroundImage}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backgroundOverlay}>
          {!isOnline ? (
            <View style={styles.offlineBanner}>
              <View style={styles.offlineInfo}>
                <WifiOff size={14} color="#7f1d1d" strokeWidth={2.4} />
                <Text style={styles.offlineBannerText}>You are offline</Text>
              </View>
              <Pressable
                onPress={refreshStatus}
                style={({ pressed }) => [styles.retryInline, pressed && styles.pressed]}>
                <Text style={styles.retryInlineText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.contentWrapper}>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>

                <Animated.View style={[styles.bgOrbOne, orbOneStyle]} />
                <Animated.View style={[styles.bgOrbTwo, orbTwoStyle]} />
                <Animated.View style={[styles.bgOrbThree, orbThreeStyle]} />

                {/* ── Hero ── */}
                <View style={styles.heroArea}>
                  <View style={styles.logoRing}>
                    <Image
                      source={require('@/assets/images/icon.png')}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.appTitle}>{getAppName()}</Text>
                  <Text style={styles.appTagline}>Mobile Portal</Text>
                </View>

                {/* ── Card ── */}
                <Animated.View style={[styles.card, formEntranceStyle]}>

                  {/* Card header */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>
                      {showManualLogin ? 'Welcome Back' : 'Fingerprint Login'}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {showManualLogin
                        ? 'Sign in to your account'
                        : 'Sign in with your registered fingerprint'}
                    </Text>
                  </View>

                  {/* Inputs / Biometric panel */}
                  {showManualLogin ? (
                    <View style={styles.inputsGroup}>
                      {/* AD ID */}
                      <View>
                        <View
                          style={[
                            styles.inputRow,
                            isLoginIdFocused && styles.inputFocused,
                            errors.loginId ? styles.inputError : null,
                          ]}>
                          <View style={styles.inputIconWrap}>
                            <UserRound
                              size={17}
                              color={
                                errors.loginId
                                  ? '#f87171'
                                  : isLoginIdFocused
                                    ? '#60a5fa'
                                    : 'rgba(235,244,255,0.45)'
                              }
                              strokeWidth={2.2}
                            />
                          </View>
                          <TextInput
                            value={loginId}
                            onChangeText={onLoginChange}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            placeholder="AD ID"
                            placeholderTextColor="rgba(235,244,255,0.35)"
                            style={styles.input}
                            returnKeyType="next"
                            onSubmitEditing={() => passwordRef.current?.focus()}
                            editable={!inputDisabled}
                            onFocus={() => setIsLoginIdFocused(true)}
                            onBlur={() => setIsLoginIdFocused(false)}
                          />
                        </View>
                        {errors.loginId ? (
                          <Text style={styles.fieldError}>{errors.loginId}</Text>
                        ) : null}
                      </View>

                      {/* Password */}
                      <View>
                        <View
                          style={[
                            styles.inputRow,
                            styles.passwordRow,
                            isPasswordFocused && styles.inputFocused,
                            errors.password ? styles.inputError : null,
                          ]}>
                          <View style={styles.inputIconWrap}>
                            <Lock
                              size={17}
                              color={
                                errors.password
                                  ? '#f87171'
                                  : isPasswordFocused
                                    ? '#60a5fa'
                                    : 'rgba(235,244,255,0.45)'
                              }
                              strokeWidth={2.2}
                            />
                          </View>
                          <TextInput
                            ref={passwordRef}
                            value={password}
                            onChangeText={onPasswordChange}
                            placeholder="AD Password"
                            placeholderTextColor="rgba(235,244,255,0.35)"
                            secureTextEntry={!showPassword}
                            style={styles.passwordInput}
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit}
                            editable={!inputDisabled}
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => setIsPasswordFocused(false)}
                          />
                          <Pressable
                            onPress={() => setShowPassword((prev) => !prev)}
                            hitSlop={8}
                            disabled={inputDisabled}
                            style={styles.eyeToggle}>
                            {showPassword ? (
                              <EyeOff size={16} color="rgba(235,244,255,0.55)" strokeWidth={2.2} />
                            ) : (
                              <Eye size={16} color="rgba(235,244,255,0.55)" strokeWidth={2.2} />
                            )}
                          </Pressable>
                        </View>
                        {errors.password ? (
                          <Text style={styles.fieldError}>{errors.password}</Text>
                        ) : null}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.biometricPanel}>
                      <View style={styles.biometricIconRing}>
                        <Fingerprint size={38} color="#60a5fa" strokeWidth={1.8} />
                      </View>
                      <Text style={styles.biometricPanelText}>
                        Touch the sensor to authenticate
                      </Text>
                    </View>
                  )}

                  {/* Version checking */}
                  {isCheckingVersion ? (
                    <View style={styles.statusPanel}>
                      <ActivityIndicator size="small" color="#60a5fa" />
                      <Text style={styles.statusText}>Checking app version…</Text>
                    </View>
                  ) : null}

                  {/* Version error */}
                  {versionCheckError ? (
                    <View style={styles.alertPanel}>
                      <Text style={styles.alertText}>{versionCheckError}</Text>
                      <Pressable
                        onPress={checkAppVersion}
                        style={({ pressed }) => [styles.alertRetryBtn, pressed && styles.pressed]}>
                        <Text style={styles.alertRetryText}>Retry version check</Text>
                      </Pressable>
                    </View>
                  ) : null}

                  {isAuthRequestInFlight ? (
                    <View style={styles.authProgressPanel}>
                      <View style={styles.authProgressHeader}>
                        <ActivityIndicator size="small" color="#60a5fa" />
                        <Text style={styles.authProgressTitle}>
                          {isBiometricLoading ? 'Authenticating fingerprint' : 'Signing you in'}
                        </Text>
                      </View>
                      <Text style={styles.authProgressMessage}>{authProgressMessage}</Text>
                      <View style={styles.authProgressTrack}>
                        <Animated.View style={[styles.authProgressFill, { width: authProgressWidth }]} />
                      </View>
                      <Text style={styles.authProgressHint}>Usually completes within a few seconds.</Text>
                    </View>
                  ) : null}

                  {/* Form error */}
                  {errors.form ? (
                    <View style={styles.alertPanel}>
                      <Text style={styles.alertText}>{errors.form}</Text>
                      {errors.form.includes('No internet connection') ? (
                        <Pressable
                          onPress={async () => {
                            await refreshStatus();
                            setErrors((prev) => ({ ...prev, form: undefined }));
                          }}
                          style={({ pressed }) => [styles.alertRetryBtn, pressed && styles.pressed]}>
                          <Text style={styles.alertRetryText}>Retry connection</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}

                  {/* Action buttons */}
                  <View style={styles.actionsGroup}>
                    {showManualLogin ? (
                      <>
                        {/* Primary: Sign In */}
                        <Pressable
                          onPress={handleSubmit}
                          disabled={inputDisabled || Boolean(versionCheckError)}
                          style={({ pressed }) => [
                            styles.primaryBtn,
                            (inputDisabled || Boolean(versionCheckError)) && styles.btnDisabled,
                            pressed && !inputDisabled && !versionCheckError && styles.btnPressed,
                          ]}>
                          {loading || isCheckingConnection ? (
                            <View style={styles.btnContent}>
                              <ActivityIndicator color="#ffffff" size="small" />
                              <Text style={styles.primaryBtnText}>
                                {isCheckingConnection ? 'Checking…' : 'Signing in…'}
                              </Text>
                            </View>
                          ) : isCheckingVersion ? (
                            <View style={styles.btnContent}>
                              <ActivityIndicator color="#ffffff" size="small" />
                              <Text style={styles.primaryBtnText}>Please wait…</Text>
                            </View>
                          ) : (
                            <View style={styles.btnContent}>
                              <LogIn size={17} color="#ffffff" strokeWidth={2.4} />
                              <Text style={styles.primaryBtnText}>Sign In</Text>
                            </View>
                          )}
                        </Pressable>

                        {/* OR divider */}
                        <View style={styles.orRow}>
                          <View style={styles.orLine} />
                          <Text style={styles.orText}>OR</Text>
                          <View style={styles.orLine} />
                        </View>

                        {/* Register Fingerprint */}
                        <Pressable
                          onPress={handleFingerprintRegistration}
                          disabled={inputDisabled || Boolean(versionCheckError)}
                          style={({ pressed }) => [
                            styles.outlineBtn,
                            (inputDisabled || Boolean(versionCheckError)) && styles.btnDisabled,
                            pressed && !inputDisabled && !versionCheckError && styles.btnPressed,
                          ]}>
                          <View style={styles.btnContent}>
                            {isRegisteringBiometric ? (
                              <ActivityIndicator color="rgba(235,244,255,0.8)" size="small" />
                            ) : (
                              <Fingerprint size={16} color="rgba(235,244,255,0.8)" strokeWidth={2.2} />
                            )}
                            <Text style={styles.outlineBtnText}>
                              {isRegisteringBiometric ? 'Registering…' : 'Register Fingerprint'}
                            </Text>
                          </View>
                        </Pressable>

                        {canAttemptBiometricLogin ? (
                          <Pressable
                            onPress={() => {
                              setErrors((prev) => ({ ...prev, form: undefined }));
                              setShowManualLogin(false);
                            }}
                            disabled={inputDisabled || Boolean(versionCheckError)}
                            style={({ pressed }) => [
                              styles.textLinkBtn,
                              pressed && !inputDisabled && !versionCheckError && styles.pressed,
                            ]}>
                            <Text style={styles.textLinkText}>Back to fingerprint login</Text>
                          </Pressable>
                        ) : null}
                      </>
                    ) : null}

                    {/* Biometric login */}
                    {canAttemptBiometricLogin ? (
                      <Pressable
                        onPress={handleBiometricLogin}
                        disabled={inputDisabled || Boolean(versionCheckError)}
                        style={({ pressed }) => [
                          styles.ghostBtn,
                          (inputDisabled || Boolean(versionCheckError)) && styles.btnDisabled,
                          pressed && !inputDisabled && !versionCheckError && styles.btnPressed,
                        ]}>
                        <View style={styles.btnContent}>
                          {isBiometricLoading ? (
                            <ActivityIndicator color="#60a5fa" size="small" />
                          ) : (
                            <Fingerprint size={17} color="#60a5fa" strokeWidth={2.2} />
                          )}
                          <Text style={styles.ghostBtnText}>
                            {isBiometricLoading
                              ? 'Verifying…'
                              : `Login with ${biometricSupport?.label ?? 'Fingerprint'}`}
                          </Text>
                        </View>
                      </Pressable>
                    ) : null}

                    {!showManualLogin && canAttemptBiometricLogin ? (
                      <Pressable
                        onPress={() => {
                          setErrors((prev) => ({ ...prev, form: undefined }));
                          setShowManualLogin(true);
                        }}
                        disabled={inputDisabled || Boolean(versionCheckError)}
                        style={({ pressed }) => [
                          styles.textLinkBtn,
                          pressed && !inputDisabled && !versionCheckError && styles.pressed,
                        ]}>
                        <Text style={styles.textLinkText}>Use ID and Password Instead</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </Animated.View>
              </ScrollView>

              <AppFooter version={installedVersion} poweredBy="CPB-IT" light />
            </View>
          </KeyboardAvoidingView>

          <ForceUpdateModal
            visible={forceUpdateRequired && !showUpdateProgress}
            installedVersion={installedVersion}
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
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 10, 22, 0.55)',
  },
  keyboardContainer: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },

  /* ── Offline banner ── */
  offlineBanner: {
    minHeight: 40,
    backgroundColor: '#ffe4e4',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#fca5a5',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  offlineBannerText: {
    color: '#7f1d1d',
    fontSize: 13,
    fontWeight: '700',
  },
  retryInline: {
    borderRadius: 8,
    backgroundColor: '#ffc4c4',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  retryInlineText: {
    color: '#7f1d1d',
    fontSize: 12,
    fontWeight: '700',
  },

  /* ── Scroll ── */
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: isTablet ? 64 : 22,
    paddingTop: isSmallScreen ? 12 : 20,
    paddingBottom: 16,
    justifyContent: 'center',
  },

  /* ── Background orbs ── */
  bgOrbOne: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(37, 99, 235, 0.11)',
    top: -140,
    right: -130,
  },
  bgOrbTwo: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(29, 78, 216, 0.13)',
    bottom: -90,
    left: -100,
  },
  bgOrbThree: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
    top: isSmallScreen ? 75 : 95,
    left: -50,
  },

  /* ── Hero ── */
  heroArea: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 16 : 26,
  },
  logoRing: {
    width: 120,
    height: 120,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 14,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 18,
  },
  appTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2.5,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  appTagline: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(235,244,255,0.48)',
    letterSpacing: 0.6,
  },

  /* ── Card ── */
  card: {
    backgroundColor: 'rgba(6, 13, 26, 0.84)',
    borderRadius: 26,
    padding: isSmallScreen ? 18 : 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    shadowColor: '#000010',
    shadowOpacity: 0.55,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
    elevation: 18,
    gap: isSmallScreen ? 14 : 16,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    marginTop: 5,
    fontSize: 13,
    color: 'rgba(235,244,255,0.48)',
    fontWeight: '400',
  },

  /* ── Inputs ── */
  inputsGroup: {
    gap: 12,
  },
  inputRow: {
    height: 54,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputFocused: {
    borderColor: 'rgba(96,165,250,0.60)',
    backgroundColor: 'rgba(37,99,235,0.07)',
  },
  inputError: {
    borderColor: 'rgba(248,113,113,0.65)',
    backgroundColor: 'rgba(127,29,29,0.14)',
  },
  inputIconWrap: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 15,
    color: '#ffffff',
    height: 54,
  },
  passwordRow: {
    paddingRight: 6,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 15,
    color: '#ffffff',
    height: 54,
  },
  eyeToggle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  fieldError: {
    marginTop: 5,
    marginLeft: 4,
    fontSize: 12,
    color: '#fca5a5',
    fontWeight: '500',
  },

  /* ── Biometric panel ── */
  biometricPanel: {
    minHeight: 118,
    borderRadius: 18,
    backgroundColor: 'rgba(37,99,235,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  biometricIconRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(37,99,235,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricPanelText: {
    fontSize: 14,
    color: 'rgba(235,244,255,0.58)',
    textAlign: 'center',
    fontWeight: '400',
  },

  /* ── Status / Alert panels ── */
  statusPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(37,99,235,0.09)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.16)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statusText: {
    fontSize: 13,
    color: 'rgba(235,244,255,0.72)',
    fontWeight: '500',
  },
  authProgressPanel: {
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.22)',
    backgroundColor: 'rgba(15,23,42,0.42)',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  authProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authProgressTitle: {
    color: '#e0f2fe',
    fontSize: 14,
    fontWeight: '700',
  },
  authProgressMessage: {
    color: 'rgba(235,244,255,0.72)',
    fontSize: 13,
    lineHeight: 18,
  },
  authProgressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(148,163,184,0.24)',
  },
  authProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#60a5fa',
  },
  authProgressHint: {
    color: 'rgba(191,219,254,0.68)',
    fontSize: 12,
    fontWeight: '500',
  },
  alertPanel: {
    backgroundColor: 'rgba(127,29,29,0.28)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  alertText: {
    fontSize: 13,
    color: '#fca5a5',
    fontWeight: '500',
    lineHeight: 18,
  },
  alertRetryBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.22)',
    backgroundColor: 'rgba(248,113,113,0.09)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  alertRetryText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
  },

  /* ── Actions ── */
  actionsGroup: {
    gap: 10,
    marginTop: 2,
  },

  /* Primary button */
  primaryBtn: {
    height: 54,
    backgroundColor: '#1a5fb4',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1d4ed8',
    shadowOpacity: 0.38,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Outline button (Register Fingerprint) */
  outlineBtn: {
    height: 50,
    backgroundColor: 'transparent',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.17)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    color: 'rgba(235,244,255,0.80)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  /* Ghost button (Biometric Login) */
  ghostBtn: {
    height: 50,
    backgroundColor: 'rgba(37,99,235,0.09)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textLinkBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  textLinkText: {
    color: '#dbeafe',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.15,
  },

  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.42,
  },
  btnPressed: {
    transform: [{ scale: 0.982 }],
    opacity: 0.88,
  },

  /* OR divider */
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 2,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  orText: {
    color: 'rgba(235,244,255,0.36)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
  },

  pressed: {
    opacity: 0.8,
  },
});
