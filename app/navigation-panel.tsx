import { ChevronDown, ChevronRight, FileText, Info, LayoutDashboard, LogOut } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/components/auth-provider';
import { AppBar } from '@/components/navigation/AppBar';
import { useLogoutConfirmation } from '@/components/logout-confirmation-provider';
import { canAccessQsrRoute, hasAnyAccessPermission, hasAnyQsrReportAccess } from '@/utils/access-control';
import type { AccessPermissions } from '@/services/auth-api';

type PanelItem = {
  id: string;
  routeKey?: string;
  label: string;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  onPress: () => void;
};

function Section({ title, items, activeKey }: { title: string; items: PanelItem[]; activeKey: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = Boolean(item.routeKey && item.routeKey === activeKey);
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              android_ripple={{ color: 'rgba(15, 23, 42, 0.1)' }}
              onPress={item.onPress}
              style={({ pressed }) => [styles.itemButton, isActive && styles.itemButtonActive, pressed && styles.itemPressed]}>
              <View style={[styles.itemIconWrap, isActive && styles.itemIconWrapActive]}>
                <Icon size={18} color={isActive ? '#0b2f63' : '#0f3567'} strokeWidth={2.2} />
              </View>
              <View style={styles.itemTextWrap}>
                <Text style={[styles.itemTitle, isActive && styles.itemTitleActive]}>{item.label}</Text>
                {item.subtitle ? <Text style={[styles.itemSubtitle, isActive && styles.itemSubtitleActive]}>{item.subtitle}</Text> : null}
              </View>
              {isActive ? <View style={styles.activePill} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function QsrReportsGroup({
  activeKey,
  accessPermissions,
}: {
  activeKey: string;
  accessPermissions: AccessPermissions;
}) {
  const router = useRouter();
  const childItems: PanelItem[] = [
    canAccessQsrRoute(accessPermissions, 'qsr-reports/sales')
      ? {
          id: 'qsr-sales',
          routeKey: 'qsr-reports/sales',
          label: 'Sales',
          subtitle: 'Open QSR sales web view',
          icon: FileText,
          onPress: () => router.push('/qsr-reports/sales'),
        }
      : null,
    canAccessQsrRoute(accessPermissions, 'qsr-reports/sales-summary')
      ? {
          id: 'qsr-sales-summary',
          routeKey: 'qsr-reports/sales-summary',
          label: 'Sales Summary',
          subtitle: 'Open QSR sales summary web view',
          icon: FileText,
          onPress: () => router.push('/qsr-reports/sales-summary'),
        }
      : null,
  ].filter((item): item is PanelItem => item !== null);
  const hasActiveChild = childItems.some((item) => item.routeKey === activeKey);
  const [expanded, setExpanded] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) {
      setExpanded(true);
    }
  }, [hasActiveChild]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reports</Text>
      <View style={styles.sectionCard}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle QSR reports"
          android_ripple={{ color: 'rgba(15, 23, 42, 0.1)' }}
          onPress={() => setExpanded((prev) => !prev)}
          style={({ pressed }) => [
            styles.itemButton,
            styles.groupButton,
            hasActiveChild && styles.itemButtonActive,
            pressed && styles.itemPressed,
          ]}>
          <View style={[styles.itemIconWrap, hasActiveChild && styles.itemIconWrapActive]}>
            <FileText size={18} color={hasActiveChild ? '#0b2f63' : '#0f3567'} strokeWidth={2.2} />
          </View>
          <View style={styles.itemTextWrap}>
            <Text style={[styles.itemTitle, hasActiveChild && styles.itemTitleActive]}>QSR Reports</Text>
            <Text style={[styles.itemSubtitle, hasActiveChild && styles.itemSubtitleActive]}>
              Sales reports
            </Text>
          </View>
          {expanded ? (
            <ChevronDown size={18} color={hasActiveChild ? '#0b2f63' : '#4f6785'} strokeWidth={2.4} />
          ) : (
            <ChevronRight size={18} color={hasActiveChild ? '#0b2f63' : '#4f6785'} strokeWidth={2.4} />
          )}
        </Pressable>

        {expanded ? (
          <View style={styles.childList}>
            {childItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.routeKey === activeKey;

              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  android_ripple={{ color: 'rgba(15, 23, 42, 0.1)' }}
                  onPress={item.onPress}
                  style={({ pressed }) => [
                    styles.itemButton,
                    styles.childItemButton,
                    isActive && styles.itemButtonActive,
                    pressed && styles.itemPressed,
                  ]}>
                  <View style={[styles.itemIconWrap, styles.childItemIconWrap, isActive && styles.itemIconWrapActive]}>
                    <Icon size={16} color={isActive ? '#0b2f63' : '#0f3567'} strokeWidth={2.2} />
                  </View>
                  <View style={styles.itemTextWrap}>
                    <Text style={[styles.itemTitle, styles.childItemTitle, isActive && styles.itemTitleActive]}>
                      {item.label}
                    </Text>
                    {item.subtitle ? (
                      <Text style={[styles.itemSubtitle, isActive && styles.itemSubtitleActive]}>{item.subtitle}</Text>
                    ) : null}
                  </View>
                  {isActive ? <View style={styles.activePill} /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function NavigationPanelScreen() {
  const router = useRouter();
  const { accessPermissions } = useAuth();
  const confirmLogout = useLogoutConfirmation();
  const params = useLocalSearchParams<{ active?: string | string[] }>();
  const activeKey = Array.isArray(params.active) ? params.active[0] : params.active ?? '';
  const hasAnyAccess = hasAnyAccessPermission(accessPermissions);

  const generalItems: PanelItem[] = [
    {
      id: 'dashboard',
      routeKey: 'index',
      label: 'Dashboard',
      subtitle: 'Back to home screen',
      icon: LayoutDashboard,
      onPress: () => router.push('/(tabs)'),
    },
  ];

  const accountItems: PanelItem[] = [
    {
      id: 'about-app',
      routeKey: 'about',
      label: 'About App',
      subtitle: 'Version, company, and support info',
      icon: Info,
      onPress: () => router.push('/about'),
    },
    {
      id: 'logout',
      label: 'Logout',
      subtitle: 'Sign out from this device',
      icon: LogOut,
      onPress: confirmLogout,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppBar
        showBackButton
        title="Navigation Panel"
        subtitle="Quick access menu"
        showBottomBorder
        backgroundColor="#ffffff"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!hasAnyAccess ? (
          <View style={styles.emptyAccessCard}>
            <Text style={styles.emptyAccessTitle}>No access assigned</Text>
            <Text style={styles.emptyAccessText}>
              The auth response returned an empty access list for this account. Contact the administrator to enable app sections.
            </Text>
          </View>
        ) : null}
        <Section title="General" items={generalItems} activeKey={activeKey} />
        {hasAnyQsrReportAccess(accessPermissions) ? (
          <QsrReportsGroup activeKey={activeKey} accessPermissions={accessPermissions} />
        ) : null}
      </ScrollView>

      <View style={styles.bottomSection}>
        <Section title="Account" items={accountItems} activeKey={activeKey} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d6dfec',
    backgroundColor: '#f5f8fc',
  },
  emptyAccessCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f2d08a',
    backgroundColor: '#fff7e6',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  emptyAccessTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#7a4b00',
  },
  emptyAccessText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#80530d',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#516784',
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d6dfec',
    overflow: 'hidden',
  },
  itemButton: {
    position: 'relative',
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  groupButton: {
    minHeight: 64,
  },
  childList: {
    paddingBottom: 6,
  },
  childItemButton: {
    minHeight: 58,
    paddingLeft: 28,
    paddingRight: 12,
  },
  itemButtonActive: {
    backgroundColor: '#eef4ff',
  },
  itemPressed: {
    opacity: 0.82,
  },
  itemIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e2ebf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconWrapActive: {
    backgroundColor: '#cfe0fb',
  },
  childItemIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#123258',
  },
  itemTitleActive: {
    color: '#0b2f63',
  },
  childItemTitle: {
    fontSize: 14,
  },
  itemSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#5b7090',
  },
  itemSubtitleActive: {
    color: '#416087',
  },
  activePill: {
    width: 8,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1d4f91',
  },
});
