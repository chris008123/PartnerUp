import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ColorValue, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';

type IconName = keyof typeof Ionicons.glyphMap;
type IconProps = { focused: boolean; color: ColorValue; size: number };

// Filled icon when the tab is active, outline when it isn't.
const icon = (active: IconName, inactive: IconName) => ({ focused, color, size }: IconProps) =>
  <Ionicons name={focused ? active : inactive} size={size} color={color} />;

function AddButton() {
  const router = useRouter();
  return (
    <View style={s.slot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add record"
        onPress={() => router.push('/add-record')}
        style={({ pressed }) => [s.fab, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}
      >
        <Ionicons name="add" size={32} color={colors.white} />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 58 + bottom,
          paddingTop: 6,
          paddingBottom: bottom,
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: -3 } },
            android: { elevation: 12 },
          }),
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="records" options={{ title: 'Records', tabBarIcon: icon('document-text', 'document-text-outline') }} />
      <Tabs.Screen name="add" options={{ title: 'Add', tabBarButton: () => <AddButton /> }} />
      <Tabs.Screen name="targets" options={{ title: 'Targets', tabBarIcon: icon('flag', 'flag-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person', 'person-outline') }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  slot: { flex: 1, alignItems: 'center' },
  fab: {
    width: 56, height: 56, borderRadius: 28, marginTop: -12,
    backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: colors.white,
    ...Platform.select({
      ios: { shadowColor: colors.green, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 8 },
    }),
  },
});
