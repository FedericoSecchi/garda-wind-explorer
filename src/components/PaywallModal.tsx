import { useEffect, useState } from "react";
import { X, Wind } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { track } from "@/lib/analytics";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface Props {
  onClose: () => void;
  onRequestAuth: () => void;
}

export function PaywallModal({ onClose, onRequestAuth }: Props) {
  const { user } = useAuth();
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    track("paywall_viewed");
  }, []);

  async function handleEarlyAccess() {
    track("paywall_clicked");

    if (!user) {
      onClose();
      onRequestAuth();
      return;
    }

    if (isSupabaseConfigured) {
      await supabase
        .from("upgrade_interest")
        .upsert({ user_id: user.id, interest: true }, { onConflict: "user_id" });
    }

    track("early_access_joined");
    setJoined(true);
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

        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10 shadow-glow">
            <Wind className="w-8 h-8 text-primary" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center mb-2">
          Ride with real data
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Get real-time wind conditions from this spot and make better
          decisions before going out.
        </p>

        {joined ? (
          <div className="text-sm text-emerald-400 bg-emerald-400/10 rounded-lg px-4 py-3 text-center">
            You're on the early access list.
          </div>
        ) : (
          <div className="space-y-3">
            <Button onClick={handleEarlyAccess} className="w-full">
              Get early access
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              Maybe later
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
