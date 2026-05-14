import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';

// Navigation packages: npm i @react-navigation/native @react-navigation/bottom-tabs
// plus peer deps: react-native-screens react-native-safe-area-context react-native-gesture-handler
const BRAND = '#65B891';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND,
        tabBarInactiveTintColor: '#9CA3AF',
        headerTitleAlign: 'center',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
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
          tabBarIcon: ({ color }) => <Ionicons size={24} name="home-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cookbook"
        options={{
          title: 'Cookbook',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="book-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="import"
        options={{
          title: 'Import',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="download-outline" color={color} />
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
          tabBarIcon: ({ color }) => <Ionicons size={24} name="cart-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
