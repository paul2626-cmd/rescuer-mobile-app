import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControlProps,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from './theme';

export function Txt({
  children,
  muted = false,
  size = 15,
  bold = false,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  muted?: boolean;
  size?: number;
  bold?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          color: muted ? C.muted : C.text,
          fontSize: size,
          fontWeight: bold ? '700' : '400',
          lineHeight: Math.round(size * 1.42),
          includeFontPadding: false,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Panel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: C.panel,
          borderColor: C.border,
          borderWidth: 1,
          borderRadius: 25,
          overflow: 'hidden',
          marginBottom: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Section({
  title,
  subtitle,
  children,
  right,
  style,
  bodyStyle,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <Panel style={style}>
      <View
        style={{
          minHeight: 62,
          paddingHorizontal: 20,
          paddingVertical: 15,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <Txt size={18} bold style={{ letterSpacing: -0.4 }}>{title}</Txt>
          {subtitle ? <Txt muted size={13}>{subtitle}</Txt> : null}
        </View>
        {right}
      </View>
      <View style={[{ padding: 20 }, bodyStyle]}>{children}</View>
    </Panel>
  );
}

export function Btn({
  children,
  onPress,
  secondary = false,
  outline = false,
  disabled = false,
  full = false,
  danger = false,
  style,
  testID,
}: {
  children: ReactNode;
  onPress?: () => void;
  secondary?: boolean;
  outline?: boolean;
  disabled?: boolean;
  full?: boolean;
  danger?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const backgroundColor = outline
    ? 'transparent'
    : secondary
      ? C.panel2
      : danger
        ? C.redSoft
        : C.red;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor,
          borderWidth: outline ? 1 : 0,
          borderColor: outline ? C.borderStrong : 'transparent',
          paddingHorizontal: 17,
          minHeight: 46,
          paddingVertical: 12,
          borderRadius: 15,
          alignSelf: full ? 'stretch' : 'flex-start',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.48 : pressed ? 0.84 : 1,
        },
        style,
      ]}
    >
      <Txt bold style={{ color: outline || secondary ? C.text : danger ? C.redInk : '#171113' }}>
        {children}
      </Txt>
    </Pressable>
  );
}

export function Page({
  title,
  subtitle,
  eyebrow,
  children,
  refreshControl,
  titleAccessory,
  contentStyle,
}: {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  titleAccessory?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient
        pointerEvents="none"
        colors={[C.bgTop, C.bg, C.bg]}
        locations={[0, 0.42, 1]}
        style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        contentContainerStyle={[
          { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 128, flexGrow: 1 },
          contentStyle,
        ]}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      >
        {eyebrow ? (
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              paddingHorizontal: 10,
              paddingVertical: 5,
              marginBottom: 10,
              borderRadius: 999,
              borderColor: C.border,
              borderWidth: 1,
              backgroundColor: C.panel,
            }}
          >
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.red }} />
            <Txt muted size={11} bold style={{ letterSpacing: 1.1, textTransform: 'uppercase' }}>{eyebrow}</Txt>
          </View>
        ) : null}
        {title ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <Txt size={32} bold style={{ flex: 1, letterSpacing: -1.4, lineHeight: 36 }}>{title}</Txt>
            {titleAccessory}
          </View>
        ) : null}
        {subtitle ? <Txt muted size={14} style={{ marginTop: 13, marginBottom: 40, lineHeight: 22 }}>{subtitle}</Txt> : null}
        {children}
      </ScrollView>
    </View>
  );
}

export function Busy({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={{ flex: 1, minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <ActivityIndicator color={C.red} size="large" />
      <Txt muted>{label}</Txt>
    </View>
  );
}

export function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 118, padding: 18, gap: 6 }}>
      <Txt bold size={15}>{title}</Txt>
      <Txt muted style={{ textAlign: 'center', maxWidth: 280 }}>{detail}</Txt>
    </View>
  );
}

export function ErrorNotice({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View style={{ padding: 13, marginBottom: 14, borderWidth: 1, borderColor: '#793137', borderRadius: 14, backgroundColor: C.redSoft }}>
      <Txt size={13} style={{ color: C.redInk }}>{message}</Txt>
    </View>
  );
}

export function Field({
  label,
  style,
  inputStyle,
  ...props
}: TextInputProps & { label?: string; inputStyle?: StyleProp<TextStyle> }) {
  return (
    <View style={[{ gap: 7, marginBottom: 14 }, style as StyleProp<ViewStyle>]}>
      {label ? <Txt size={12} bold>{label}</Txt> : null}
      <TextInput
        placeholderTextColor={C.muted2}
        selectionColor={C.red}
        style={[
          {
            minHeight: 48,
            borderWidth: 1,
            borderColor: C.borderStrong,
            borderRadius: 13,
            backgroundColor: C.panel,
            color: C.text,
            paddingHorizontal: 13,
            paddingVertical: 11,
            fontSize: 15,
          },
          inputStyle,
        ]}
        {...props}
      />
    </View>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: C.border, marginVertical: 8 }} />;
}
