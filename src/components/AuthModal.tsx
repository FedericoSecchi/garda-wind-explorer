import { useState } from "react";
import { X, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onClose: () => void;
  reason?: string;
}

export function AuthModal({ onClose, reason }: Props) {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await sendMagicLink(email);
    setLoading(false);
    if (error) setError(error);
    else setSent(true);
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

        <div className="flex justify-center mb-4">
          <div className="p-2.5 rounded-full bg-primary/10">
            <Mail className="w-6 h-6 text-primary" />
          </div>
        </div>

        <h2 className="text-lg font-bold text-center mb-1">Sign in</h2>
        <p className="text-sm text-muted-foreground text-center mb-5">
          Enter your email — we'll send you a login link. No password needed.
        </p>

        {sent ? (
          <div className="text-sm text-emerald-400 bg-emerald-400/10 rounded-lg px-4 py-3 text-center">
            Check your inbox. Click the link to sign in.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send login link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
