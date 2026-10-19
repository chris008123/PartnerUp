import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../theme';

export default function Logo({ light = true, size = 32 }: { light?: boolean; size?: number }) {
  const ink = light ? colors.white : colors.green;
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: ink, fontSize: size, fontWeight: '800', letterSpacing: -0.5 }}>
        Partner Up
      </Text>
      <Text
        style={{
          position: 'absolute',
          top: -size * 0.28,
          left: size * 2.1,
          color: '#4ADE80',
          fontSize: size * 0.7,
          fontWeight: '800',
        }}
      >
        +
      </Text>
    </View>
  );
}
