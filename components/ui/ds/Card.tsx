import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { NB } from '@/constants/theme';

interface BrutalCardProps {
  children: React.ReactNode;
  style?: object;
  padded?: boolean;
  color?: string;        // background color override
  hoverable?: boolean;
  onPress?: () => void;
}

export default function BrutalCard({
  children,
  style,
  padded = true,
  color,
  hoverable = false,
  onPress,
}: BrutalCardProps) {
  const containerStyle = [
    styles.card,
    { backgroundColor: color ?? NB.color.surface },
    padded && styles.padded,
    hoverable && Platform.OS === 'web' && styles.hoverable,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.92}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: NB.radius.md,
    borderWidth: NB.border.thick,
    borderColor: NB.color.border,
    ...(Platform.OS === 'web'
      ? { boxShadow: '5px 5px 0px #111111' }
      : {
          shadowColor: '#111111',
          shadowOffset: { width: 5, height: 5 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 6,
        }),
  },
  padded: {
    padding: NB.space.xl,
  },
  hoverable: Platform.OS === 'web' ? ({
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    cursor: 'pointer',
    ':hover': {
      transform: 'translate(-4px, -4px)',
      boxShadow: '8px 8px 0px #111111',
    },
  } as any) : {},
});
