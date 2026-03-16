import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Menu } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/components/auth-provider';
import { getDefaultQsrRoute, hasAnyQsrReportAccess } from '@/utils/access-control';
import { BottomNavItem } from './BottomNavItem';
import { MAIN_BOTTOM_NAV_CONFIG } from './bottom-nav-config';

export function BottomNavBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const { accessPermissions } = useAuth();
  const insets = useSafeAreaInsets();
  const focusedRouteName = state.routes[state.index]?.name ?? 'index';
  const defaultQsrRoute = getDefaultQsrRoute(accessPermissions);
  const navItems = MAIN_BOTTOM_NAV_CONFIG.filter((item) => {
    if (item.key === 'qsr-reports/sales-summary') {
      return hasAnyQsrReportAccess(accessPermissions);
    }
    return true;
  });

  return (
    <View style={styles.wrapper}>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <BottomNavItem
          key="nav-panel-toggle"
          icon={Menu}
          label="Menu"
          accessibilityLabel="Open navigation panel"
          active={false}
          onPress={() => router.push(`/navigation-panel?active=${focusedRouteName}`)}
          badgeCount={0}
        />
        {navItems.map((config) => {
          const route = state.routes.find((item) => item.name === config.key);
          const descriptor = route ? descriptors[route.key] : undefined;
          const routeIndex = route ? state.routes.findIndex((item) => item.key === route.key) : -1;
          const isFocused = focusedRouteName === config.key;
          const optionBadge = descriptor?.options.tabBarBadge;
          const badgeCount =
            typeof optionBadge === 'number'
              ? optionBadge
              : typeof config.badgeCount === 'number'
                ? config.badgeCount
                : 0;

          const onPress = () => {
            if (route && routeIndex >= 0) {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
              return;
            }

            if (!isFocused) {
              if (config.key === 'qsr-reports/sales-summary' && defaultQsrRoute) {
                router.push(defaultQsrRoute);
                return;
              }

              router.push('/(tabs)');
            }
          };

          const onLongPress = () => {
            if (!route) {
              return;
            }
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <BottomNavItem
              key={config.key}
              icon={config.icon}
              label={config.label}
              accessibilityLabel={config.accessibilityLabel}
              active={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              badgeCount={badgeCount}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
    marginHorizontal: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#d8e1ee',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 9,
    elevation: 10,
  },
});
