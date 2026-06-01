import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NB } from '@/constants/theme';
import BrutalIcon, { IconName } from './BrutalIcon';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  accentColor?: string;
  rightSlot?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  iconColor = NB.color.text,
  accentColor = NB.color.secondary,
  rightSlot,
}: PageHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.inner}>
        <View style={styles.left}>
          {icon && (
            <View style={[styles.iconBlock, { backgroundColor: accentColor }]}>
              <BrutalIcon name={icon} size={28} color={iconColor} strokeWidth={2.5} />
            </View>
          )}
          <View style={styles.textBlock}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        {rightSlot ? <View style={styles.right}>{rightSlot}</View> : null}
      </View>
      {/* Bold bottom accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: NB.color.surface,
    borderBottomWidth: NB.border.thick,
    borderBottomColor: NB.color.border,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 0 #111111' } as any
      : {}),
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 14,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconBlock: {
    width: 52,
    height: 52,
    borderRadius: NB.radius.sm,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#111111',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  textBlock: { flex: 1 },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: NB.color.text,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: NB.color.muted,
    marginTop: 2,
  },
  right: {},
  accentBar: {
    height: 4,
    borderTopWidth: NB.border.thin,
    borderTopColor: NB.color.border,
  },
});
