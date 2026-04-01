import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onClose: () => void;
  reason?: string;
}

type Mode = "signup" | "signin";

export function AuthModal({ onClose, reason }: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const { error } = mode === "signup"
      ? await signUp(email, password)
      : await signIn(email, password);

    setLoading(false);

    if (error) {
      setError(error);
    } else if (mode === "signup") {
      setSuccess("Account created! Check your email to confirm, then sign in.");
    } else {
      onClose();
    }
  }

  function toggleMode() {
    setMode((m) => (m === "signup" ? "signin" : "signup"));
    setError("");
    setSuccess("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-card w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        {reason && (
          <p className="mb-4 text-xs text-primary bg-primary/10 rounded-lg px-3 py-2">
            {reason}
          </p>
        )}

        <h2 className="text-lg font-bold mb-1">
          {mode === "signup" ? "Create account" : "Sign in"}
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          {mode === "signup"
            ? "Start your free 14-day trial. No credit card needed."
            : "Welcome back."}
        </p>

        {success ? (
          <div className="text-sm text-emerald-400 bg-emerald-400/10 rounded-lg px-3 py-3 text-center">
            {success}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Input
              type="password"
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading…" : mode === "signup" ? "Start free trial" : "Sign in"}
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-muted-foreground mt-4">
          {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
          <button onClick={toggleMode} className="text-primary hover:underline">
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
