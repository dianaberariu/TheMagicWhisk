import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';

type Props = {
  children: React.ReactNode;
  style?: any;
};

export default function ScreenBackground({ children, style }: Props) {
  return (
    <SafeAreaView style={[styles.safeArea, style]} edges={['top', 'bottom']}>
      <View pointerEvents="none" style={styles.backgroundGlowTop} />
      <View pointerEvents="none" style={styles.backgroundGlowBottom} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F8F4',
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
});
