import React, { useState } from 'react';
import { View, Text, Switch, Pressable, Alert, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useReminder } from '../context/ReminderContext';
import { DAYS, ensurePermission } from '../lib/reminder';
import Chip from './Chip';
import { colors } from '../theme';

export default function ReminderSettings() {
  const { settings, update } = useReminder();
  const [picking, setPicking] = useState(false);

  async function toggle(on: boolean) {
    if (on && !(await ensurePermission())) {
      return Alert.alert('Notifications are off', 'Allow notifications for Partner Up in your phone settings, then try again.');
    }
    update({ enabled: on });
  }

  const time = new Date();
  time.setHours(settings.hour, settings.minute, 0, 0);

  return (
    <View>
      <View style={s.row}>
        <Text style={s.help}>Remind me once a week to add my partnership record</Text>
        <Switch value={settings.enabled} onValueChange={toggle} trackColor={{ true: colors.greenMid }} />
      </View>

      {settings.enabled && (
        <View>
          <Text style={s.label}>Day</Text>
          <View style={s.wrap}>
            {DAYS.map((d, i) => <Chip key={d} label={d} active={settings.weekday === i} onPress={() => update({ weekday: i })} />)}
          </View>

          <Text style={s.label}>Time</Text>
          <Pressable style={s.field} onPress={() => setPicking(true)}>
            <Text style={s.fieldText}>{format(time, 'h:mm a')}</Text>
          </Pressable>
          {picking && (
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, d) => {
                if (Platform.OS !== 'ios') setPicking(false);
                if (d) update({ hour: d.getHours(), minute: d.getMinutes() });
              }}
            />
          )}
          <Text style={s.note}>If you have already added a record that week, that week's reminder is skipped.</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  help: { color: colors.muted, fontSize: 13, lineHeight: 19, flex: 1, marginRight: 12 },
  label: { fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 14, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  field: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, paddingHorizontal: 14, justifyContent: 'center' },
  fieldText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  note: { color: colors.muted, fontSize: 12, marginTop: 12, lineHeight: 17 },
});
