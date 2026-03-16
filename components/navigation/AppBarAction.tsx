import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

export type AppBarActionProps = {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  iconColor?: string;
  iconSize?: number;
  active?: boolean;
  disabled?: boolean;
  badgeCount?: number;
  testID?: string;
};

export function AppBarAction({
  icon: Icon,
  onPress,
  accessibilityLabel,
  iconColor = '#0f172a',
  iconSize = 21,
  active = false,
  disabled = false,
  badgeCount = 0,
  testID,
}: AppBarActionProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      android_ripple={{ color: 'rgba(15, 23, 42, 0.12)', borderless: true }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}>
      {active ? <View style={styles.activeIndicator} /> : null}
      <Icon size={iconSize} color={iconColor} strokeWidth={2.2} />
      {badgeCount > 0 ? (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  activeIndicator: {
    position: 'absolute',
    top: 2,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#1d4f91',
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.4,
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    includeFontPadding: false,
  },
});
