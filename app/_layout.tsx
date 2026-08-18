import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { FirstRunWalkthrough } from '@/components/onboarding/FirstRunWalkthrough';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { OnboardingReplayContext } from '@/hooks/use-onboarding-replay';
import { completeOnboarding, hasCompletedOnboarding, resetOnboarding } from '@/services/onboardingStorage';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    hasCompletedOnboarding()
      .then(setOnboardingComplete)
      .catch((error) => {
        console.error('Could not load onboarding state:', error);
        setOnboardingComplete(false);
      });
  }, []);

  async function finishOnboarding() {
    await completeOnboarding();
    setOnboardingComplete(true);
  }

  async function replayOnboarding() {
    await resetOnboarding();
    setOnboardingComplete(false);
  }

  if (onboardingComplete === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator accessibilityLabel="Loading ScanLock" size="large" color="#7057E8" />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <OnboardingReplayContext.Provider value={replayOnboarding}>
        {onboardingComplete ? (
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        ) : (
          <FirstRunWalkthrough onComplete={finishOnboarding} />
        )}
      </OnboardingReplayContext.Provider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F7FC',
  },
});
