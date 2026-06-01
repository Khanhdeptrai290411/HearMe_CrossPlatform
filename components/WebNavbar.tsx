import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Link, usePathname, useRouter } from 'expo-router';
import { NB } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export type WebNavItem = {
  label: string;
  href: string;
};

interface WebNavbarProps {
  items: ReadonlyArray<WebNavItem>;
}

const NAV_HEIGHT = 68;
export const WEB_NAVBAR_HEIGHT = NAV_HEIGHT;

export default function WebNavbar({ items }: WebNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const initials = user?.fullName
    ? user.fullName.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase()
    : '?';

  const navStyle: any = {
    width: '100%',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 100,
    backgroundColor: NB.color.bg,
    borderBottomWidth: NB.border.thick,
    borderBottomColor: NB.color.border,
    borderBottomStyle: 'solid',
    transition: 'box-shadow 0.18s ease',
    ...(scrolled ? { boxShadow: '0 6px 0 #111111' } : { boxShadow: '0 3px 0 #111111' }),
  };

  return (
    <View style={[styles.wrapper, Platform.OS === 'web' && navStyle]}>
      <View style={styles.container}>
        {/* Logo */}
        <Link href="/(tabs)" style={styles.logoLink}>
          <View style={styles.logoWrap}>
            <View style={styles.logoIconBox}>
              <Text style={styles.logoHand}>🤟</Text>
            </View>
            <Text style={styles.logoText}>HearMe</Text>
          </View>
        </Link>

        {/* Nav Items */}
        <View style={styles.navItems}>
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/(tabs)' && pathname.startsWith(item.href.replace('/(tabs)', '')));

            const linkStyle: any = {
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: NB.radius.sm,
              borderWidth: isActive ? NB.border.regular : 0,
              borderColor: NB.color.border,
              backgroundColor: isActive ? NB.color.secondary : 'transparent',
              transition: 'all 0.12s ease',
              cursor: 'pointer',
              textDecorationLine: 'none',
              ...(isActive ? {
                boxShadow: '3px 3px 0px #111111',
              } : {
                ':hover': {
                  backgroundColor: NB.color.mutedBg,
                  borderWidth: NB.border.regular,
                  borderColor: NB.color.border,
                },
              }),
            };

            return (
              <Link
                href={item.href as any}
                key={item.href}
                style={Platform.OS === 'web' ? linkStyle : [styles.linkBase, isActive && styles.linkActive]}
              >
                <Text style={[styles.linkText, isActive && styles.linkTextActive]}>
                  {item.label}
                </Text>
              </Link>
            );
          })}
        </View>

        {/* Actions (Language Switcher + User Avatar) */}
        <View style={styles.actionsWrap}>
          <LanguageSwitcher />

          {user && (
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.85}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: NB.color.bg,
    borderBottomWidth: NB.border.thick,
    borderBottomColor: NB.color.border,
  },
  container: {
    height: NAV_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: 1300,
    width: '100%',
    alignSelf: 'center',
    gap: 8,
  },
  // Logo
  logoLink: { textDecorationLine: 'none' },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIconBox: {
    width: 38,
    height: 38,
    borderRadius: NB.radius.sm,
    backgroundColor: NB.color.secondary,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#111111',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  logoHand: { fontSize: 20 },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: NB.color.text,
    letterSpacing: -0.5,
  },

  // Nav links
  navItems: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 4,
  },
  linkBase: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: NB.radius.sm,
  },
  linkActive: {
    backgroundColor: NB.color.secondary,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: NB.color.muted,
  },
  linkTextActive: {
    color: NB.color.text,
    fontWeight: '900',
  },

  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 16,
  },
  // Avatar
  avatar: {
    width: 40,
    height: 40,
    borderRadius: NB.radius.sm,
    backgroundColor: NB.color.primary,
    borderWidth: NB.border.regular,
    borderColor: NB.color.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#111111',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
