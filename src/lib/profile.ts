import type { CEFR, Profile, TranslationLevel } from "./types";
import { nowIso } from "./utils";

export function initialProfile(): Profile {
  const now = nowIso();
  return {
    id: "me",
    displayName: "",
    nativeLanguage: "Albanian",
    currentLevelClaimed: "Beginner, working through A1/A2",
    targetLevel: "B2",
    longTermGoal: "Work in a German-speaking call center",
    preferences: [
      "Simple German with Albanian translations and explanations",
      "Practical language over academic explanations",
      "Speaking practice, not only recognition",
      "Real-life situations",
    ],
    knownWeaknesses: [
      "a1-questions",
      "a2-connectors",
      "a2-reflexive",
      "a1-sein-haben",
      "a2-perfekt",
      "a2-separable",
      "b1-nebensatz",
      "a1-present",
      "a2-futur",
      "b1-praeteritum",
    ],
    dailyMinutes: 35,
    translationMode: "auto",
    ttsRate: 0.9,
    theme: "system",
    aiModelOverride: "",
    onboardingCompleted: false,
    placementCompletedAt: null,
    placementLevel: null,
    createdAt: now,
    updatedAt: now,
  };
}

/** Albanian support is reduced gradually as the demonstrated level grows. */
export function translationLevel(profile: Profile | undefined, workingLevel: CEFR): TranslationLevel {
  if (profile && profile.translationMode !== "auto") return profile.translationMode;
  if (workingLevel === "A1") return "full";
  if (workingLevel === "A2") return "partial";
  return "minimal";
}
