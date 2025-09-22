
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { theme, Theme } from '../constants/theme';

interface ThemeState {
  theme: Theme;
  isDarkMode: boolean;
}

interface ThemeContextType extends ThemeState {
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeAction = 
  | { type: 'TOGGLE_THEME' };

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case 'TOGGLE_THEME':
      return {
        ...state,
        isDarkMode: !state.isDarkMode,
        theme: !state.isDarkMode ? {
          ...theme,
          colors: {
            ...theme.colors,
            background: '#1A1A1A',
            surface: '#2D2D2D',
            text: '#FFFFFF',
            textSecondary: '#B3B3B3',
            textLight: '#808080',
          }
        } : theme,
      };
    default:
      return state;
  }
};

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [state, dispatch] = useReducer(themeReducer, {
    theme,
    isDarkMode: false,
  });

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  return (
    <ThemeContext.Provider 
      value={{
        ...state,
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
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
