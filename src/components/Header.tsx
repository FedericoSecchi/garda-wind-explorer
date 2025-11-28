import { Wind } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-gradient-hero border-b border-border">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 shadow-glow">
              <Wind className="w-7 h-7 md:w-8 md:h-8 text-primary animate-wind" />
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
              <span className="text-foreground">WindMap</span>
              <span className="text-gradient ml-2">Garda</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl">
            Visualizá las condiciones del viento en tiempo real en todo el Lago di Garda
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
