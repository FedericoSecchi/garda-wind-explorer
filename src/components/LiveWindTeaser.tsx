import { Lock } from "lucide-react";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

interface CurrentWind {
  speed: number;
  direction: number;
  gust: number;
}

interface Props {
  hasAccess: boolean;
  currentWind: CurrentWind | null;
  onUnlock: () => void;
}

export function LiveWindTeaser({ hasAccess, currentWind, onUnlock }: Props) {
  function handleUnlockClick() {
    track("click_unlock_live");
    onUnlock();
  }

  if (hasAccess) {
    return (
      <div className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Live wind
          </h3>
        </div>
        {currentWind ? (
          <div className="space-y-1">
            <div className="text-3xl font-bold text-primary">
              {currentWind.speed}{" "}
              <span className="text-base font-normal text-muted-foreground">kn</span>
            </div>
            {currentWind.gust > 0 && (
              <div className="text-sm text-muted-foreground">
                gusts {currentWind.gust} kn
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No live data at this moment.</div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-card rounded-xl border border-border p-5 shadow-card relative overflow-hidden">
      {/* blurred fake content */}
      <div className="filter blur-sm pointer-events-none select-none" aria-hidden>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Live wind
          </h3>
        </div>
        <div className="text-3xl font-bold text-primary">
          18 <span className="text-base font-normal text-muted-foreground">kn</span>
        </div>
        <div className="text-sm text-muted-foreground mt-1">gusts 22 kn</div>
      </div>

      {/* lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/80 backdrop-blur-[2px]">
        <Lock className="w-5 h-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center px-4">
          Real-time data is a premium feature
        </p>
        <Button size="sm" onClick={handleUnlockClick}>
          Unlock live data
        </Button>
      </div>
    </div>
  );
}
