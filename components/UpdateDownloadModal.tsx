import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type UpdateDownloadModalProps = {
  visible: boolean;
  progress: number;
  isInstalling?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
};

export function UpdateDownloadModal({
  visible,
  progress,
  isInstalling = false,
  errorMessage = null,
  onRetry,
}: UpdateDownloadModalProps) {
  const animatedProgress = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [animatedProgress, progress]);

  const progressWidth = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const progressPercent = Math.round(progress * 100);
  const isFailed = Boolean(errorMessage);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => undefined}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>System Update</Text>
          </View>

          <Text style={styles.title}>Updating Application</Text>
          <Text style={styles.message}>
            {isFailed
              ? 'The update could not be downloaded. Please try again.'
              : isInstalling
                ? 'Download complete. Preparing installation...'
                : 'Downloading the latest version. Please wait...'}
          </Text>

          <View style={styles.progressShell}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.percentage}>{progressPercent}%</Text>

          {isInstalling ? (
            <View style={styles.statusRow}>
              <ActivityIndicator color="#f8fafc" size="small" />
              <Text style={styles.statusText}>Launching installer</Text>
            </View>
          ) : null}

          {isFailed && errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {isFailed && onRetry ? (
            <Pressable onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
              <Text style={styles.retryText}>Retry Download</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.84)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: '#0b1728',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    shadowColor: '#020617',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 28,
    elevation: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#bfdbfe',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 18,
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    marginTop: 12,
    color: 'rgba(226, 232, 240, 0.82)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  progressShell: {
    marginTop: 26,
    height: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#38bdf8',
  },
  percentage: {
    marginTop: 14,
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  statusRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  statusText: {
    color: 'rgba(226, 232, 240, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 18,
    color: '#fca5a5',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 22,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: '#eff6ff',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
  },
});
