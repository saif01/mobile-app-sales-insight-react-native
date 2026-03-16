import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type AppFooterProps = {
  version: string;
  poweredBy?: string;
  light?: boolean;
};

export function AppFooter({ version, poweredBy = 'SalesInsight', light = false }: AppFooterProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.versionText, light && styles.versionTextLight]}>Version {version}</Text>
      <Text style={[styles.poweredByText, light && styles.poweredByTextLight]}>Powered by {poweredBy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 14,
    gap: 2,
  },
  versionText: {
    fontSize: 12,
    color: '#5f6f82',
    fontWeight: '600',
  },
  versionTextLight: {
    color: 'rgba(244, 248, 255, 0.92)',
  },
  poweredByText: {
    fontSize: 11,
    color: '#7b8797',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  poweredByTextLight: {
    color: 'rgba(228, 237, 248, 0.84)',
  },
});
