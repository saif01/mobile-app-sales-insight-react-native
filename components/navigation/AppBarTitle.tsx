import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

type AppBarTitleProps = {
  title: string;
  subtitle?: string;
  titleColor?: string;
  subtitleColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
};

export function AppBarTitle({
  title,
  subtitle,
  titleColor = '#0f172a',
  subtitleColor = '#64748b',
  containerStyle,
  titleStyle,
  subtitleStyle,
}: AppBarTitleProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text numberOfLines={1} style={[styles.title, { color: titleColor }, titleStyle]}>
        {title}
      </Text>
      {subtitle ? (
        <Text numberOfLines={1} style={[styles.subtitle, { color: subtitleColor }, subtitleStyle]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 1,
    fontSize: 12,
    fontWeight: '500',
  },
});
