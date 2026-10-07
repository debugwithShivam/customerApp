import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { readAppearanceSetting } from '@/services/medical-api';

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const [appearance, setAppearance] = useState<'Light' | 'Dark' | 'Use device setting'>('Use device setting');

  useEffect(() => {
    let mounted = true;
    void readAppearanceSetting().then((saved) => {
      if (mounted && saved) setAppearance(saved as any);
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  const isLightTheme = appearance === 'Light' || (appearance === 'Use device setting' && systemScheme === 'light');
  const theme = isLightTheme ? DefaultTheme : DarkTheme;
  const backgroundColor = isLightTheme ? '#f1f5f4' : '#050a0b';

  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor } }} />
    </ThemeProvider>
  );
}
