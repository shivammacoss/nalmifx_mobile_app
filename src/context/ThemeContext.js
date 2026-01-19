import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

// Dark theme (Venta Black / Gold & Black)
const darkTheme = {
  name: 'Dark',
  isDark: true,
  colors: {
    primary: '#d4af37',
    primaryHover: '#c9a42e',
    secondary: '#fbbf24',
    accent: '#d4af37',
    bgPrimary: '#000000',
    bgSecondary: '#0a0a0a',
    bgCard: '#121212',
    bgHover: '#1a1a1a',
    textPrimary: '#ffffff',
    textSecondary: '#888888',
    textMuted: '#666666',
    border: '#1a1a1a',
    borderLight: '#2a2a2a',
    success: '#22c55e',
    error: '#ff4444',
    warning: '#fbbf24',
    info: '#3b82f6',
    buyColor: '#3b82f6',
    sellColor: '#ff4444',
    profitColor: '#22c55e',
    lossColor: '#ff4444',
    tabBarBg: '#000000',
    cardBg: '#121212',
  }
};

// Light theme (Pearl White)
const lightTheme = {
  name: 'Light',
  isDark: false,
  colors: {
    primary: '#d4af37',
    primaryHover: '#c9a42e',
    secondary: '#fbbf24',
    accent: '#d4af37',
    bgPrimary: '#f5f5f5',
    bgSecondary: '#ffffff',
    bgCard: '#ffffff',
    bgHover: '#e8e8e8',
    textPrimary: '#1a1a1a',
    textSecondary: '#666666',
    textMuted: '#888888',
    border: '#e0e0e0',
    borderLight: '#f0f0f0',
    success: '#22c55e',
    error: '#ff4444',
    warning: '#fbbf24',
    info: '#3b82f6',
    buyColor: '#3b82f6',
    sellColor: '#ff4444',
    profitColor: '#22c55e',
    lossColor: '#ff4444',
    tabBarBg: '#ffffff',
    cardBg: '#ffffff',
  }
};

const ThemeContext = createContext({
  theme: darkTheme,
  colors: darkTheme.colors,
  isDark: true,
  toggleTheme: () => {},
  loading: true,
});

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await SecureStore.getItemAsync('themeMode');
        if (savedTheme !== null) {
          setIsDark(savedTheme === 'dark');
        }
      } catch (error) {
        console.log('Error loading theme preference:', error.message);
      }
      setLoading(false);
    };
    loadThemePreference();
  }, []);

  const toggleTheme = async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    try {
      await SecureStore.setItemAsync('themeMode', newIsDark ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme preference:', error.message);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      colors: theme.colors, 
      isDark,
      toggleTheme,
      loading,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
