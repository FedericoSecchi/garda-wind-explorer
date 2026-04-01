import { Wind, LogIn, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/AuthContext";
import { hasPremiumAccess, isTrialExpired } from "@/lib/access";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { lang, setLang, t } = useLanguage();
  const { user, loading, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const premium = hasPremiumAccess(user);
  const trialExpired = isTrialExpired(user);

  return (
    <>
      <header className="bg-gradient-hero border-b border-border">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col items-center text-center gap-3 relative">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 shadow-glow">
                <Wind className="w-7 h-7 md:w-8 md:h-8 text-primary animate-wind" />
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                <span className="text-foreground">Wind</span>
                <span className="text-gradient">Spots</span>
              </h1>
            </div>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl">
              {t("header.tagline")}
            </p>

            {/* Right side: language toggle + auth */}
            <div className="absolute right-0 top-0 flex items-center gap-2">
              {/* Auth button */}
              {!loading && (
                user ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span className="hidden sm:inline">{user.email.split("@")[0]}</span>
                      {premium && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary">
                          TRIAL
                        </span>
                      )}
                      {trialExpired && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                          FREE
                        </span>
                      )}
                    </div>
                    <button
                      onClick={signOut}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="Sign out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => setShowAuth(true)}
                  >
                    <LogIn className="w-3 h-3" />
                    Sign in
                  </Button>
                )
              )}

              {/* Language toggle */}
              <div className="flex rounded-lg overflow-hidden border border-border text-xs font-semibold">
                <button
                  onClick={() => setLang("es")}
                  className={`px-2.5 py-1 transition-colors ${
                    lang === "es"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ES
                </button>
                <button
                  onClick={() => setLang("en")}
                  className={`px-2.5 py-1 transition-colors ${
                    lang === "en"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          reason="Sign up for free to unlock live wind data."
        />
      )}
    </>
  );
};

export default Header;
