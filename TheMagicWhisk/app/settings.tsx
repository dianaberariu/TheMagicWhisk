import React, { useEffect, useState } from 'react';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import ScreenBackground from '../components/ScreenBackground';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Switch,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { supabase } from '../supabase';

const COLORS = {
  background: '#F3F8F4',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#DCE9E2',
  accent: '#65B891',
  accentSoft: '#E4F4EC',
  accentDark: '#4F9B78',
};

const LIGHT_THEME = {
  background: '#F3F8F4',
  surface: '#FFFFFF',
  surfaceSoft: '#F6FBF8',
  text: '#111827',
  muted: '#6B7280',
  border: '#DCE9E2',
  heroBorder: '#E1ECE5',
  inputBackground: '#FBFDFC',
  switchTrackFalse: '#DCE9E2',
  switchTrackTrue: '#65B891',
  switchThumb: '#FFFFFF',
  secondaryBorder: '#374151',
  secondaryText: '#374151',
  destructiveText: '#D98C8C',
  destructiveIcon: '#D98C8C',
};

const DARK_THEME = {
  background: '#121212',
  surface: '#1A1A1A',
  surfaceSoft: '#1F1F1F',
  text: '#F5F7F8',
  muted: '#A9B0B2',
  border: '#2C3230',
  heroBorder: '#2A3834',
  inputBackground: '#181818',
  switchTrackFalse: '#404040',
  switchTrackTrue: '#65B891',
  switchThumb: '#FFFFFF',
  secondaryBorder: '#9CA3AF',
  secondaryText: '#E5E7EB',
  destructiveText: '#D8A1A1',
  destructiveIcon: '#D8A1A1',
};

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useThemeContext();
  const [firstName, setFirstName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'idle' | 'success' | 'error'>('idle' as 'idle');
  const [focused, setFocused] = useState(false);
  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  const handleThemeToggle = async () => {
    const nextPreference = isDarkMode ? 'light' : 'dark';
    toggleTheme();

    const { error } = await supabase.auth.updateUser({
      data: { theme_preference: nextPreference },
    });

    if (error) {
      console.error('Failed to update theme preference', error);
    }
  };

  useEffect(() => {
    const fullName = user?.user_metadata?.full_name;
    setFirstName(typeof fullName === 'string' ? fullName : '');
  }, [user?.id, user?.user_metadata?.full_name]);

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This action is permanent and all your saved culinary data will be lost forever.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('delete_my_account');
              if (error) {
                Alert.alert('Delete Account Failed', 'Please try again in a moment.');
                return;
              }

              await AsyncStorage.removeItem('appTheme');
              await supabase.auth.signOut();
              router.replace('/login');
            } catch (err) {
              console.error('Delete account failed', err);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    const trimmedFirstName = firstName.trim();

    if (!trimmedFirstName) {
      setMessage('Please enter your first name before saving.');
      setMessageType('error');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: trimmedFirstName },
      });

      if (error) {
        setMessage(error.message);
        setMessageType('error');
        return;
      }

      setMessage('Your profile has been updated successfully.');
      setMessageType('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save your changes.');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const email = user?.email ?? 'No email available';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenBackground>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.contentInset}>
              <View style={styles.topRow}>
                <Pressable
                  onPress={() => router.replace('/(tabs)')}
                  style={({ pressed }) => [
                    styles.backButton,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="chevron-back" size={18} color={theme.text} />
                  <Text style={[styles.backButtonText, { color: theme.text }]}>Back</Text>
                </Pressable>
              </View>

              <View
                style={[
                  styles.heroCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.heroBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconShell,
                    {
                      backgroundColor: isDarkMode ? '#2A2A2A' : theme.surfaceSoft,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={34}
                    color={isDarkMode ? '#FFFFFF' : COLORS.accentDark}
                  />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>Profile &amp; Settings</Text>
                <Text style={[styles.subtitle, { color: theme.muted }]}>
                  A calm, elegant place to refine your account details and keep your culinary identity polished.
                </Text>
              </View>

              <View
                style={[
                  styles.sectionCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>

                <View style={styles.emailBlock}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Current Email</Text>
                  <View
                    style={[
                      styles.emailPill,
                      { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                    ]}
                  >
                    <Ionicons name="mail-outline" size={16} color={COLORS.accentDark} />
                    <Text style={[styles.emailText, { color: theme.text }]} numberOfLines={1}>
                      {email}
                    </Text>
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Edit First Name</Text>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Enter your first name"
                    placeholderTextColor={theme.muted}
                    autoCapitalize="words"
                    autoCorrect={false}
                    textContentType="givenName"
                    autoComplete="name"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                      focused && styles.inputFocused,
                    ]}
                  />
                </View>

                <View
                  style={[
                    styles.toggleRow,
                    {
                      backgroundColor: theme.surfaceSoft,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.toggleRowTextWrap}>
                    <Text style={[styles.toggleLabel, { color: theme.text }]}>Dark Mode</Text>
                    <Text style={[styles.toggleSubtitle, { color: theme.muted }]}>
                      Switch between the light and dark culinary themes.
                    </Text>
                  </View>
                  <Switch
                    value={isDarkMode}
                    onValueChange={handleThemeToggle}
                    trackColor={{
                      false: theme.switchTrackFalse,
                      true: theme.switchTrackTrue,
                    }}
                    thumbColor={theme.switchThumb}
                    ios_backgroundColor={theme.switchTrackFalse}
                  />
                </View>

                <Pressable
                  onPress={handleSave}
                  disabled={saving}
                  style={({ pressed }) => [
                    styles.saveButton,
                    pressed && styles.pressed,
                    saving && styles.saveButtonDisabled,
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </Pressable>

                {/* Log Out (secondary outline action) */}
                <Pressable
                  onPress={async () => {
                    try {
                      await AsyncStorage.removeItem('appTheme');
                      const { error } = await signOut();
                      if (error) {
                        console.error('Failed to sign out', error);
                        return;
                      }
                      router.replace('/login');
                    } catch (err) {
                      console.error('Sign out error', err);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { borderColor: theme.border, backgroundColor: theme.surfaceSoft },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.secondaryButtonContent}>
                    <Ionicons name="log-out-outline" size={20} color={theme.secondaryText} />
                    <Text style={[styles.secondaryButtonText, { color: theme.secondaryText }]}>Log Out</Text>
                  </View>
                </Pressable>

                {/* Change Password (secondary action) */}
                <Pressable
                  onPress={() => router.push('/change-password')}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { borderColor: theme.border, backgroundColor: theme.surfaceSoft },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.secondaryButtonContent}>
                    <Ionicons name="lock-closed-outline" size={20} color={theme.secondaryText} />
                    <Text style={[styles.secondaryButtonText, { color: theme.secondaryText }]}>Change Password</Text>
                  </View>
                </Pressable>

                {message ? (
                  <View
                    style={[
                      styles.messageBox,
                      messageType === 'error' ? styles.messageError : styles.messageSuccess,
                    ]}
                  >
                    <Ionicons
                      name={messageType === 'error' ? 'warning-outline' : 'checkmark-circle-outline'}
                      size={16}
                      color={messageType === 'error' ? '#B45309' : COLORS.accentDark}
                    />
                    <Text
                      style={[
                        styles.messageText,
                        messageType === 'error' ? styles.messageTextError : styles.messageTextSuccess,
                      ]}
                    >
                      {message}
                    </Text>
                  </View>
                ) : null}

                {/* Subtle Delete Link */}
                <Pressable onPress={handleDeleteAccount} style={styles.deleteLink}>
                  <View style={styles.deleteLinkContent}>
                    <FontAwesome name="trash" size={16} color={theme.destructiveIcon} />
                    <Text style={[styles.deleteLinkText, { color: theme.destructiveText }]}>Delete Account</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 40,
    minHeight: '100%',
  },
  contentInset: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -70,
    right: -80,
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: '#E1ECE5',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 4,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconShell: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: '#D5EBDD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
    textAlign: 'center',
    maxWidth: 320,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  emailBlock: {
    marginBottom: 18,
  },
  fieldBlock: {
    marginBottom: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  toggleRowTextWrap: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F6FBF8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE9E2',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emailText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FBFDFC',
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.text,
  },
  inputFocused: {
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  saveButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: COLORS.accentDark,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.82,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  messageBox: {
    marginTop: 14,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  messageSuccess: {
    backgroundColor: '#F3FBF7',
    borderColor: '#D4EBDD',
  },
  messageError: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  messageText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  messageTextSuccess: {
    color: '#356C54',
  },
  messageTextError: {
    color: '#9A3412',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  secondaryButton: {
    marginTop: 12,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  deleteLink: {
    marginTop: 22,
    alignSelf: 'center',
    paddingVertical: 6,
  },
  deleteLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteLinkText: {
    color: '#D98C8C',
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 13,
  },
});