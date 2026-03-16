import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LogOut, ShieldCheck } from 'lucide-react-native';

type ConfirmLogoutModalProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
};

export function ConfirmLogoutModal({
  visible,
  onConfirm,
  onCancel,
  confirmLoading = false,
}: ConfirmLogoutModalProps) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const dialogOpacity = useRef(new Animated.Value(0)).current;
  const dialogScale = useRef(new Animated.Value(0.92)).current;
  const [isMounted, setIsMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(dialogOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(dialogScale, {
          toValue: 1,
          damping: 18,
          stiffness: 210,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!isMounted) {
      return;
    }

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(dialogOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(dialogScale, {
        toValue: 0.96,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsMounted(false);
      }
    });
  }, [dialogOpacity, dialogScale, isMounted, overlayOpacity, visible]);

  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={isMounted}
      animationType="none"
      statusBarTranslucent
      onRequestClose={confirmLoading ? undefined : onCancel}>
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        <Pressable
          style={styles.dismissLayer}
          onPress={confirmLoading ? undefined : onCancel}
        />

        <View pointerEvents="box-none" style={styles.centerWrap}>
          <Animated.View
            style={[
              styles.dialog,
              {
                opacity: dialogOpacity,
                transform: [{ scale: dialogScale }],
              },
            ]}>
            <View style={styles.iconWrap}>
              <ShieldCheck size={24} color="#ffffff" strokeWidth={2.2} />
            </View>

            <Text style={styles.title}>Logout</Text>
            <Text style={styles.message}>
              Are you sure you want to logout from the app?
            </Text>

            <View style={styles.actionRow}>
              <Pressable
                onPress={onCancel}
                disabled={confirmLoading}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && !confirmLoading ? styles.pressed : null,
                ]}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={onConfirm}
                disabled={confirmLoading}
                style={({ pressed }) => [
                  styles.confirmButton,
                  pressed && !confirmLoading ? styles.pressed : null,
                ]}>
                {confirmLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={styles.confirmButtonContent}>
                    <LogOut size={16} color="#ffffff" strokeWidth={2.3} />
                    <Text style={styles.confirmButtonText}>Logout</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 15, 27, 0.52)',
  },
  dismissLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  centerWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#0b1220',
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 18,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#d9424a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10233f',
  },
  message: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#5b6b80',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d2dae6',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5d6d82',
  },
  confirmButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#d9424a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#c62d36',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  confirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
