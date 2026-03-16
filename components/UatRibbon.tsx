import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { isUatEnabled } from '@/utils/app-config';

export function UatRibbon() {
  if (!isUatEnabled()) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={styles.ribbon}>
        <Text style={styles.label}>UAT</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 14,
    right: -34,
    zIndex: 999,
  },
  ribbon: {
    width: 140,
    paddingVertical: 8,
    backgroundColor: '#b91c1c',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#450a0a',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  label: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});
