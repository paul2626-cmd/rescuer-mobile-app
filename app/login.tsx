import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../src/auth';
import { Btn, ErrorNotice, Field, Txt } from '../src/ui';
import { C } from '../src/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { signIn, configError } = useAuth();
  const router = useRouter();

  async function submit() {
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not sign in. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      <LinearGradient colors={[C.bgTop, C.bg, C.bg]} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 36 }}>
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View style={{ width: 74, height: 74, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: C.panel, borderWidth: 1, borderColor: C.border }}>
              <Image source={require('../assets/kalinga-symbol.png')} style={{ width: 58, height: 58 }} resizeMode="contain" />
            </View>
            <Txt size={30} bold style={{ marginTop: 14, letterSpacing: -1.2 }}>Kalinga</Txt>
            <Txt muted style={{ marginTop: 5 }}>Rescuer workspace</Txt>
          </View>

          <View style={{ backgroundColor: C.panel, borderColor: C.border, borderWidth: 1, borderRadius: 24, padding: 20 }}>
            <Txt size={21} bold style={{ marginBottom: 5 }}>Sign in</Txt>
            <Txt muted size={13} style={{ marginBottom: 19 }}>Use the Rescuer account assigned to you.</Txt>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              returnKeyType="next"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={submit}
              style={{ marginBottom: 12 }}
            />
            <ErrorNotice message={configError || error} />
            <Btn full disabled={busy || Boolean(configError)} onPress={submit}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Btn>
          </View>

          <Txt muted size={12} style={{ textAlign: 'center', marginTop: 20 }}>
            Your role is checked by the Kalinga server before Rescuer screens open.
          </Txt>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
