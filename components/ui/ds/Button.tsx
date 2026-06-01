import React, { useRef } from 'react';
import {
  TouchableOpacity, Text, StyleSheet,
  ActivityIndicator, Animated, Platform, View,
} from 'react-native';
import { NB } from '@/constants/theme';
import BrutalIcon, { IconName } from './BrutalIcon';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface BrutalButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  iconRight?: boolean;
  fullWidth?: boolean;
  style?: object;
}

export default function BrutalButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight = false,
  fullWidth = false,
  style,
}: BrutalButtonProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (Platform.OS !== 'web') {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 3, duration: 80, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 3, duration: 80, useNativeDriver: true }),
      ]).start();
    }
  };

  const handlePressOut = () => {
    if (Platform.OS !== 'web') {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 120, useNativeDriver: true }),
      ]).start();
    }
  };

  const v = VARIANT_MAP[variant];
  const s = SIZE_MAP[size];
  const isDisabled = disabled || loading;
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  return (
    <Animated.View
      style={[
        { transform: [{ translateX }, { translateY }] },
        fullWidth && { width: '100%' },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.base,
          v.container,
          s.container,
          isDisabled && styles.disabled,
          fullWidth && styles.fullWidth,
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator size="small" color={v.textColor} />
        ) : (
          <View style={[styles.content, iconRight && { flexDirection: 'row-reverse' }]}>
            {icon && (
              <BrutalIcon name={icon} size={iconSize} color={v.textColor} strokeWidth={2.5} />
            )}
            <Text style={[styles.label, { color: v.textColor }, s.text]}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Variant configurations ──────────────────────────────────────────────────
const VARIANT_MAP: Record<Variant, { container: object; textColor: string }> = {
  primary: {
    container: {
      backgroundColor: NB.color.primary,
      borderWidth: NB.border.thick,
      borderColor: NB.color.border,
      ...(Platform.OS === 'web'
        ? { boxShadow: '5px 5px 0px #111111', transition: 'all 0.12s ease', cursor: 'pointer' }
        : NB.shadow.md),
    },
    textColor: '#FFFFFF',
  },
  secondary: {
    container: {
      backgroundColor: NB.color.secondary,
      borderWidth: NB.border.thick,
      borderColor: NB.color.border,
      ...(Platform.OS === 'web'
        ? { boxShadow: '5px 5px 0px #111111', transition: 'all 0.12s ease', cursor: 'pointer' }
        : NB.shadow.md),
    },
    textColor: NB.color.text,
  },
  accent: {
    container: {
      backgroundColor: NB.color.accent,
      borderWidth: NB.border.thick,
      borderColor: NB.color.border,
      ...(Platform.OS === 'web'
        ? { boxShadow: '5px 5px 0px #111111', transition: 'all 0.12s ease', cursor: 'pointer' }
        : NB.shadow.md),
    },
    textColor: '#FFFFFF',
  },
  ghost: {
    container: {
      backgroundColor: NB.color.surface,
      borderWidth: NB.border.thick,
      borderColor: NB.color.border,
      ...(Platform.OS === 'web'
        ? { boxShadow: '3px 3px 0px #111111', transition: 'all 0.12s ease', cursor: 'pointer' }
        : NB.shadow.sm),
    },
    textColor: NB.color.text,
  },
  danger: {
    container: {
      backgroundColor: NB.color.surface,
      borderWidth: NB.border.thick,
      borderColor: NB.color.danger,
      ...(Platform.OS === 'web'
        ? { boxShadow: '3px 3px 0px #FF4D6D', transition: 'all 0.12s ease', cursor: 'pointer' }
        : { ...NB.shadow.sm, shadowColor: NB.color.danger }),
    },
    textColor: NB.color.danger,
  },
};

const SIZE_MAP: Record<Size, { container: object; text: object }> = {
  sm: {
    container: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: NB.radius.sm },
    text: { fontSize: 13, fontWeight: '700' as const },
  },
  md: {
    container: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: NB.radius.md },
    text: { fontSize: 15, fontWeight: '800' as const },
  },
  lg: {
    container: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: NB.radius.md },
    text: { fontSize: 17, fontWeight: '900' as const },
  },
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {},
  disabled: { opacity: 0.45 },
  fullWidth: { width: '100%' },
});
