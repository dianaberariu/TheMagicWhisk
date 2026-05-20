import React from 'react';
import { Stack } from 'expo-router';

export default function CookbookLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'fade',
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerShadowVisible: false,
        headerTintColor: '#111827',
        headerTitleStyle: {
          fontSize: 16,
          fontWeight: '600',
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Cookbook',
        }}
      />
    </Stack>
  );
}
