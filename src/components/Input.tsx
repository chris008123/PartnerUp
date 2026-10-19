import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, TextInputProps } from 'react-native';
import { colors, radius } from '../theme';

type Props = TextInputProps & { label: string; error?: string; secure?: boolean };

export default function Input({ label, error, secure, ...rest }: Props) {
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.box, !!error && { borderColor: colors.rejected }]}>
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          placeholderTextColor={colors.muted}
          style={s.input}
          autoCapitalize={rest.autoCapitalize ?? 'none'}
        />
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <Text style={s.toggle}>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        )}
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}
const s = StyleSheet.create({
  label: { fontSize: 13, color: colors.muted, marginBottom: 6, fontWeight: '600' },
  box: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, height: 50,
  },
  input: { flex: 1, fontSize: 15, color: colors.text },
  toggle: { color: colors.green, fontWeight: '700', fontSize: 13 },
  error: { color: colors.rejected, fontSize: 12, marginTop: 4 },
});
