import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import WebNavbar, { WEB_NAVBAR_HEIGHT } from '@/components/WebNavbar';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TAB_ITEMS = [
  { name: 'index', title: 'Trang chủ', icon: 'house.fill', href: '/(tabs)' },
  { name: 'lessons', title: 'Bài học', icon: 'book.fill', href: '/(tabs)/lessons' },
  { name: 'flashcards', title: 'Flashcards', icon: 'rectangle.stack.fill', href: '/(tabs)/flashcards' },
  { name: 'library', title: 'Thư viện', icon: 'books.vertical.fill', href: '/(tabs)/library' },
  { name: 'profile', title: 'Cá nhân', icon: 'person.fill', href: '/(tabs)/profile' },
] as const;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isWeb = Platform.OS === 'web';

  return (
    <>
      {isWeb && <WebNavbar items={TAB_ITEMS.map(({ title, href }) => ({ label: title, href }))} />}
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
      }}>
        {TAB_ITEMS.map((item) => (
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
