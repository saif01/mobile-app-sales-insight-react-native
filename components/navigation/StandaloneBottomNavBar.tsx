import { useRouter } from 'expo-router';
import { Menu } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/components/auth-provider';
import { getDefaultQsrRoute, hasAnyQsrReportAccess } from '@/utils/access-control';
import { BottomNavItem } from './BottomNavItem';
import { MAIN_BOTTOM_NAV_CONFIG, type BottomNavRouteKey } from './bottom-nav-config';

type StandaloneBottomNavBarProps = {
  activeRoute: BottomNavRouteKey;
};

export function StandaloneBottomNavBar({ activeRoute }: StandaloneBottomNavBarProps) {
  const router = useRouter();
  const { accessPermissions } = useAuth();
  const insets = useSafeAreaInsets();
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
          icon={Menu}
          label="Menu"
          accessibilityLabel="Open navigation panel"
          active={false}
          onPress={() => router.push(`/navigation-panel?active=${activeRoute}`)}
          badgeCount={0}
        />
        {navItems.map((item) => (
          <BottomNavItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            accessibilityLabel={item.accessibilityLabel}
            active={
              item.key === 'qsr-reports/sales-summary'
                ? activeRoute === 'qsr-reports/sales' || activeRoute === 'qsr-reports/sales-summary'
                : activeRoute === item.key
            }
            onPress={() => {
              const isActive =
                item.key === 'qsr-reports/sales-summary'
                  ? activeRoute === 'qsr-reports/sales' || activeRoute === 'qsr-reports/sales-summary'
                  : activeRoute === item.key;

              if (isActive) {
                return;
              }

              if (item.key === 'qsr-reports/sales-summary' && defaultQsrRoute) {
                router.push(defaultQsrRoute);
                return;
              }

              router.push('/(tabs)');
            }}
            badgeCount={item.badgeCount ?? 0}
          />
        ))}
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
