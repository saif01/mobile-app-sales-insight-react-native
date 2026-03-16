import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type BottomNavItemProps = {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  accessibilityLabel: string;
  badgeCount?: number;
};

export function BottomNavItem({
  icon: Icon,
  label,
  active,
  onPress,
  onLongPress,
  accessibilityLabel,
  badgeCount = 0,
}: BottomNavItemProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel}
      android_ripple={{ color: 'rgba(15, 23, 42, 0.1)' }}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <View style={styles.iconWrap}>
        {active ? <View style={styles.activeIndicator} /> : null}
        <Icon size={21} color={active ? '#0f3567' : '#6b7280'} strokeWidth={2.3} />
        {badgeCount > 0 ? (
          <View style={styles.badge} pointerEvents="none">
            <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 4,
  },
  pressed: {
    opacity: 0.82,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
    marginBottom: 2,
  },
  activeIndicator: {
    position: 'absolute',
    top: -7,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#1d4f91',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#0f3567',
  },
  labelInactive: {
    color: '#6b7280',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -12,
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
