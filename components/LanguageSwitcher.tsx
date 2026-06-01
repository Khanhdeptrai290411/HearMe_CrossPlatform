import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { NB } from '@/constants/theme';

export default function LanguageSwitcher() {
  const { locale, setLanguage } = useLanguage();

  return (
    <View style={[
      styles.container,
      Platform.OS === 'web' && { boxShadow: '2px 2px 0px #111111' } as any
    ]}>
      {/* Vietnamese Option */}
      <TouchableOpacity
        style={[
          styles.segment,
          locale === 'vi' ? styles.activeSegment : styles.inactiveSegment,
        ]}
        onPress={() => setLanguage('vi')}
        activeOpacity={0.85}
      >
        <Text style={[
          styles.text,
          locale === 'vi' ? styles.activeText : styles.inactiveText,
        ]}>
          VI
        </Text>
      </TouchableOpacity>

      {/* Japanese Option */}
      <TouchableOpacity
        style={[
          styles.segment,
          locale === 'ja' ? styles.activeSegment : styles.inactiveSegment,
        ]}
        onPress={() => setLanguage('ja')}
        activeOpacity={0.85}
      >
        <Text style={[
          styles.text,
          locale === 'ja' ? styles.activeText : styles.inactiveText,
        ]}>
          日本語
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: NB.color.surface,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    borderRadius: NB.radius.sm,
    overflow: 'hidden',
    alignSelf: 'center',
    ...(Platform.OS !== 'web' ? {
      shadowColor: '#111111',
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 3,
    } : {}),
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      transition: 'all 0.12s ease',
      cursor: 'pointer',
    } : {}),
  },
  activeSegment: {
    backgroundColor: NB.color.secondary,
    borderRightWidth: NB.border.thin,
    borderLeftWidth: NB.border.thin,
    borderColor: NB.color.border,
    marginHorizontal: -1, // collapse borders
  },
  inactiveSegment: {
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  activeText: {
    color: NB.color.text,
  },
  inactiveText: {
    color: NB.color.muted,
  },
});
