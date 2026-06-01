import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NB } from '@/constants/theme';
import BrutalIcon from './BrutalIcon';

interface BrutalSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: object;
}

export default function BrutalSearch({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
}: BrutalSearchProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.wrapper,
        focused && styles.wrapperFocused,
        Platform.OS === 'web' && (focused
          ? { boxShadow: '5px 5px 0px #111111', transition: 'all 0.12s ease' } as any
          : { boxShadow: '3px 3px 0px #111111', transition: 'all 0.12s ease' } as any),
        style,
      ]}
    >
      <BrutalIcon name="search" size={18} color={focused ? NB.color.primary : NB.color.muted} strokeWidth={2.5} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={NB.color.muted}
        returnKeyType="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        clearButtonMode="while-editing"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearBtn}>
          <BrutalIcon name="close" size={14} color={NB.color.muted} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NB.color.surface,
    borderRadius: NB.radius.md,
    borderWidth: NB.border.thick,
    borderColor: NB.color.border,
    paddingHorizontal: NB.space.lg,
    paddingVertical: NB.space.md,
    gap: NB.space.sm,
    ...(Platform.OS !== 'web' ? {
      shadowColor: '#111111',
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 4,
    } : {}),
  },
  wrapperFocused: {
    borderColor: NB.color.primary,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: NB.color.text,
    padding: 0,
    margin: 0,
  },
  clearBtn: {
    padding: 2,
  },
});
