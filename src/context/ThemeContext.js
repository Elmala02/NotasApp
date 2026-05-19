import React, { createContext, useContext, useState } from 'react';

export const darkTheme = {
  background: '#0A0A0F',
  surface: '#12121A',
  card: '#1A1A28',
  cardBorder: '#2A2A45',
  primary: '#00D4FF',
  secondary: '#9B59B6',
  accent: '#FF006E',
  text: '#E8E8FF',
  textSecondary: '#7A7A9D',
  textMuted: '#4A4A6A',
  success: '#00FF88',
  warning: '#FFD700',
  danger: '#FF4444',
  gradient1: '#00D4FF',
  gradient2: '#9B59B6',
  inputBg: '#1E1E2E',
  inputBorder: '#2A2A45',
  shadow: 'rgba(0, 212, 255, 0.15)',
  shadowDark: 'rgba(0, 0, 0, 0.8)',
};

export const lightTheme = {
  background: '#F0F0F8',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E0E0F0',
  primary: '#0099CC',
  secondary: '#7B44A3',
  accent: '#CC0055',
  text: '#1A1A2E',
  textSecondary: '#555577',
  textMuted: '#9999BB',
  success: '#00BB66',
  warning: '#DDAA00',
  danger: '#CC3333',
  gradient1: '#0099CC',
  gradient2: '#7B44A3',
  inputBg: '#F5F5FF',
  inputBorder: '#CCCCEE',
  shadow: 'rgba(0, 153, 204, 0.12)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
