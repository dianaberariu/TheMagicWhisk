import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '../AuthContext';
import { CookbookProvider, useCookbookContext } from '../CookbookContext';
import { GroceryProvider, useGroceryContext } from '../GroceryContext';
import { ThemeProvider as AppThemeProvider, useThemeContext } from '../context/ThemeContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

type GroceryContextValue = {
  clearGroceryList: () => Promise<void> | void;
};

const loadingContainerStyle = {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
} as const;

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootLayoutShell />
    </AppThemeProvider>
  );
}

function RootLayoutShell() {
  const { isDarkMode, isThemeReady } = useThemeContext();
  const [fontsLoaded] = useFonts({
    Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
    FontAwesome: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf'),
    MaterialIcons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
  });

  if (!isThemeReady || !fontsLoaded) {
    return (
      <View style={[loadingContainerStyle, { backgroundColor: '#121212' }]}> 
        <ActivityIndicator size="large" color="#65B891" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CookbookProvider>
          <GroceryProvider>
            <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
              <RootLayoutContent />
              <StatusBar style={isDarkMode ? 'light' : 'dark'} />
            </ThemeProvider>
          </GroceryProvider>
        </CookbookProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutContent() {
  const { user, session, loading, isInitialized } = useAuth();
  const { recipes } = useCookbookContext();
  const { clearGroceryList } = useGroceryContext() as GroceryContextValue;
  const router = useRouter();
  const segments = useSegments();
  const firstSegment = segments[0];
  const previousUserIdRef = useRef<string | null>(null);
  const previousRecipeCountRef = useRef<number | null>(null);

  useEffect(() => {
    const currentUserId = user?.id ?? null;

    if (previousUserIdRef.current !== currentUserId) {
      previousUserIdRef.current = currentUserId;
      previousRecipeCountRef.current = null;
    }

    if (loading) {
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
  }, [clearGroceryList, loading, recipes, user?.id]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const isAuthRoute = firstSegment === 'login' || firstSegment === 'change-password';

    if (!session && !isAuthRoute) {
      router.replace('/login');
      return;
    }

    if (session && firstSegment === 'login') {
      router.replace('/(tabs)');
    }
  }, [firstSegment, isInitialized, router, session]);

  if (!isInitialized || loading) {
    return (
      <View style={loadingContainerStyle}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ animation: 'fade' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}
