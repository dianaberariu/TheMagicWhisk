import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '../AuthContext';
import { CookbookProvider, useCookbookContext } from '../CookbookContext';
import { GroceryProvider, useGroceryContext } from '../GroceryContext';
import { ThemeProvider as AppThemeProvider, useThemeContext } from '../context/ThemeContext';

// Load vector icon fonts for web support
async function loadIconFonts() {
  if (Platform.OS !== 'web') return;

  try {
    await Font.loadAsync({
      // @expo/vector-icons fonts
      'Ionicons': require('@expo/vector-icons/Ionicons').default || require('@expo/vector-icons/fonts/Ionicons.ttf'),
      'MaterialIcons': require('@expo/vector-icons/fonts/MaterialIcons.ttf'),
      'MaterialCommunityIcons': require('@expo/vector-icons/fonts/MaterialCommunityIcons.ttf'),
      'FontAwesome': require('@expo/vector-icons/fonts/FontAwesome.ttf'),
      'FontAwesome5_Solid': require('@expo/vector-icons/fonts/FontAwesome5_Solid.ttf'),
      'FontAwesome5_Regular': require('@expo/vector-icons/fonts/FontAwesome5_Regular.ttf'),
      'FontAwesome5_Brands': require('@expo/vector-icons/fonts/FontAwesome5_Brands.ttf'),
      'Foundation': require('@expo/vector-icons/fonts/Foundation.ttf'),
      'EvilIcons': require('@expo/vector-icons/fonts/EvilIcons.ttf'),
      'Entypo': require('@expo/vector-icons/fonts/Entypo.ttf'),
      'AntDesign': require('@expo/vector-icons/fonts/AntDesign.ttf'),
      'SimpleLineIcons': require('@expo/vector-icons/fonts/SimpleLineIcons.ttf'),
      'Octicons': require('@expo/vector-icons/fonts/Octicons.ttf'),
      'Zocial': require('@expo/vector-icons/fonts/Zocial.ttf'),
    });
  } catch (error) {
    console.warn('⚠️ Failed to load icon fonts on web:', error);
  }
}

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
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    loadIconFonts().then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded && Platform.OS === 'web') {
    return (
      <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, { backgroundColor: '#121212' }]}>
        <ActivityIndicator size="large" color="#65B891" />
      </View>
    );
  }

  return (
    <AppThemeProvider>
      <RootLayoutShell />
    </AppThemeProvider>
  );
}

function RootLayoutShell() {
  const { isDarkMode, isThemeReady } = useThemeContext();

  if (!isThemeReady) {
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

    const isAuthRoute = firstSegment === 'login';

    if (!session && !isAuthRoute) {
      router.replace('/login');
      return;
    }

    if (session && isAuthRoute) {
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
