/**
 * Dashforge RN example app.
 *
 * Bare React Native CLI, not Expo, per rule 2 of ARCHITECTURE.md.
 *
 * @format
 */
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DashforgeNativeProvider } from '@dashforge/rn/theme';
import { Playground } from './Playground';

function App() {
  const isDark = useColorScheme() === 'dark';
  return (
    <DashforgeNativeProvider>
      <SafeAreaProvider>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Playground />
      </SafeAreaProvider>
    </DashforgeNativeProvider>
  );
}

export default App;
