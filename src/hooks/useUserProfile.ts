// Perfil del usuario persistido en localStorage
import { useState } from "react";
import { UserProfile } from "@/lib/windDecision";

const STORAGE_KEY = "windmap_user_profile";

const DEFAULT_PROFILE: UserProfile = {
  weight: 75,
  kiteSize: 12,
  boardType: "twintip",
};

export function useUserProfile() {
  const [profile, setProfileState] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_PROFILE, ...JSON.parse(stored) } : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  function setProfile(next: UserProfile) {
    setProfileState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage no disponible (modo privado, etc.)
    }
  }

  return { profile, setProfile };
}
