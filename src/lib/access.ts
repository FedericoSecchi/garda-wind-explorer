import type { UserProfile } from "@/contexts/AuthContext";

const DEV_EMAIL = "secchifederico29er@gmail.com";

export function isDevUser(user: UserProfile | null): boolean {
  return user?.email === DEV_EMAIL;
}

/** Returns true if user has full live-wind access (premium, active trial, or dev override). */
export function hasPremiumAccess(user: UserProfile | null): boolean {
  if (!user) return false;
  if (isDevUser(user)) return true;
  if (user.plan === "premium") return true;
  if (user.trial_end_date && new Date(user.trial_end_date) > new Date()) return true;
  return false;
}

/** Returns true if the trial has expired. */
export function isTrialExpired(user: UserProfile | null): boolean {
  if (!user) return false;
  if (isDevUser(user)) return false;
  if (user.plan === "premium") return false;
  if (!user.trial_end_date) return false;
  return new Date(user.trial_end_date) <= new Date();
}
