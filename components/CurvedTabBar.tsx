import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { IconSymbol } from './ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 70;
const ACTIVE_INDICATOR_SIZE = 60;

interface Tab {
  name: string;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { name: 'index', label: 'Trang chủ', icon: 'house.fill' },
  { name: 'lessons', label: 'Bài học', icon: 'book.fill' },
  { name: 'flashcards', label: 'Flashcards', icon: 'rectangle.stack.fill' },
  { name: 'library', label: 'Thư viện', icon: 'books.vertical.fill' },
  { name: 'profile', label: 'Cá nhân', icon: 'person.fill' },
];

interface CurvedTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function CurvedTabBar({ state, descriptors, navigation }: CurvedTabBarProps) {
  const colorScheme = useColorScheme();
  const activeIndex = state.index;
  const tabWidth = SCREEN_WIDTH / tabs.length;
  const animatedIndex = useSharedValue(activeIndex);

  React.useEffect(() => {
    animatedIndex.value = withSpring(activeIndex, {
      damping: 15,
      stiffness: 150,
    });
  }, [activeIndex]);

  const backgroundColor = colorScheme === 'dark' ? '#1f2937' : '#ffffff';
  const activeTintColor = Colors[colorScheme ?? 'light'].tint;
  const inactiveTintColor = colorScheme === 'dark' ? '#9ca3af' : '#6b7280';
  const borderColor = colorScheme === 'dark' ? '#374151' : '#e5e7eb';

  // Animated style cho active indicator (curved background)
  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const translateX = animatedIndex.value * tabWidth + (tabWidth - ACTIVE_INDICATOR_SIZE) / 2;

    return {
      transform: [{ translateX: withSpring(translateX, { damping: 15, stiffness: 150 }) }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor, borderTopColor: borderColor }]}>
      {/* Curved active indicator với animation */}
      <Animated.View
        style={[
          styles.activeIndicator,
          animatedIndicatorStyle,
          {
            backgroundColor: activeTintColor + '20', // 20 = opacity ~12%
          },
        ]}
      />

      {/* Tab buttons */}
      <View style={styles.tabContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const tab = tabs[index];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Animated style cho active tab
          const animatedTabStyle = useAnimatedStyle(() => {
            const scale = interpolate(
              animatedIndex.value,
              [index - 1, index, index + 1],
              [1, 1.15, 1],
              'clamp'
            );

            const translateY = interpolate(
              animatedIndex.value,
              [index - 1, index, index + 1],
              [0, -8, 0],
              'clamp'
            );

            return {
              transform: [{ scale }, { translateY }],
            };
          });

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <Animated.View style={[styles.tabContent, animatedTabStyle]}>
                <IconSymbol
                  size={isFocused ? 28 : 24}
                  name={tab.icon as any}
                  color={isFocused ? activeTintColor : inactiveTintColor}
                />
                {isFocused && (
                  <Animated.Text
                    style={[
                      styles.tabLabel,
                      { color: activeTintColor },
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Animated.Text>
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT + (Platform.OS === 'ios' ? 20 : 0),
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 0,
    left: 0,
    width: ACTIVE_INDICATOR_SIZE,
    height: ACTIVE_INDICATOR_SIZE,
    borderRadius: ACTIVE_INDICATOR_SIZE / 2,
  },
  tabContainer: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    zIndex: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});

