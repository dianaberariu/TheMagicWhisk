import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '../AuthContext';
import { CookbookProvider, useCookbookContext } from '../CookbookContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { GroceryProvider } from '../GroceryContext';
import { useGroceryContext } from '../GroceryContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <CookbookProvider>
        <GroceryProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <RootLayoutContent />
            <StatusBar style="auto" />
          </ThemeProvider>
        </GroceryProvider>
      </CookbookProvider>
    </AuthProvider>
  );
}

function RootLayoutContent() {
  const { user, loading } = useAuth();
  const { recipes, loading: cookbookLoading } = useCookbookContext();
  const { clearGroceryList } = useGroceryContext();
  const router = useRouter();
  const segments = useSegments();
  const firstSegment = segments[0];
  const previousUserIdRef = useRef(null);
  const previousRecipeCountRef = useRef(null);

  useEffect(() => {
    const currentUserId = user?.id ?? null;

    if (previousUserIdRef.current !== currentUserId) {
      previousUserIdRef.current = currentUserId;
      previousRecipeCountRef.current = null;
    }

    if (loading || cookbookLoading) {
      return;
    }

    if (!currentUserId) {
      previousRecipeCountRef.current = recipes?.length ?? 0;
      return;
    }

    const recipeCount = recipes?.length ?? 0;
    const previousRecipeCount = previousRecipeCountRef.current;

    if (recipeCount === 0 && previousRecipeCount !== 0) {
      void clearGroceryList();
    }

    previousRecipeCountRef.current = recipeCount;
  }, [clearGroceryList, cookbookLoading, loading, recipes, user?.id]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user && firstSegment !== 'login') {
      router.replace('/login');
      return;
    }

    if (user && firstSegment === 'login') {
      router.replace('/(tabs)');
    }
  }, [firstSegment, loading, router, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}
