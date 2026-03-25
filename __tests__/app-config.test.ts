describe('app-config', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('expo-constants');
  });

  it('reads values from expoConfig extra when available', () => {
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: {
        expoConfig: {
          name: 'SalesInsight-UAT',
          extra: {
            appUat: true,
            webViewToken: ' token-123 ',
            aboutCompanyWebsite: 'https://cpbangladesh.com',
            aboutSupportEmail: 'syful@cpbangladesh.com',
            aboutSupportPhone: '+8801730731201',
            aboutDeveloperName: 'CPB Application Development Team',
          },
        },
      },
    }));

    const appConfig = require('@/utils/app-config') as typeof import('@/utils/app-config');

    expect(appConfig.isUatEnabled()).toBe(true);
    expect(appConfig.getWebViewToken()).toBe('token-123');
    expect(appConfig.getAppName()).toBe('SalesInsight-UAT');
    expect(appConfig.getAboutCompanyWebsite()).toBe('https://cpbangladesh.com');
    expect(appConfig.getAboutSupportEmail()).toBe('syful@cpbangladesh.com');
    expect(appConfig.getAboutSupportPhone()).toBe('+8801730731201');
    expect(appConfig.getAboutDeveloperName()).toBe('CPB Application Development Team');
  });

  it('falls back to manifest and default values when expoConfig is missing', () => {
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: {
        expoConfig: undefined,
        manifest: {
          extra: {
            webViewToken: 'manifest-token',
          },
        },
      },
    }));

    const appConfig = require('@/utils/app-config') as typeof import('@/utils/app-config');

    expect(appConfig.isUatEnabled()).toBe(false);
    expect(appConfig.getWebViewToken()).toBe('manifest-token');
    expect(appConfig.getAppName()).toBe('SalesInsight');
    expect(appConfig.getAboutCompanyWebsite()).toBe('https://cpbangladesh.com');
    expect(appConfig.getAboutSupportEmail()).toBe('syful@cpbangladesh.com');
    expect(appConfig.getAboutSupportPhone()).toBe('+8801730731201');
    expect(appConfig.getAboutDeveloperName()).toBe('CPB Application Development Team');
  });

  it('reads manifest2 expo client extra as a last fallback', () => {
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: {
        expoConfig: undefined,
        manifest: undefined,
        manifest2: {
          extra: {
            expoClient: {
              extra: {
                appUat: true,
                webViewToken: 'manifest2-token',
              },
            },
          },
        },
      },
    }));

    const appConfig = require('@/utils/app-config') as typeof import('@/utils/app-config');

    expect(appConfig.isUatEnabled()).toBe(true);
    expect(appConfig.getWebViewToken()).toBe('manifest2-token');
  });
});
