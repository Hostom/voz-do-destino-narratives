import { useCallback } from "react";

type HapticPattern = "light" | "medium" | "heavy" | "success" | "error" | "dice";

export const useHaptics = () => {
  const vibrate = useCallback((pattern: HapticPattern = "light") => {
    if (!("vibrate" in navigator)) return;

    const patterns: Record<HapticPattern, number | number[]> = {
      light: 10,
      medium: 25,
      heavy: 50,
      success: [10, 50, 10],
      error: [50, 30, 50],
      dice: [10, 20, 10, 20, 10, 20, 30, 50],
    };

    try {
      navigator.vibrate(patterns[pattern]);
    } catch (e) {
      // Silently fail if vibration not supported
    }
  }, []);

  const lightTap = useCallback(() => vibrate("light"), [vibrate]);
  const mediumTap = useCallback(() => vibrate("medium"), [vibrate]);
  const heavyTap = useCallback(() => vibrate("heavy"), [vibrate]);
  const successFeedback = useCallback(() => vibrate("success"), [vibrate]);
  const errorFeedback = useCallback(() => vibrate("error"), [vibrate]);
  const diceRoll = useCallback(() => vibrate("dice"), [vibrate]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    successFeedback,
    errorFeedback,
    diceRoll,
  };
};
