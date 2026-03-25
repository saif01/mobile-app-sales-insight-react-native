describe('deviceInfo', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('react-native');
    jest.dontMock('expo-constants');
  });

  it('includes expo constants details when available', () => {
    jest.doMock('react-native', () => ({
      Platform: {
        OS: 'android',
        Version: 34,
      },
    }));
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: {
        deviceName: 'Pixel 7',
        platform: { android: { apiLevel: 34 } },
      },
    }));

    const { getMobileDetailsForLogin } = require('@/utils/deviceInfo') as typeof import('@/utils/deviceInfo');
    const details = JSON.parse(getMobileDetailsForLogin()) as Record<string, unknown>;

    expect(details.platform).toBe('android');
    expect(details.version).toBe(34);
    expect(details.deviceName).toBe('Pixel 7');
    expect(details.platformInfo).toEqual({ android: { apiLevel: 34 } });
  });

  it('falls back to platform-only details when expo-constants is unavailable', () => {
    jest.doMock('react-native', () => ({
      Platform: {
        OS: 'ios',
        Version: '18.0',
      },
    }));
    jest.doMock('expo-constants', () => {
      throw new Error('expo-constants unavailable');
    });

    const { getMobileDetailsForLogin } = require('@/utils/deviceInfo') as typeof import('@/utils/deviceInfo');
    const details = JSON.parse(getMobileDetailsForLogin()) as Record<string, unknown>;

    expect(details).toEqual({
      platform: 'ios',
      version: '18.0',
    });
  });
});
