import NetInfo from '@react-native-community/netinfo';

export function hasInternetAccess(
  state: Pick<Awaited<ReturnType<typeof NetInfo.fetch>>, 'isConnected' | 'isInternetReachable'>
): boolean {
  const hasNetwork = state.isConnected === true;
  const internetReachable = state.isInternetReachable !== false;
  return hasNetwork && internetReachable;
}

export async function checkInternetConnection(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return hasInternetAccess(state);
}
