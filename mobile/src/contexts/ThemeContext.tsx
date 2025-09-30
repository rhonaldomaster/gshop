import React, { createContext, useContext, ReactNode } from 'react';

// Simple theme object with all the colors and styles we need
const defaultTheme = {
  colors: {
    primary: '#27BFF9',
    primaryDark: '#1AA5DC',
    secondary: '#633EBB',
    accent: '#994636',
    accentDark: '#7A3829',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',
    success: '#00C853',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    white: '#FFFFFF',
    black: '#000000',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
  },
  typography: {
    fontFamily: {
      regular: 'System',
      semiBold: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

export type Theme = typeof defaultTheme;

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isDarkMode: false,
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const toggleTheme = () => {
    // TODO: Implement dark mode toggle
    console.log('Theme toggle not implemented yet');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: defaultTheme,
        isDarkMode: false,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default theme if context not available (shouldn't happen but safe fallback)
    return {
      theme: defaultTheme,
      isDarkMode: false,
      toggleTheme: () => {},
    };
  }
  return context;
}

export { defaultTheme as theme };