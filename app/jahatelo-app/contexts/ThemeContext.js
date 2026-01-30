import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const theme = 'light';
  const isDark = false;
  const setTheme = async () => {};
  const toggleTheme = () => {};

  const value = {
    theme, // 'light', 'dark', 'auto'
    isDark, // boolean - el tema efectivo actual
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
