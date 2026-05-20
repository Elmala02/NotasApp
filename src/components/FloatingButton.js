import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const FloatingButton = ({ onPress }) => {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, friction: 6, tension: 90, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true })
    ]).start();

    // Continuous pulse ring
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1.6, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 1200, useNativeDriver: true })
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true })
        ])
      ])
    ).start();

    // Subtle bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1.08, friction: 4, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const animStyle = {
    transform: [{ scale }, { translateY }],
    opacity,
  };

  const pulseStyle = {
    transform: [{ scale: pulseScale }],
    opacity: pulseOpacity,
  };

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
