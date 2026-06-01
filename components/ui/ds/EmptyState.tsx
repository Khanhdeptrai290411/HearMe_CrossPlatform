import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { NB } from '@/constants/theme';
import BrutalIcon, { IconName } from './BrutalIcon';

interface BrutalEmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  accentColor?: string;
}

export default function BrutalEmptyState({
  icon = 'search',
  title,
  description,
  ctaLabel,
  onCta,
  accentColor = NB.color.secondary,
}: BrutalEmptyStateProps) {
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -10, duration: 1600, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Animated icon block */}
      <Animated.View style={{ transform: [{ translateY: floatY }] }}>
        <View style={[styles.iconBox, { backgroundColor: accentColor }]}>
          <BrutalIcon name={icon} size={48} color={NB.color.text} strokeWidth={2.5} />
        </View>
      </Animated.View>

      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}

      {ctaLabel && onCta ? (
        <TouchableOpacity style={styles.cta} onPress={onCta} activeOpacity={0.88}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
    gap: NB.space.lg,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: NB.radius.md,
    borderWidth: NB.border.thick,
    borderColor: NB.color.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#111111',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: NB.color.text,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    fontWeight: '600',
    color: NB.color.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  cta: {
    backgroundColor: NB.color.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: NB.radius.md,
    borderWidth: NB.border.thick,
    borderColor: NB.color.border,
    shadowColor: '#111111',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
