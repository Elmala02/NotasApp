import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, Animated, Easing } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import CreateNoteScreen from './src/screens/CreateNoteScreen';
import DetailScreen from './src/screens/DetailScreen';

const { width, height } = Dimensions.get('window');
const Stack = createNativeStackNavigator();

// ─── SPLASH SCREEN ────────────────────────────────────────────────────────────
const SplashScreen = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Ring expand
    Animated.parallel([
      Animated.timing(ringScale, { toValue: 2.5, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(ringOpacity, { toValue: 0, duration: 1200, useNativeDriver: true })
    ]).start();

    // Logo entrance
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true })
      ])
    ]).start();

    // Glow pulse
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(glowOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(glowOpacity, { toValue: 0.4, duration: 400, useNativeDriver: true }),
      Animated.timing(glowOpacity, { toValue: 0.8, duration: 400, useNativeDriver: true })
    ]).start();

    // Tagline
    Animated.sequence([
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(taglineY, { toValue: 0, friction: 6, useNativeDriver: true })
      ])
    ]).start();

    // Exit
    setTimeout(() => {
      Animated.timing(screenOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
        onFinish();
      });
    }, 2600);
  }, []);

  const logoStyle = {
    transform: [{ scale: logoScale }],
    opacity: logoOpacity,
  };

  const glowStyle = {
    opacity: glowOpacity,
  };

  const taglineStyle = {
    opacity: taglineOpacity,
    transform: [{ translateY: taglineY }],
  };

  const screenStyle = {
    opacity: screenOpacity,
  };

  const ringStyle = {
    transform: [{ scale: ringScale }],
    opacity: ringOpacity,
  };

  return (
    <Animated.View style={[styles.splash, screenStyle]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      {/* Grid background */}
      <View style={styles.grid}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLine, styles.gridLineH, { top: `${i * 11}%` }]} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLine, styles.gridLineV, { left: `${i * 11}%` }]} />
        ))}
      </View>

      {/* Pulse ring */}
      <Animated.View style={[styles.splashRing, ringStyle]} />

      {/* Glow background */}
      <Animated.View style={[styles.splashGlow, glowStyle]} />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Text style={styles.logoSymbol}>◈</Text>
        <View style={styles.logoTextRow}>
          <Text style={styles.logoTextWhite}>NEXT</Text>
          <Text style={styles.logoTextCyan}>NOTES</Text>
        </View>
        <View style={styles.logoDivider} />
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, taglineStyle]}>
        NOTAS INTELIGENTES DEL FUTURO
      </Animated.Text>

      {/* Version */}
      <Text style={styles.version}>v1.0.0 · CYBERPUNK EDITION</Text>
    </Animated.View>
  );
};

// ─── APP NAVIGATOR ────────────────────────────────────────────────────────────
const AppNavigator = () => {
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="CreateNote"
          component={CreateNoteScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {!splashDone ? (
          <SplashScreen onFinish={() => setSplashDone(true)} />
        ) : (
          <AppNavigator />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#00D4FF',
  },
  gridLineH: {
    left: 0,
    right: 0,
    height: 1,
  },
  gridLineV: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  splashRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#00D4FF',
    opacity: 0.6,
  },
  splashGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#00D4FF',
    opacity: 0,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoSymbol: {
    fontSize: 60,
    color: '#00D4FF',
    textShadowColor: '#00D4FF',
    textShadowRadius: 20,
    marginBottom: 12,
  },
  logoTextRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  logoTextWhite: {
    fontSize: 42,
    fontWeight: '900',
    color: '#E8E8FF',
    letterSpacing: 6,
  },
  logoTextCyan: {
    fontSize: 42,
    fontWeight: '900',
    color: '#00D4FF',
    letterSpacing: 6,
    textShadowColor: '#00D4FF',
    textShadowRadius: 12,
  },
  logoDivider: {
    height: 2,
    width: 200,
    backgroundColor: '#00D4FF',
    marginTop: 12,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A7A9D',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 8,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 10,
    color: '#4A4A6A',
    letterSpacing: 2,
    fontWeight: '600',
  },
});
