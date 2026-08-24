import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { useAuth } from '../AuthContext';
import { showAlert } from '../utils/showAlert';

const isExistingAccountResult = (
  error?: { message?: string } | null,
  data?: { user?: { identities?: unknown[] | null } | null } | null
) => {
  if (error?.message && /already (registered|exists|been registered)|user already registered/i.test(error.message)) {
    return true;
  }

  // Supabase returns a user with an empty `identities` array (and no error) when the
  // email is already registered, to avoid leaking which emails exist in the system.
  if (!error && data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return true;
  }

  return false;
};

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth() as {
    signIn: (
      email: string,
      password: string
    ) => Promise<{
      error?: { message?: string } | null;
      data?: { user?: { identities?: unknown[] | null } | null } | null;
    }>;
    signUp: (
      email: string,
      password: string,
      options?: { data?: { full_name?: string } }
    ) => Promise<{
      error?: { message?: string } | null;
      data?: { user?: { identities?: unknown[] | null } | null } | null;
    }>;
  };
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | null>(null);

  useFocusEffect(
    useCallback(() => {
      setName('');
      setEmail('');
      setPassword('');
      setErrorMessage('');
      setFocusedField(null);
    }, [])
  );

  const handleAuth = async (action: 'signIn' | 'signUp') => {
    setLoading(true);
    setErrorMessage('');

    try {
      const result = action === 'signUp'
        ? await signUp(email.trim(), password, {
            data: { full_name: name.trim() },
          })
        : await signIn(email.trim(), password);

      if (action === 'signUp' && isExistingAccountResult(result?.error, result?.data)) {
        showAlert(
          'Account already exists',
          'An account with this email already exists. Please log in instead, or use "Forgot Password?" if you need to reset it.'
        );
        return;
      }

      if (result?.error) {
        setErrorMessage(result.error.message ?? 'Authentication failed');
        return;
      }

      if (action === 'signUp') {
        setName('');
        setEmail('');
        setPassword('');
        showAlert(
          'Account created',
          'Please check your email for the verification link before logging in.',
          () => setIsRegistering(false)
        );
      }
    } catch (error) {
      console.log('[LOGIN FLOW] Error caught:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <View style={styles.backgroundGlow} />
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.iconBadge}>
            <Image source={require('../assets/images/LOGO.jpg')} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.title}>The Magic Whisk</Text>
          <Text style={styles.subtitle}>
            {isRegistering
              ? 'Start your smart culinary journey today'
              : 'Welcome back to your digital cookbook'}
          </Text>
        </View>

        <View style={styles.card}>
          {isRegistering ? (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="First Name"
              placeholderTextColor="#8B96A8"
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="givenName"
              autoComplete="name"
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField((current) => (current === 'name' ? null : current))}
              style={[styles.input, focusedField === 'name' && styles.inputFocused]}
            />
          ) : null}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField((current) => (current === 'email' ? null : current))}
            style={[styles.input, focusedField === 'email' && styles.inputFocused]}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField((current) => (current === 'password' ? null : current))}
            style={[styles.input, focusedField === 'password' && styles.inputFocused]}
          />

          {!isRegistering ? (
            <Pressable
              onPress={() => router.push('/change-password')}
              style={({ pressed }) => [styles.forgotPasswordLink, pressed && styles.togglePressed]}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </Pressable>
          ) : null}

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <Pressable
            onPress={() => handleAuth(isRegistering ? 'signUp' : 'signIn')}
            disabled={loading}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{isRegistering ? 'Sign Up' : 'Sign In'}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => setIsRegistering((value) => !value)}
            disabled={loading}
            style={({ pressed }) => [styles.toggleLink, pressed && styles.togglePressed]}
          >
            <Text style={styles.toggleText}>
              {isRegistering ? 'Already have an account? Log in' : "Don't have an account? Create one"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F8F4',
  },
  backgroundGlow: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(101, 184, 145, 0.18)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 28,
    justifyContent: 'center',
    gap: 22,
  },
  hero: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 8,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 3,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E3ECE6',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 4,
  },
  title: {
    fontSize: 31,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: '#52606D',
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#D8E4DD',
    borderRadius: 0,
    paddingHorizontal: 2,
    paddingTop: 14,
    paddingBottom: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#0F172A',
  },
  inputFocused: {
    borderBottomColor: '#D4A74A',
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  forgotPasswordText: {
    color: '#5F7D6F',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    minHeight: 54,
    backgroundColor: '#65B891',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#65B891',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  toggleLink: {
    alignSelf: 'center',
    marginTop: 18,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  togglePressed: {
    opacity: 0.7,
  },
  toggleText: {
    color: '#5F7D6F',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  error: {
    color: '#B91C1C',
    marginBottom: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.7,
  },
});