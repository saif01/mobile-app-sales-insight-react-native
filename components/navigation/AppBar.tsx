import React from 'react';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Menu } from 'lucide-react-native';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBarAction, type AppBarActionProps } from './AppBarAction';
import { AppBarTitle } from './AppBarTitle';

export type AppBarActionItem = Omit<AppBarActionProps, 'iconSize'> & {
  iconSize?: number;
};

export type AppBarProps = {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  actions?: AppBarActionItem[];
  customRightComponent?: React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  iconColor?: string;
  shadow?: boolean;
  showBottomBorder?: boolean;
  borderBottomColor?: string;
  horizontalPadding?: number;
  avatarUri?: string | null;
  avatarSource?: ImageSourcePropType;
  avatarLabel?: string;
  onAvatarPress?: () => void;
  onMenuButtonPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function AppBar({
  title,
  subtitle,
  showBackButton = false,
  showMenuButton = false,
  actions = [],
  customRightComponent,
  backgroundColor = '#ffffff',
  titleColor = '#0f172a',
  subtitleColor = '#64748b',
  iconColor = '#0f172a',
  shadow = false,
  showBottomBorder = false,
  borderBottomColor = '#e2e8f0',
  horizontalPadding = 16,
  avatarUri = null,
  avatarSource,
  avatarLabel = 'Open profile',
  onAvatarPress,
  onMenuButtonPress,
  style,
}: AppBarProps) {
  const navigation = useNavigation<any>();
  const showLeft = showBackButton || showMenuButton;

  const onBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const onMenuPress = () => {
    if (onMenuButtonPress) {
      onMenuButtonPress();
      return;
    }

    let cursor: any = navigation;
    while (cursor) {
      const state = cursor.getState?.();
      if (state?.type === 'drawer') {
        cursor.dispatch(DrawerActions.toggleDrawer());
        return;
      }
      cursor = cursor.getParent?.();
    }

    // No drawer in the current navigator tree. Avoid dispatching unhandled actions.
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor }]}>
      <View
        style={[
          styles.container,
          { paddingHorizontal: horizontalPadding, backgroundColor },
          shadow && styles.shadow,
          showBottomBorder && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor },
          style,
        ]}>
        <View style={styles.leftSlot}>
          {showLeft ? (
            <AppBarAction
              icon={showBackButton ? ArrowLeft : Menu}
              onPress={showBackButton ? onBackPress : onMenuPress}
              accessibilityLabel={showBackButton ? 'Go back' : 'Open menu'}
              iconColor={iconColor}
            />
          ) : null}
        </View>

        <View style={styles.titleSlot}>
          <AppBarTitle title={title} subtitle={subtitle} titleColor={titleColor} subtitleColor={subtitleColor} />
        </View>

        <View style={styles.rightSlot}>
          {actions.map((action, index) => (
            <AppBarAction
              key={`${action.accessibilityLabel}_${index}`}
              {...action}
              iconColor={action.iconColor ?? iconColor}
            />
          ))}
          {customRightComponent}
          {(avatarUri || avatarSource) && onAvatarPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={avatarLabel}
              hitSlop={8}
              android_ripple={{ color: 'rgba(15, 23, 42, 0.12)', borderless: true }}
              onPress={onAvatarPress}
              style={({ pressed }) => [styles.avatarButton, pressed && styles.avatarPressed]}>
              <Image source={avatarSource ?? { uri: avatarUri! }} style={styles.avatar} />
            </Pressable>
          ) : (avatarUri || avatarSource) ? (
            <View style={styles.avatarButton}>
              <Image source={avatarSource ?? { uri: avatarUri! }} style={styles.avatar} />
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

export function AppBarAvatarFallback({ label }: { label: string }) {
  const fallback = label.trim().slice(0, 2).toUpperCase();
  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarFallbackText}>{fallback}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    width: '100%',
  },
  container: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSlot: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleSlot: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  rightSlot: {
    minWidth: 44,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    overflow: 'hidden',
    backgroundColor: '#dbe4f0',
  },
  avatarPressed: {
    opacity: 0.82,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  avatarFallbackText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  shadow: {
    shadowColor: '#020617',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 4,
  },
});
