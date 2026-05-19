import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const FloatingButton = ({ onPress }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Entry animation
    translateY.value = withSpring(0, { damping: 12, stiffness: 90 });
    opacity.value = withTiming(1, { duration: 500 });

    // Continuous pulse ring
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 1200, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1200 }),
        withTiming(0.5, { duration: 0 })
      ),
      -1,
      false
    );

    // Subtle bounce
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withSpring(1.08, { damping: 4 }),
        withSpring(1, { damping: 8 })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const styles = makeStyles(theme);

  return (
    <Animated.View style={[styles.wrapper, animStyle]}>
      {/* Pulse ring */}
      <Animated.View style={[styles.pulseRing, pulseStyle]} />

      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>+</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const makeStyles = (theme) => StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  pulseRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: theme.primary,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 12,
  },
  icon: {
    fontSize: 30,
    color: '#000',
    fontWeight: '300',
    lineHeight: 34,
    marginTop: -2,
  },
});

export default FloatingButton;
