import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import ScreenBackground from '../components/ScreenBackground';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useThemeContext } from '../context/ThemeContext';
import { supabase } from '../supabase';

const LIGHT_THEME = {
  background: '#F3F8F4',
  surface: '#FFFFFF',
  surfaceSoft: '#F6FBF8',
  text: '#111827',
  muted: '#6B7280',
  border: '#DCE9E2',
  heroBorder: '#E1ECE5',
  inputBackground: '#FBFDFC',
  secondaryBorder: '#374151',
  secondaryText: '#374151',
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
  secondaryBorder: '#9CA3AF',
  secondaryText: '#E5E7EB',
};

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeContext();
  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePassword = async () => {
    if (isSaving) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedPassword = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (trimmedPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setErrorMessage('Passwords do not match. Please re-enter them.');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: trimmedPassword });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSuccessMessage('Your password has been updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setIsSaving(false);
    }
  };

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
                  onPress={() => router.back()}
                  style={({ pressed }) => [
                    styles.backButton,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="chevron-back" size={18} color={theme.text} />
                  <Text style={[styles.backButtonText, { color: theme.text }]}>Back</Text>
                </Pressable>
                <Text style={[styles.pageTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>Change Password</Text>
                <View style={styles.headerSpacer} />
              </View>

              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.heroBorder }]}> 
                <Text style={[styles.cardTitle, { color: theme.text }]}>Set a new password</Text>
                <Text style={[styles.cardSubtitle, { color: theme.muted }]}>Use at least 6 characters.</Text>

                <View style={styles.inputBlock}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>New Password</Text>
                  <TextInput
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      if (errorMessage || successMessage) {
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }
                    }}
                    placeholder="Enter a new password"
                    placeholderTextColor={theme.muted}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                  />
                </View>

                <View style={styles.inputBlock}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Confirm New Password</Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errorMessage || successMessage) {
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }
                    }}
                    placeholder="Re-enter the new password"
                    placeholderTextColor={theme.muted}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                  />
                </View>

                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}
                {successMessage ? (
                  <Text style={styles.successText}>{successMessage}</Text>
                ) : null}

                <Pressable
                  onPress={handleSavePassword}
                  disabled={isSaving}
                  style={({ pressed }) => [
                    styles.saveButton,
                    pressed && styles.pressed,
                    isSaving && styles.saveButtonDisabled,
                  ]}
                >
                  <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Password'}</Text>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  contentInset: {
    paddingTop: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerSpacer: {
    width: 64,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  card: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 6,
    marginBottom: 16,
  },
  inputBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  errorText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#E63946',
  },
  successText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#65B891',
  },
  saveButton: {
    marginTop: 18,
    borderRadius: 16,
    height: 52,
    backgroundColor: '#65B891',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
