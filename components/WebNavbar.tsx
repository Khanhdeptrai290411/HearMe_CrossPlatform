import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Link, usePathname } from 'expo-router';

export type WebNavItem = {
  label: string;
  href: string;
};

interface WebNavbarProps {
  items: ReadonlyArray<WebNavItem>;
}

const NAV_HEIGHT = 64;

export const WEB_NAVBAR_HEIGHT = NAV_HEIGHT;

export default function WebNavbar({ items }: WebNavbarProps) {
  const pathname = usePathname();

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.logo}>HearMe</Text>
        <View style={styles.links}>
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/(tabs)' && pathname.startsWith(item.href));

            const linkStyles = isActive ? [styles.link, styles.linkActive] : [styles.link];
            const textStyles = isActive ? [styles.linkText, styles.linkTextActive] : [styles.linkText];

            return (
              <Link href={item.href as any} key={item.href} style={linkStyles}>
                <Text style={textStyles}>
                  {item.label}
                </Text>
              </Link>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 50,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)' }
      : {}),
  },
  container: {
    height: NAV_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 48,
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    gap: 32,
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginLeft: 'auto',
    gap: 4,
  },
  link: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginLeft: 8,
  },
  linkActive: {
    backgroundColor: '#111827',
  },
  linkText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  linkTextActive: {
    color: '#ffffff',
  },
});

