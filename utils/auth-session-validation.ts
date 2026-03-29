import type { AccessPermissions } from '@/services/auth-api';
import { hasAnyAccessPermission } from '@/utils/access-control';

export function isStoredAccessPermissionsValid(accessPermissions: AccessPermissions): boolean {
  const hasAnyAccess = hasAnyAccessPermission(accessPermissions);
  if (!hasAnyAccess) {
    return false;
  }

  if (
    (accessPermissions.canAccessQsrSales || accessPermissions.canAccessQsrSalesSummary) &&
    !accessPermissions.canAccessQsrReports
  ) {
    return false;
  }

  return true;
}
