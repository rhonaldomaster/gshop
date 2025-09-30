import React from 'react';
import { Text, TextProps } from 'react-native';

interface GSTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption';
  color?: string;
  weight?: 'normal' | 'bold' | 'semiBold';
  children: React.ReactNode;
}

export default function GSText({
  children,
  style,
  ...props
}: GSTextProps) {
  return (
    <Text style={style} {...props}>
      {children}
    </Text>
  );
}