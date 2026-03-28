// ============================================================
// MOTOR DE ALERTAS
// ============================================================
// Genera alertas basadas en el pronóstico + perfil del usuario.
// MVP: alertas en memoria (console-ready).
// Futuro: conectar a push notifications / email.
// ============================================================

import { ForecastDay } from "@/data/forecast";
import { UserProfile, evaluateConditions } from "@/lib/windDecision";

export type AlertType = "advance" | "upcoming" | "live" | "ending";
export type AlertPriority = "high" | "medium" | "low";

export interface WindAlert {
  id: string;
  type: AlertType;
  message: string;
  subMessage: string;
  time: Date;
  windSpeed: number;
  priority: AlertPriority;
}

// ─── Generador principal ───────────────────────────────────
export function generateAlerts(
  forecast: ForecastDay[],
  userProfile: UserProfile
): WindAlert[] {
  const alerts: WindAlert[] = [];
  const now = new Date();

  forecast.forEach((day, dayIndex) => {
    const isToday = dayIndex === 0;
    const isTomorrow = dayIndex === 1;

    // Horas con condiciones buenas o ideales
    const goodHours = day.hours.filter((h) => {
      const d = evaluateConditions({
        windSpeed: h.windSpeed,
        windDirection: h.windDirection,
        userProfile,
      });
      return d.condition === "ideal" || d.condition === "condiciones_medias";
    });

    const idealHours = day.hours.filter((h) => {
      const d = evaluateConditions({
        windSpeed: h.windSpeed,
        windDirection: h.windDirection,
        userProfile,
      });
      return d.condition === "ideal";
    });

    if (goodHours.length === 0) return;

    // ── Alerta LIVE: hoy hay viento ahora ───────────────────
    if (isToday) {
      const currentHour = day.hours.find(
        (h) => h.time.getHours() === now.getHours()
      );
      if (currentHour) {
        const d = evaluateConditions({
          windSpeed: currentHour.windSpeed,
          windDirection: currentHour.windDirection,
          userProfile,
        });
        if (d.condition === "ideal") {
          alerts.push({
            id: "live-now",
            type: "live",
            message: "Ahora está ideal",
            subMessage: `${currentHour.windSpeed} kn — condiciones perfectas para tu ${userProfile.kiteSize}m²`,
            time: now,
            windSpeed: currentHour.windSpeed,
            priority: "high",
          });
        }
      }

      // ── Alerta UPCOMING: viento entra en X horas ──────────
      const nextGoodHour = idealHours.find((h) => h.time > now);
      if (nextGoodHour) {
        const hoursAway = Math.round(
          (nextGoodHour.time.getTime() - now.getTime()) / 3_600_000
        );
        if (hoursAway > 0 && hoursAway <= 6) {
          alerts.push({
            id: `upcoming-${hoursAway}h`,
            type: "upcoming",
            message: `En ${hoursAway} hora${hoursAway > 1 ? "s" : ""} entra viento`,
            subMessage: `Pico esperado: ${nextGoodHour.windSpeed} kn a las ${nextGoodHour.time.getHours()}:00`,
            time: nextGoodHour.time,
            windSpeed: nextGoodHour.windSpeed,
            priority: hoursAway <= 2 ? "high" : "medium",
          });
        }
      }

      // ── Alerta ENDING: el viento va a caer ────────────────
      const lastIdealHour = [...idealHours].reverse().find((h) => h.time > now);
      if (lastIdealHour) {
        const hoursLeft = Math.round(
          (lastIdealHour.time.getTime() - now.getTime()) / 3_600_000
        );
        if (hoursLeft > 0 && hoursLeft <= 4) {
          alerts.push({
            id: "ending-soon",
            type: "ending",
            message: `El viento cae en ~${hoursLeft} hora${hoursLeft > 1 ? "s" : ""}`,
            subMessage: `Último tramo ideal: ${lastIdealHour.windSpeed} kn a las ${lastIdealHour.time.getHours()}:00`,
            time: lastIdealHour.time,
            windSpeed: lastIdealHour.windSpeed,
            priority: "medium",
          });
        }
      }
    }

    // ── Alerta ADVANCE: días futuros ─────────────────────────
    if (!isToday && idealHours.length >= 2) {
      const peakHour = idealHours.reduce((best, h) =>
        h.windSpeed > best.windSpeed ? h : best
      );
      alerts.push({
        id: `advance-day-${dayIndex}`,
        type: "advance",
        message: isTomorrow
          ? "Mañana pinta bien"
          : `${day.dayLabel} hay buen viento`,
        subMessage: `Hasta ${peakHour.windSpeed} kn a las ${peakHour.time.getHours()}:00`,
        time: day.date,
        windSpeed: peakHour.windSpeed,
        priority: isTomorrow ? "medium" : "low",
      });
    }
  });

  // Ordenar por prioridad y luego por tiempo
  const priorityOrder: Record<AlertPriority, number> = { high: 0, medium: 1, low: 2 };
  return alerts.sort(
    (a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      a.time.getTime() - b.time.getTime()
  );
}

// ─── Log a consola (modo MVP) ──────────────────────────────
// En producción: reemplazar por push notification / email
export function logAlerts(alerts: WindAlert[]): void {
  if (alerts.length === 0) {
    console.log("[WindAlerts] Sin alertas activas.");
    return;
  }
  console.group("[WindAlerts] Alertas activas:");
  alerts.forEach((a) => {
    const prefix =
      a.priority === "high" ? "🔴" : a.priority === "medium" ? "🟡" : "🟢";
    console.log(`${prefix} [${a.type.toUpperCase()}] ${a.message} — ${a.subMessage}`);
  });
  console.groupEnd();
}
