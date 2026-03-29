// ============================================================
// FEED DE ALERTAS
// MVP: visualización en pantalla + botón de notificaciones push.
// Arquitectura preparada para Telegram / WhatsApp / Push futuro.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { Bell, BellOff, BellRing, Clock, AlertTriangle, TrendingDown, CalendarDays } from "lucide-react";
import { WindAlert, AlertType, generateAlerts, logAlerts } from "@/lib/alertEngine";
import { UserProfile } from "@/lib/windDecision";
import { ForecastDay } from "@/data/forecast";
import { useLanguage } from "@/hooks/useLanguage";

interface AlertFeedProps {
  profile:  UserProfile;
  forecast: ForecastDay[];
}

// ── Push notification helpers ────────────────────────────
type NotifPermission = "default" | "granted" | "denied" | "unsupported";

function getPermission(): NotifPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as NotifPermission;
}

async function requestPermission(): Promise<NotifPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  const result = await Notification.requestPermission();
  return result as NotifPermission;
}

function sendBrowserNotification(alert: WindAlert) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification("WindSpots — " + alert.message, {
    body: alert.subMessage,
    icon: "/favicon.ico",
  });
}

// ── Alert type → icon / style ────────────────────────────
const ALERT_CONFIG: Record<AlertType, {
  icon: typeof Bell;
  color: string;
  bg: string;
}> = {
  live:     { icon: BellRing,     color: "text-emerald-400", bg: "bg-emerald-500/10" },
  upcoming: { icon: Clock,        color: "text-yellow-400",  bg: "bg-yellow-500/10"  },
  advance:  { icon: CalendarDays, color: "text-sky-400",     bg: "bg-sky-500/10"     },
  ending:   { icon: TrendingDown, color: "text-orange-400",  bg: "bg-orange-500/10"  },
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

export default function AlertFeed({ profile, forecast }: AlertFeedProps) {
  const { t } = useLanguage();
  const alerts = generateAlerts(forecast, profile);

  const [notifPerm, setNotifPerm] = useState<NotifPermission>(getPermission);

  // Log to console (MVP)
  useEffect(() => { logAlerts(alerts); }, [alerts]);

  // Send browser notification for high-priority live alerts when permission granted
  useEffect(() => {
    if (notifPerm !== "granted") return;
    alerts
      .filter(a => a.priority === "high" && a.type === "live")
      .forEach(a => sendBrowserNotification(a));
  }, [alerts, notifPerm]);

  const handleEnableNotifications = useCallback(async () => {
    const perm = await requestPermission();
    setNotifPerm(perm);
    if (perm === "granted") {
      new Notification("WindSpots", { body: t("alert.pushEnabled") });
    }
  }, [t]);

  const alertTypeLabel: Record<AlertType, string> = {
    live:     t("alert.typeNow"),
    upcoming: t("alert.typeNext"),
    advance:  t("alert.typeAdv"),
    ending:   t("alert.typeEnd"),
  };

  const priorityLabel: Record<WindAlert["priority"], string> = {
    high:   t("alert.priHigh"),
    medium: t("alert.priMed"),
    low:    t("alert.priLow"),
  };

  return (
    <div className="space-y-4">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold">{t("alert.title")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("alert.basedOn")} {profile.kiteSize}m² {t("alert.and")} {profile.weight} kg
            </p>
          </div>
        </div>
        {alerts.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
            {alerts.length}
          </span>
        )}
      </div>

      {/* ── Push notification panel ──────────────────────── */}
      <div className="bg-secondary/20 rounded-xl border border-border p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {notifPerm === "granted"
              ? <BellRing className="w-4 h-4 text-emerald-400 shrink-0" />
              : notifPerm === "denied"
              ? <BellOff  className="w-4 h-4 text-red-400 shrink-0" />
              : <Bell     className="w-4 h-4 text-muted-foreground shrink-0" />
            }
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("alert.pushTitle")}</p>
              <p className="text-xs text-muted-foreground truncate">
                {notifPerm === "granted"
                  ? t("alert.pushEnabled")
                  : notifPerm === "denied"
                  ? t("alert.pushBlocked")
                  : t("alert.pushFuture")}
              </p>
            </div>
          </div>
          {notifPerm !== "granted" && notifPerm !== "denied" && notifPerm !== "unsupported" && (
            <button
              onClick={handleEnableNotifications}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              {t("alert.pushEnable")}
            </button>
          )}
          {notifPerm === "granted" && (
            <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
              ✓ ON
            </span>
          )}
        </div>
      </div>

      {/* ── Alert list ───────────────────────────────────── */}
      {alerts.length === 0 ? (
        <div className="bg-gradient-card rounded-xl border border-border p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t("alert.none")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("alert.noneHint")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const cfg  = ALERT_CONFIG[alert.type];
            const Icon = cfg.icon;
            return (
              <div
                key={alert.id}
                className={`${cfg.bg} rounded-xl border border-transparent p-4 flex items-start gap-3`}
              >
                <div className={`mt-0.5 shrink-0 ${cfg.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>
                      {alertTypeLabel[alert.type]}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatAlertTime(alert)}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.subMessage}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center justify-end gap-1.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[alert.priority]}`} />
                    <span className="text-xs text-muted-foreground capitalize">
                      {priorityLabel[alert.priority]}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">{alert.windSpeed} kn</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
