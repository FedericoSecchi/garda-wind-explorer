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
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured); // skip loading if no backend

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchProfile(session.user.id);
      else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, plan, trial_end_date")
      .eq("id", userId)
      .single();

    if (data) {
      setUser(data as UserProfile);
      identifyUser(data.id, { email: data.email, plan: data.plan });
    }
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured) return { error: "Auth not configured." };
    track("login_started");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string) {
    if (!isSupabaseConfigured) return { error: "Auth not configured." };
    track("login_started");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      await supabase.from("profiles").insert({
        id: data.user.id,
        email,
        plan: "free",
        trial_end_date: trialEnd.toISOString(),
      });
      track("signup_completed");
      track("trial_started", { trial_end: trialEnd.toISOString() });
    }

    return { error: null };
  }

  async function signOut() {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    setUser(null);
    resetAnalytics();
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
