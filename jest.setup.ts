import '@testing-library/jest-native/extend-expect';

jest.mock('expo-image', () => {
  const ReactNative = require('react-native');

  return {
    Image: ReactNative.Image,
  };
});

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        return function IconMock() {
          return React.createElement(Text, null, prop);
        };
      },
    }
  );
});

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const React = require('react');
    const { Text } = require('react-native');

    return React.createElement(Text, null, `Redirect:${href}`);
  },
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
    push: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useFocusEffect: (callback: () => void | (() => void)) => {
    callback();
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});
