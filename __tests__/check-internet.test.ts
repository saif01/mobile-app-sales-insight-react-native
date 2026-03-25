import NetInfo from '@react-native-community/netinfo';

import { checkInternetConnection, hasInternetAccess } from '@/utils/check-internet';

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

const mockedNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

describe('check-internet', () => {
  beforeEach(() => {
    mockedNetInfo.fetch.mockReset();
  });

  it('treats connected and reachable state as online', () => {
    expect(hasInternetAccess({ isConnected: true, isInternetReachable: true })).toBe(true);
  });

  it('treats explicitly unreachable internet as offline', () => {
    expect(hasInternetAccess({ isConnected: true, isInternetReachable: false })).toBe(false);
  });

  it('checks connectivity through NetInfo.fetch', async () => {
    mockedNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    } as never);

    await expect(checkInternetConnection()).resolves.toBe(true);
  });
});
