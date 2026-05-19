import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';

import { useThemeContext } from '../context/ThemeContext';

type Props = {
  children: React.ReactNode;
  style?: any;
};

export default function ScreenBackground({ children, style }: Props) {
  const { isDarkMode } = useThemeContext();
  const backgroundColor = isDarkMode ? '#121212' : '#F3F8F4';
  const glowTopColor = isDarkMode ? 'rgba(101, 184, 145, 0.10)' : 'rgba(101, 184, 145, 0.14)';
  const glowBottomColor = isDarkMode ? 'rgba(93, 171, 138, 0.06)' : 'rgba(101, 184, 145, 0.08)';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }, style]} edges={['top', 'bottom']}>
      <View
        pointerEvents="none"
        style={[
          styles.backgroundGlowTop,
          {
            backgroundColor: glowTopColor,
            top: isDarkMode ? -90 : -80,
            right: isDarkMode ? -80 : -60,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.backgroundGlowBottom,
          {
            backgroundColor: glowBottomColor,
            bottom: isDarkMode ? 45 : 60,
            left: isDarkMode ? -120 : -110,
          },
        ]}
      />
      {isDarkMode ? <View pointerEvents="none" style={styles.darkOverlay} /> : null}
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(101, 184, 145, 0.14)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 60,
    left: -110,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(101, 184, 145, 0.08)',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
});
