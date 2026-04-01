import type { UserProfile } from "@/contexts/AuthContext";

/** Returns true if user has full live-wind access (premium or active trial). */
export function hasPremiumAccess(user: UserProfile | null): boolean {
  if (!user) return false;
  if (user.plan === "premium") return true;
  if (user.trial_end_date && new Date(user.trial_end_date) > new Date()) return true;
  return false;
}

/** Returns true if the trial has expired. */
export function isTrialExpired(user: UserProfile | null): boolean {
  if (!user) return false;
  if (user.plan === "premium") return false;
  if (!user.trial_end_date) return false;
  return new Date(user.trial_end_date) <= new Date();
}
