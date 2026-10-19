import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme';

export default function ProgressBar({ pct, color = colors.verified }: { pct: number; color?: string }) {
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border }}>
      <View style={{ height: 8, borderRadius: 4, width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }} />
    </View>
  );
}
