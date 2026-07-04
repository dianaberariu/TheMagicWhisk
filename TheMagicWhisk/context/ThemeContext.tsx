import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';

type ThemeContextValue = {
  isDarkMode: boolean;
  isThemeReady: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_STORAGE_KEY = 'appTheme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadThemePreference = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Failed to load theme preference', error);
        }

        const preference = data?.session?.user?.user_metadata?.theme_preference;
        let resolved: 'dark' | 'light' | null = null;

        if (preference === 'dark' || preference === 'light') {
          resolved = preference;
        } else {
          const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
          if (stored === 'dark' || stored === 'light') {
            resolved = stored;
          }
        }

        if (resolved && isMounted) {
          setIsDarkMode(resolved === 'dark');
          await AsyncStorage.setItem(THEME_STORAGE_KEY, resolved);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AuthSessionMissingError') {
          // No active Supabase session yet — fallback to local theme storage.
          const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
          if (stored === 'dark' || stored === 'light') {
            if (isMounted) {
              setIsDarkMode(stored === 'dark');
            }
          }
        } else {
          console.error('Failed to load theme preference', err);
        }
      } finally {
        if (isMounted) {
          setIsThemeReady(true);
        }
      }
    };

    loadThemePreference();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const preference = session?.user?.user_metadata?.theme_preference;
      if (preference === 'dark' || preference === 'light') {
        if (isMounted) {
          setIsDarkMode(preference === 'dark');
        }
        await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      isDarkMode,
      isThemeReady,
      toggleTheme: () =>
        setIsDarkMode((current) => {
          const next = !current;
          void AsyncStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
          return next;
        }),
    }),
    [isDarkMode, isThemeReady]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }

  return context;
}
