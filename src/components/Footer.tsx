import { Wind } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-hero border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wind className="w-4 h-4 text-primary" />
            <span>© 2025 WindMap Garda · Proyecto MVP</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Datos simulados para demostración
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
