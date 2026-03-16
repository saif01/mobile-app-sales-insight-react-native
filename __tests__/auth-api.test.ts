import axios from 'axios';

import { loginWithMockApi } from '@/services/auth-api';

jest.mock('axios');
jest.mock('@/constants/app-version', () => ({
  APP_VERSION: '1.0.11',
  APP_NAME: 'SalesInsight',
}));
jest.mock('@/utils/deviceInfo', () => ({
  getMobileDetailsForLogin: jest.fn(() => 'Android 14 / Pixel 7'),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('auth-api', () => {
  beforeEach(() => {
    mockedAxios.post.mockReset();
    mockedAxios.isAxiosError = jest.fn((payload: unknown) => Boolean(payload && typeof payload === 'object' && 'response' in (payload as object)));
  });

  it('sends app version and mobile details in the auth payload', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        data: {
          token: 'abc123',
          access_list: [],
        },
      },
    } as never);

    await loginWithMockApi(' user.id ', ' pass ');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      {
        login: 'user.id',
        password: 'pass',
        app_name: 'SalesInsight',
        app_version: '1.0.11',
        mobile_details: 'Android 14 / Pixel 7',
      },
      expect.objectContaining({ timeout: 15000 })
    );
  });

  it('parses token, profile, and permissions from nested auth response payloads', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        data: {
          accessToken: 'abc123',
          user: {
            displayName: 'Test User',
            profile_photo: 'https://example.com/avatar.png',
          },
          access_list: [
            {
              code: 'qsr',
              children: [
                { code: 'qsr_sales' },
                { code: 'qsr_sales_summary' },
              ],
            },
          ],
        },
      },
    } as never);

    const result = await loginWithMockApi(' user.id ', ' pass ');

    expect(result).toEqual(
      expect.objectContaining({
        token: 'abc123',
        userId: 'user.id',
        name: 'Test User',
        image: 'https://example.com/avatar.png',
        accessPermissions: {
          canAccessQsrReports: true,
          canAccessQsrSales: true,
          canAccessQsrSalesSummary: true,
        },
      })
    );
  });

  it('parses alternate access codes into route permissions', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        jwt: 'jwt-token',
        userName: 'Summary User',
        access_list: [
          {
            code: 'qsr',
            children: [{ code: 'qsr_summary_report' }],
          },
        ],
      },
    } as never);

    const result = await loginWithMockApi('summary.user', 'pass');

    expect(result.accessPermissions).toEqual({
      canAccessQsrReports: true,
      canAccessQsrSales: false,
      canAccessQsrSalesSummary: true,
    });
    expect(result.name).toBe('Summary User');
  });

  it('normalizes unauthorized errors into invalid credential messaging', async () => {
    mockedAxios.post.mockRejectedValue({
      response: {
        status: 401,
        data: {
          message: 'Unauthorized',
        },
      },
    });

    await expect(loginWithMockApi('bad.user', 'badpass')).rejects.toThrow('Invalid login ID or password.');
  });

  it('normalizes invalid password style backend messages into invalid credential messaging', async () => {
    mockedAxios.post.mockRejectedValue({
      response: {
        status: 500,
        data: {
          message: 'Invalid password provided for this account',
        },
      },
    });

    await expect(loginWithMockApi('bad.user', 'badpass')).rejects.toThrow('Invalid login ID or password.');
  });

  it('falls back to the local demo account when the API call fails', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Network down'));

    const result = await loginWithMockApi('syful.isl', 'cpbit@uat');

    expect(result.token).toContain('mock_');
    expect(result.accessPermissions.canAccessQsrSalesSummary).toBe(true);
  });
});
