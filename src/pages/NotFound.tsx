import { Wind } from "lucide-react";

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-ocean">
    <div className="text-center space-y-4">
      <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
        <Wind className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Página no encontrada</p>
      <a href="/" className="inline-block text-primary underline hover:text-primary/80 text-sm">
        Volver al inicio
      </a>
    </div>
  </div>
);

export default NotFound;
