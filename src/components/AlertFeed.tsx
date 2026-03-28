// ============================================================
// FEED DE ALERTAS
// ============================================================
// Muestra las alertas generadas por el motor de alertas.
// MVP: visualización en pantalla.
// Futuro: conectar botón "Activar notificaciones" a push/email.
// ============================================================

import { useEffect } from "react";
import { Bell, Clock, AlertTriangle, TrendingDown, CalendarDays } from "lucide-react";
import { WindAlert, AlertType, generateAlerts, logAlerts } from "@/lib/alertEngine";
import { UserProfile } from "@/lib/windDecision";
import { mockForecast } from "@/data/forecast";

interface AlertFeedProps {
  profile: UserProfile;
}

const ALERT_CONFIG: Record<AlertType, {
  icon: typeof Bell;
  label: string;
  color: string;
  bg: string;
}> = {
  live:     { icon: Bell,          label: "Ahora",     color: "text-emerald-400", bg: "bg-emerald-500/10" },
  upcoming: { icon: Clock,         label: "Próximo",   color: "text-yellow-400",  bg: "bg-yellow-500/10"  },
  advance:  { icon: CalendarDays,  label: "Avance",    color: "text-sky-400",     bg: "bg-sky-500/10"     },
  ending:   { icon: TrendingDown,  label: "Finalizando", color: "text-orange-400", bg: "bg-orange-500/10" },
};

const PRIORITY_DOT: Record<WindAlert["priority"], string> = {
  high:   "bg-red-500",
  medium: "bg-yellow-500",
  low:    "bg-slate-500",
};

function formatAlertTime(alert: WindAlert): string {
  const now = new Date();
  const diff = alert.time.getTime() - now.getTime();
  const hours = Math.round(diff / 3_600_000);

  if (Math.abs(hours) < 1) return "ahora";
  if (hours < 0) return `hace ${Math.abs(hours)}h`;
  if (hours < 24) return `en ${hours}h`;
  return alert.time.toLocaleDateString("es-AR", { weekday: "short", day: "numeric" });
}

export default function AlertFeed({ profile }: AlertFeedProps) {
  const alerts = generateAlerts(mockForecast, profile);

  // Log a consola en modo MVP
  useEffect(() => {
    logAlerts(alerts);
  }, [profile.weight, profile.kiteSize]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold">Alertas de viento</h3>
            <p className="text-xs text-muted-foreground">
              Basadas en tu {profile.kiteSize}m² y {profile.weight} kg
            </p>
          </div>
        </div>
        {alerts.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
            {alerts.length}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="bg-gradient-card rounded-xl border border-border p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Sin alertas activas para los próximos 7 días con tu equipo.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Probá con un kite más grande o ajustá tu peso.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const cfg = ALERT_CONFIG[alert.type];
            const Icon = cfg.icon;

            return (
              <div
                key={alert.id}
                className={`${cfg.bg} rounded-xl border border-transparent p-4 flex items-start gap-3`}
              >
                {/* Icono de tipo */}
                <div className={`mt-0.5 shrink-0 ${cfg.color}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatAlertTime(alert)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.subMessage}</p>
                </div>

                {/* Indicador de prioridad + viento */}
                <div className="shrink-0 text-right">
                  <div className="flex items-center justify-end gap-1.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[alert.priority]}`} />
                    <span className="text-xs text-muted-foreground capitalize">
                      {alert.priority === "high" ? "alta" : alert.priority === "medium" ? "media" : "baja"}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    {alert.windSpeed} kn
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Nota sobre notificaciones futuras ───────────── */}
      <div className="bg-secondary/30 rounded-lg border border-border p-3 flex items-start gap-2">
        <Bell className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Próximamente:</span> notificaciones
          push y email. Por ahora las alertas también se logean en la consola del navegador.
        </p>
      </div>
    </div>
  );
}
