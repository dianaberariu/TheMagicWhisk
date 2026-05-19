import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { useThemeContext } from '../../context/ThemeContext';

// Navigation packages: npm i @react-navigation/native @react-navigation/bottom-tabs
// plus peer deps: react-native-screens react-native-safe-area-context react-native-gesture-handler
const BRAND = '#65B891';

function TabIcon({
  name,
  color,
  focused,
  isDarkMode,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  focused: boolean;
  isDarkMode: boolean;
}) {
  const showShell = isDarkMode && focused;

  return (
    <View
      style={[
        {
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
        },
        showShell && {
          backgroundColor: 'rgba(101, 184, 145, 0.14)',
          borderWidth: 1,
          borderColor: 'rgba(101, 184, 145, 0.28)',
        },
      ]}
    >
      <Ionicons size={22} name={name} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const { isDarkMode } = useThemeContext();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDarkMode ? '#FFFFFF' : BRAND,
        tabBarInactiveTintColor: isDarkMode ? '#9CA3AF' : '#9CA3AF',
        headerTitleAlign: 'center',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#121212' : '#E5E7EB',
          borderTopWidth: 0,
          height: 62,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home-outline" color={color} focused={focused} isDarkMode={isDarkMode} />
          ),
        }}
      />
      <Tabs.Screen
        name="cookbook"
        options={{
          title: 'Cookbook',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="book-outline" color={color} focused={focused} isDarkMode={isDarkMode} />
          ),
        }}
      />
      <Tabs.Screen
        name="import"
        options={{
          title: 'Import',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="download-outline" color={color} focused={focused} isDarkMode={isDarkMode} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          title: 'Grocery',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="cart-outline" color={color} focused={focused} isDarkMode={isDarkMode} />
          ),
        }}
      />
    </Tabs>
  );
}
