
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme, Theme } from '../../contexts/ThemeContext';

interface GSTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption';
  color?: keyof Theme['colors'] | string;
  weight?: 'normal' | 'bold' | 'semiBold';
  children: React.ReactNode;
}

export default function GSText({ 
  variant = 'body', 
  color, 
  weight = 'normal',
  style,
  children,
  ...props 
}: GSTextProps) {
  const { theme } = useTheme();

  const getTextStyle = () => {
    const baseStyle = {
      fontFamily: theme.typography.fontFamily.regular,
      color: color ? 
        (theme.colors[color as keyof Theme['colors']] || color) : 
        theme.colors.text,
    };

    // Font weight
    if (weight === 'bold') {
      baseStyle.fontFamily = theme.typography.fontFamily.bold;
    } else if (weight === 'semiBold') {
      baseStyle.fontFamily = theme.typography.fontFamily.semiBold;
    }

    // Variant-specific styles
    const variantStyles = {
      h1: {
        fontSize: theme.typography.fontSize['4xl'],
        lineHeight: theme.typography.fontSize['4xl'] * theme.typography.lineHeight.tight,
        fontFamily: theme.typography.fontFamily.bold,
      },
      h2: {
        fontSize: theme.typography.fontSize['3xl'],
        lineHeight: theme.typography.fontSize['3xl'] * theme.typography.lineHeight.tight,
        fontFamily: theme.typography.fontFamily.bold,
      },
      h3: {
        fontSize: theme.typography.fontSize['2xl'],
        lineHeight: theme.typography.fontSize['2xl'] * theme.typography.lineHeight.snug,
        fontFamily: theme.typography.fontFamily.bold,
      },
      h4: {
        fontSize: theme.typography.fontSize.xl,
        lineHeight: theme.typography.fontSize.xl * theme.typography.lineHeight.snug,
        fontFamily: theme.typography.fontFamily.semiBold,
      },
      h5: {
        fontSize: theme.typography.fontSize.lg,
        lineHeight: theme.typography.fontSize.lg * theme.typography.lineHeight.snug,
        fontFamily: theme.typography.fontFamily.semiBold,
      },
      h6: {
        fontSize: theme.typography.fontSize.base,
        lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
        fontFamily: theme.typography.fontFamily.semiBold,
      },
      body: {
        fontSize: theme.typography.fontSize.base,
        lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
      },
      caption: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  return (
    <Text style={[getTextStyle(), style]} {...props}>
      {children}
    </Text>
  );
}
