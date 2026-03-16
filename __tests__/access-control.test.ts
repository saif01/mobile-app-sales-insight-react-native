import {
  canAccessQsrRoute,
  getDefaultAuthenticatedRoute,
  getDefaultQsrRoute,
  hasAnyAccessPermission,
  hasAnyQsrReportAccess,
} from '@/utils/access-control';

describe('access-control', () => {
  const noAccess = {
    canAccessQsrReports: false,
    canAccessQsrSales: false,
    canAccessQsrSalesSummary: false,
  };

  it('detects when the user has no access', () => {
    expect(hasAnyAccessPermission(noAccess)).toBe(false);
    expect(hasAnyQsrReportAccess(noAccess)).toBe(false);
    expect(getDefaultQsrRoute(noAccess)).toBeNull();
    expect(getDefaultAuthenticatedRoute(noAccess)).toBe('/(tabs)');
  });

  it('prioritizes sales over sales summary for the default route', () => {
    const access = {
      canAccessQsrReports: true,
      canAccessQsrSales: true,
      canAccessQsrSalesSummary: true,
    };

    expect(hasAnyAccessPermission(access)).toBe(true);
    expect(hasAnyQsrReportAccess(access)).toBe(true);
    expect(getDefaultQsrRoute(access)).toBe('/qsr-reports/sales');
    expect(getDefaultAuthenticatedRoute(access)).toBe('/qsr-reports/sales');
  });

  it('allows only the permitted report route', () => {
    const access = {
      canAccessQsrReports: true,
      canAccessQsrSales: false,
      canAccessQsrSalesSummary: true,
    };

    expect(getDefaultQsrRoute(access)).toBe('/qsr-reports/sales-summary');
    expect(canAccessQsrRoute(access, 'qsr-reports/sales')).toBe(false);
    expect(canAccessQsrRoute(access, 'qsr-reports/sales-summary')).toBe(true);
  });
});
