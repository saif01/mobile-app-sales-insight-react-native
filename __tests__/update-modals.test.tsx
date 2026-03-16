import React from 'react';
import { Animated } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { ForceUpdateModal } from '@/components/ForceUpdateModal';
import { UpdateDownloadModal } from '@/components/UpdateDownloadModal';

describe('update modals', () => {
  let timingSpy: jest.SpyInstance;

  beforeEach(() => {
    timingSpy = jest.spyOn(Animated, 'timing').mockImplementation((value, config) => {
      return {
        start: (callback?: Animated.EndCallback) => {
          value.setValue(config.toValue as number);
          callback?.({ finished: true });
        },
        stop: jest.fn(),
        reset: jest.fn(),
      } as unknown as Animated.CompositeAnimation;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the force update modal and triggers the update action', () => {
    const onUpdatePress = jest.fn();
    const screen = render(
      <ForceUpdateModal
        visible
        installedVersion="1.0.7"
        latestVersion="1.0.8"
        onUpdatePress={onUpdatePress}
      />
    );

    expect(screen.getByText('Update Required')).toBeTruthy();
    expect(screen.getByText('1.0.7')).toBeTruthy();
    expect(screen.getByText('1.0.8')).toBeTruthy();

    fireEvent.press(screen.getByText('Update Now'));

    expect(onUpdatePress).toHaveBeenCalled();
  });

  it('renders progress, install, and retry states in the download modal', () => {
    const onRetry = jest.fn();
    const screen = render(
      <UpdateDownloadModal
        visible
        progress={0.42}
        errorMessage="Download failed"
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('42%')).toBeTruthy();
    expect(screen.getByText('Download failed')).toBeTruthy();

    fireEvent.press(screen.getByText('Retry Download'));
    expect(onRetry).toHaveBeenCalled();

    act(() => {
      screen.rerender(<UpdateDownloadModal visible progress={1} isInstalling />);
    });

    expect(screen.getByText('Download complete. Preparing installation...')).toBeTruthy();
    expect(screen.getByText('Launching installer')).toBeTruthy();
  });
});
