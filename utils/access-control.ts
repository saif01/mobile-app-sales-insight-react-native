import type { AccessPermissions } from '@/services/auth-api';

export function hasAnyAccessPermission(accessPermissions: AccessPermissions): boolean {
  return Object.values(accessPermissions).some(Boolean);
}

export function hasAnyQsrReportAccess(accessPermissions: AccessPermissions): boolean {
  return accessPermissions.canAccessQsrSales || accessPermissions.canAccessQsrSalesSummary;
}

export function getDefaultQsrRoute(accessPermissions: AccessPermissions): string | null {
  if (accessPermissions.canAccessQsrSales) {
    return '/qsr-reports/sales';
  }

  if (accessPermissions.canAccessQsrSalesSummary) {
    return '/qsr-reports/sales-summary';
  }

  return null;
}

export function getDefaultAuthenticatedRoute(accessPermissions: AccessPermissions): string {
  return getDefaultQsrRoute(accessPermissions) ?? '/(tabs)';
}

export function canAccessQsrRoute(accessPermissions: AccessPermissions, routeKey: string): boolean {
  if (!accessPermissions.canAccessQsrReports) {
    return false;
  }

  if (routeKey === 'qsr-reports/sales') {
    return accessPermissions.canAccessQsrSales;
  }

  if (routeKey === 'qsr-reports/sales-summary') {
    return accessPermissions.canAccessQsrSalesSummary;
  }

  return false;
}
