import NetInfo from '@react-native-community/netinfo';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useNetworkStatus } from '@/hooks/use-network-status';

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
}));

const mockedNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads initial online state and reacts to NetInfo updates', async () => {
    let listener: ((state: { isConnected: boolean; isInternetReachable: boolean | null }) => void) | undefined;

    mockedNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    } as never);
    mockedNetInfo.addEventListener.mockImplementation((callback: never) => {
      listener = callback as unknown as typeof listener;
      return jest.fn();
    });

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.isOnline).toBe(true);

    act(() => {
      listener?.({ isConnected: true, isInternetReachable: false });
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isChecking).toBe(false);
  });

  it('refreshes state on demand', async () => {
    mockedNetInfo.fetch
      .mockResolvedValueOnce({
        isConnected: false,
        isInternetReachable: false,
      } as never)
      .mockResolvedValueOnce({
        isConnected: true,
        isInternetReachable: true,
      } as never);
    mockedNetInfo.addEventListener.mockImplementation(() => jest.fn());

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.isOnline).toBe(false);

    await act(async () => {
      await result.current.refreshStatus();
    });

    expect(result.current.isOnline).toBe(true);
  });
});
