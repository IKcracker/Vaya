import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURATION = 700;

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const keyframe = new Keyframe({
    0: { opacity: 1, transform: [{ scale: 1 }] },
    65: { opacity: 1, transform: [{ scale: 1.02 }] },
    100: { opacity: 0, transform: [{ scale: 1.05 }], easing: Easing.out(Easing.quad) },
  });

  const content = (
    <View style={styles.content}>
      <View style={styles.logoMark}>
        <View style={styles.logoDrop} />
        <View style={styles.logoCutout} />
      </View>
      <Text style={styles.brand}>Vaya</Text>
      <Text style={styles.tagline}>Share Rides. Go Further Together.</Text>
    </View>
  );

  return animate ? (
    <Animated.View
      entering={keyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) scheduleOnRN(setVisible, false);
      })}
      style={styles.splashOverlay}>
      {content}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => setAnimate(true));
      }}
      style={styles.splashOverlay}>
      {content}
    </View>
  );
}

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <View style={styles.logoMark}>
        <View style={styles.logoDrop} />
        <View style={styles.logoCutout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#052D2B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: { alignItems: 'center' },
  logoMark: {
    width: 72,
    height: 92,
    borderRadius: 38,
    backgroundColor: '#10B981',
    transform: [{ rotate: '18deg' }],
    overflow: 'hidden',
  },
  logoDrop: {
    position: 'absolute',
    left: 10,
    bottom: 6,
    width: 50,
    height: 52,
    borderRadius: 28,
    backgroundColor: '#D7F65B',
  },
  logoCutout: {
    position: 'absolute',
    left: 20,
    top: 15,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#063C35',
  },
  brand: { color: '#FFFFFF', fontSize: 44, fontWeight: '900', letterSpacing: -1.7, marginTop: 20 },
  tagline: { color: '#D0E9E1', fontSize: 12, fontWeight: '700', marginTop: 6 },
  iconContainer: { width: 96, height: 110, alignItems: 'center', justifyContent: 'center' },
});
