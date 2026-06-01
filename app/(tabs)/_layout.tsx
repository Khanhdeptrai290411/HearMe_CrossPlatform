import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import WebNavbar, { WEB_NAVBAR_HEIGHT } from '@/components/WebNavbar';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isWeb = Platform.OS === 'web';
  const { t } = useLanguage();

  const tabItems = [
    { name: 'index', title: t('nav.home'), icon: 'house.fill', href: '/(tabs)' },
    { name: 'lessons', title: t('nav.lessons'), icon: 'book.fill', href: '/(tabs)/lessons' },
    { name: 'flashcards', title: t('nav.flashcards'), icon: 'rectangle.stack.fill', href: '/(tabs)/flashcards' },
    { name: 'library', title: t('nav.library'), icon: 'books.vertical.fill', href: '/(tabs)/library' },
    { name: 'profile', title: t('nav.profile'), icon: 'person.fill', href: '/(tabs)/profile' },
  ] as const;

  return (
    <>
      {isWeb && <WebNavbar items={tabItems.map(({ title, href }) => ({ label: title, href }))} />}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          sceneStyle: isWeb ? { paddingTop: WEB_NAVBAR_HEIGHT + 8 } : undefined,
          tabBarStyle: isWeb
            ? { display: 'none' }
            : {
                backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
                borderTopColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
              },
        }}
      >
        {tabItems.map((item) => (
          <Tabs.Screen
            key={item.name}
            name={item.name}
            options={{
              title: item.title,
              href: item.href,
              tabBarIcon: ({ color }) => <IconSymbol size={28} name={item.icon as any} color={color} />,
            }}
          />
        ))}
      </Tabs>
    </>
  );
}
