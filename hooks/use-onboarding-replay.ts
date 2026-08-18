import { createContext, useContext } from "react";

export const OnboardingReplayContext = createContext<(() => Promise<void>) | null>(null);

export function useOnboardingReplay() {
  const replayOnboarding = useContext(OnboardingReplayContext);

  if (!replayOnboarding) {
    throw new Error("useOnboardingReplay must be used within the root layout.");
  }

  return replayOnboarding;
}
