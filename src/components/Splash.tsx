import React from 'react';
import { View, StyleSheet } from 'react-native';
import Logo from './Logo';
import { colors } from '../theme';

export default function Splash() {
  return (
    <View style={s.wrap}>
      <Logo size={38} />
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
});
