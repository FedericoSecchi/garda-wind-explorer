import { useAuth } from "@/contexts/AuthContext";
import { hasPremiumAccess, isDevUser } from "@/lib/access";

/**
 * Returns premium access state for the current user.
 * Dev email always returns isPremium=true.
 */
export function usePremiumAccess() {
  const { user, loading } = useAuth();
  return {
    isPremium: hasPremiumAccess(user),
    isDev: isDevUser(user),
    user,
    loading,
  };
}
