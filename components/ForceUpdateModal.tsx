import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { getAppName } from '@/utils/app-config';

type ForceUpdateModalProps = {
  visible: boolean;
  installedVersion: string;
  latestVersion: string;
  onUpdatePress: () => void;
  isUpdating?: boolean;
};

export function ForceUpdateModal({
  visible,
  installedVersion,
  latestVersion,
  onUpdatePress,
  isUpdating = false,
}: ForceUpdateModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => undefined}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.description}>
            A newer version of {getAppName()} is available. You must update the app to continue.
          </Text>

          <View style={styles.versionBox}>
            <View style={styles.versionRow}>
              <Text style={styles.label}>Installed version</Text>
              <Text style={styles.value}>{installedVersion}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.versionRow}>
              <Text style={styles.label}>Latest version</Text>
              <Text style={styles.value}>{latestVersion}</Text>
            </View>
          </View>

          <Pressable
            onPress={onUpdatePress}
            disabled={isUpdating}
            style={({ pressed }) => [
              styles.updateButton,
              isUpdating ? styles.updateButtonDisabled : null,
              pressed && !isUpdating ? styles.updateButtonPressed : null,
            ]}>
            {isUpdating ? (
              <View style={styles.buttonLoaderRow}>
                <ActivityIndicator color="#ffffff" />
                <Text style={styles.updateButtonText}>Opening download...</Text>
              </View>
            ) : (
              <Text style={styles.updateButtonText}>Update Now</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#dce7f5',
    shadowColor: '#0f2f57',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#102640',
  },
  description: {
    marginTop: 8,
    color: '#33506f',
    fontSize: 14,
    lineHeight: 21,
  },
  versionBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#d8e4f3',
    borderRadius: 14,
    backgroundColor: '#f8fbff',
    overflow: 'hidden',
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d5e2f1',
  },
  label: {
    color: '#35506f',
    fontWeight: '600',
    fontSize: 13,
  },
  value: {
    color: '#0f2d52',
    fontWeight: '800',
    fontSize: 14,
  },
  updateButton: {
    marginTop: 18,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#0f3567',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: '#5578a1',
  },
  updateButtonPressed: {
    opacity: 0.9,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  buttonLoaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
