import type { LucideIcon } from 'lucide-react-native';
import { House, LayoutList } from 'lucide-react-native';

export type BottomNavRouteKey = 'index' | 'qsr-reports/sales' | 'qsr-reports/sales-summary';

export type BottomNavConfigItem = {
  key: 'index' | 'qsr-reports/sales-summary';
  label: string;
  icon: LucideIcon;
  accessibilityLabel: string;
  badgeCount?: number;
};

export const MAIN_BOTTOM_NAV_CONFIG: BottomNavConfigItem[] = [
  {
    key: 'index',
    label: 'Home',
    icon: House,
    accessibilityLabel: 'Go to home tab',
  },
  {
    key: 'qsr-reports/sales-summary',
    label: 'Reports',
    icon: LayoutList,
    accessibilityLabel: 'Go to reports screen',
  },
];
