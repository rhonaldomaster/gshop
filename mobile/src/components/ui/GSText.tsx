import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface GSTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption';
  color?: string;
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
  const getTextStyle = () => {
    const baseStyle: any = {
      color: color || '#1A1A1A',
    };

    // Font weight
    if (weight === 'bold') {
      baseStyle.fontWeight = '700';
    } else if (weight === 'semiBold') {
      baseStyle.fontWeight = '600';
    } else {
      baseStyle.fontWeight = '400';
    }

    // Variant-specific styles
    const variantStyles: any = {
      h1: { fontSize: 36, lineHeight: 45 },
      h2: { fontSize: 30, lineHeight: 37 },
      h3: { fontSize: 24, lineHeight: 30 },
      h4: { fontSize: 20, lineHeight: 25 },
      h5: { fontSize: 18, lineHeight: 23 },
      h6: { fontSize: 16, lineHeight: 20 },
      body: { fontSize: 16, lineHeight: 24 },
      caption: { fontSize: 14, lineHeight: 21 },
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