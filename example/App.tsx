/**
 * Dashforge RN example app.
 *
 * Bare React Native CLI, not Expo, per rule 2 of ARCHITECTURE.md.
 *
 * @format
 */
import { useEffect, useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DashforgeNativeProvider } from '@dashforge/rn/theme';
import type { DatePickerAdapter } from '@dashforge/rn/theme';
import { Playground } from './Playground';
import { subscribeToPicker } from './nativePicker';

function App() {
  const isDark = useColorScheme() === 'dark';

  // The playground turns the picker on and off from the Date section, so
  // both halves of rule 5.1 can be seen without restarting: with an
  // adapter the field delegates, without one it falls back.
  const [datePicker, setDatePicker] = useState<DatePickerAdapter | null>(null);
  useEffect(() => subscribeToPicker(setDatePicker), []);

  return (
    <DashforgeNativeProvider datePicker={datePicker ?? undefined}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Playground />
      </SafeAreaProvider>
    </DashforgeNativeProvider>
  );
}

export default App;
