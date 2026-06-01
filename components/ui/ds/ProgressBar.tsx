import React, { useEffect, useRef } from 'react';
import { View, Animated, Text, StyleSheet, Platform } from 'react-native';
import { NB } from '@/constants/theme';

interface BrutalProgressProps {
  progress: number; // 0–1
  color?: string;
  height?: number;
  label?: string;
  showPercent?: boolean;
  style?: object;
}

export default function BrutalProgress({
  progress,
  color = NB.color.primary,
  height = 14,
  label,
  showPercent = false,
  style,
}: BrutalProgressProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(Math.max(progress, 0), 1),
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthPct = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const pct = Math.round(progress * 100);

  return (
    <View style={style}>
      {(label || showPercent) && (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {showPercent ? <Text style={[styles.pct, { color }]}>{pct}%</Text> : null}
        </View>
      )}
      {/* Outer border track */}
      <View
        style={[
          styles.track,
          { height: height + 4, borderRadius: NB.radius.sm },
          Platform.OS === 'web'
            ? { boxShadow: '3px 3px 0px #111111' } as any
            : { shadowColor: '#111111', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
        ]}
      >
        {/* Inner fill area */}
        <View style={[styles.inner, { height }]}>
          {/* Background stripes */}
          <View style={[StyleSheet.absoluteFillObject, styles.stripes]} />
          {/* Animated fill */}
          <Animated.View
            style={[
              styles.fill,
              { height, backgroundColor: color, width: widthPct, borderRadius: NB.radius.xs },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: { fontSize: 13, fontWeight: '700', color: NB.color.text },
  pct: { fontSize: 13, fontWeight: '900' },
  track: {
    backgroundColor: NB.color.surface,
    borderWidth: NB.border.thin,
    borderColor: NB.color.border,
    padding: 2,
    overflow: 'hidden',
  },
  inner: {
    backgroundColor: NB.color.mutedBg,
    overflow: 'hidden',
    borderRadius: NB.radius.xs,
  },
  stripes: {
    opacity: 0.04,
    ...(Platform.OS === 'web' ? {
      backgroundImage: 'repeating-linear-gradient(45deg, #111111 0, #111111 1px, transparent 0, transparent 50%)',
      backgroundSize: '8px 8px',
    } as any : {}),
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
