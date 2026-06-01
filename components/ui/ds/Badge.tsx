import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NB } from '@/constants/theme';

type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'neutral';

interface BrutalBadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: string;
  style?: object;
}

const VARIANTS: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  primary: { bg: NB.color.primaryLight, text: NB.color.primary, border: NB.color.primary },
  secondary: { bg: NB.color.secondary, text: NB.color.text, border: NB.color.border },
  accent: { bg: NB.color.accent, text: '#FFFFFF', border: NB.color.border },
  danger: { bg: NB.color.danger, text: '#FFFFFF', border: NB.color.border },
  neutral: { bg: NB.color.mutedBg, text: NB.color.muted, border: NB.color.border },
};

export default function BrutalBadge({ label, variant = 'primary', icon, style }: BrutalBadgeProps) {
  const v = VARIANTS[variant];
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          ...(Platform.OS === 'web' ? { boxShadow: '2px 2px 0px #111111' } : {
            shadowColor: '#111111',
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 2,
          }),
        },
        style,
      ]}
    >
      {icon ? <Text style={[styles.icon, { color: v.text }]}>{icon}</Text> : null}
      <Text style={[styles.label, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: NB.radius.sm,
    borderWidth: NB.border.thin,
    alignSelf: 'flex-start',
  },
  icon: { fontSize: 11, fontWeight: '700' },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
});
