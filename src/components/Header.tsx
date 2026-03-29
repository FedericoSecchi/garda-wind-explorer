import { Wind } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const Header = () => {
  const { lang, setLang, t } = useLanguage();

  return (
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

          {/* Language toggle */}
          <div className="absolute right-0 top-0 flex rounded-lg overflow-hidden border border-border text-xs font-semibold">
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
    </header>
  );
};

export default Header;
