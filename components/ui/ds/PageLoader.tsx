import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, DimensionValue } from 'react-native';
import { NB } from '@/constants/theme';

const ACCENT_COLORS = [NB.color.secondary, NB.color.primaryLight, NB.color.accentLight];

function ShimmerBlock({
  width,
  height = 16,
  accentIdx = 0,
}: {
  width: DimensionValue;
  height?: number;
  accentIdx?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [NB.color.mutedBg, ACCENT_COLORS[accentIdx % ACCENT_COLORS.length]],
  });

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius: NB.radius.sm,
        backgroundColor: bg,
        borderWidth: 1.5,
        borderColor: NB.color.border,
      }}
    />
  );
}

export default function BrutalLoader() {
  return (
    <View style={styles.container}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.card}>
          <View style={styles.row}>
            <ShimmerBlock width={48} height={48} accentIdx={i} />
            <View style={styles.col}>
              <ShimmerBlock width="55%" height={12} accentIdx={(i + 1) % 3} />
              <ShimmerBlock width="80%" height={20} accentIdx={(i + 2) % 3} />
            </View>
          </View>
          <ShimmerBlock width="100%" height={10} accentIdx={i} />
          <ShimmerBlock width="68%" height={10} accentIdx={(i + 1) % 3} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
    backgroundColor: NB.color.bg,
  },
  card: {
    backgroundColor: NB.color.surface,
    borderRadius: NB.radius.md,
    padding: NB.space.xl,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    gap: 12,
    shadowColor: '#111111',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  col: { flex: 1, gap: 8 },
});
