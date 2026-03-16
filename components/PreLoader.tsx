import { Image } from 'expo-image';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type PreLoaderProps = {
  message?: string;
  mode?: 'ring' | 'lottie';
  lottieSource?: unknown;
};

export function PreLoader({ message = 'Loading...', mode = 'ring' }: PreLoaderProps) {
  const opacity = useRef(new Animated.Value(0.72)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.72,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.98,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [opacity, scale]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
        <Image
          source={require('@/assets/images/icon.png')}
          contentFit="contain"
          style={styles.logo}
        />
        <ActivityIndicator
          color={mode === 'lottie' ? '#0f6cbd' : '#1f7ae0'}
          size="small"
          style={styles.spinner}
        />
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 24,
  },
  card: {
    width: 160,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(15,108,189,0.08)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 4,
  },
  logo: {
    width: 52,
    height: 52,
    marginBottom: 14,
  },
  spinner: {
    marginBottom: 12,
  },
  message: {
    color: '#334155',
    fontSize: 13,
    textAlign: 'center',
  },
});
