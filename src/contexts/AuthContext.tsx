import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { identifyUser, resetAnalytics, track } from "@/lib/analytics";

export interface UserProfile {
  id: string;
  email: string;
  plan: "free" | "premium";
  trial_end_date: string | null;
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn("[auth] Supabase not configured — auth disabled.");
      return;
    }

    console.log("[auth] Supabase configured. Checking session…");

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("[auth] getSession →", session ? `user=${session.user.email}` : "no session", error ?? "");
      if (session?.user) fetchProfile(session.user.id, session.user.email ?? "");
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[auth] onAuthStateChange →", event, session?.user?.email ?? "signed out");
      if (session?.user) fetchProfile(session.user.id, session.user.email ?? "");
      else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string, email: string) {
    console.log("[auth] fetchProfile →", email);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, plan, trial_end_date")
      .eq("id", userId)
      .single();

    console.log("[auth] profile →", data ?? "not found", error?.message ?? "");

    if (data) {
      setUser(data as UserProfile);
      identifyUser(data.id, { email: data.email, plan: data.plan });
    } else {
      // First login — create profile with 14-day trial
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      const newProfile: UserProfile = {
        id: userId,
        email,
        plan: "free",
        trial_end_date: trialEnd.toISOString(),
      };
      const { error: insertError } = await supabase.from("profiles").insert(newProfile);
      console.log("[auth] profile created →", insertError ? insertError.message : "ok");
      setUser(newProfile);
      track("signup_completed");
      track("trial_started", { trial_end: trialEnd.toISOString() });
      identifyUser(userId, { email, plan: "free" });
    }

    setLoading(false);
  }

  async function sendMagicLink(email: string) {
    if (!isSupabaseConfigured) return { error: "Auth not configured." };
    track("login_started");
    const redirectTo = window.location.origin + window.location.pathname;
    console.log("[auth] sendMagicLink →", email, "redirect:", redirectTo);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    console.log("[auth] signInWithOtp →", error ? error.message : "email sent");
    return { error: error?.message ?? null };
  }

  async function signOut() {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    console.log("[auth] signed out");
    setUser(null);
    resetAnalytics();
  }

  return (
    <AuthContext.Provider value={{ user, loading, sendMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
