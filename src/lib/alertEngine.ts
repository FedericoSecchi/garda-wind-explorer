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

export function generateAlerts(
  forecast: ForecastDay[],
  userProfile: UserProfile
): WindAlert[] {
  const alerts: WindAlert[] = [];
  const now = new Date();

  forecast.forEach((day, dayIndex) => {
    const isToday = dayIndex === 0;
    const isTomorrow = dayIndex === 1;

    const idealHours = day.hours.filter((h) => {
      const d = evaluateConditions({ windSpeed: h.windSpeed, windDirection: h.windDirection, userProfile });
      return d.condition === "ideal";
    });

    const hasAnyGood = day.hours.some((h) => {
      const d = evaluateConditions({ windSpeed: h.windSpeed, windDirection: h.windDirection, userProfile });
      return d.condition !== "no_navegable";
    });

    if (!hasAnyGood) return;

    if (isToday) {
      const currentHour = day.hours.find((h) => h.time.getHours() === now.getHours());
      const currentDecision = currentHour
        ? evaluateConditions({ windSpeed: currentHour.windSpeed, windDirection: currentHour.windDirection, userProfile })
        : null;

      const isLiveNow = currentDecision?.condition === "ideal";

      // LIVE: condiciones ideales ahora mismo
      if (isLiveNow && currentHour) {
        alerts.push({
          id: "live-now",
          type: "live",
          message: "Ahora está ideal",
          subMessage: `${currentHour.windSpeed} kn — perfectas para tu ${userProfile.kiteSize}m²`,
          time: now,
          windSpeed: currentHour.windSpeed,
          priority: "high",
        });
      }

      // UPCOMING: próximas horas ideales (solo si NO es live ahora)
      if (!isLiveNow) {
        const nextIdealHour = idealHours.find((h) => h.time > now);
        if (nextIdealHour) {
          const hoursAway = Math.round((nextIdealHour.time.getTime() - now.getTime()) / 3_600_000);
          if (hoursAway > 0 && hoursAway <= 6) {
            alerts.push({
              id: `upcoming-${hoursAway}h`,
              type: "upcoming",
              message: `En ${hoursAway} hora${hoursAway > 1 ? "s" : ""} entra viento ideal`,
              subMessage: `${nextIdealHour.windSpeed} kn a las ${nextIdealHour.time.getHours()}:00`,
              time: nextIdealHour.time,
              windSpeed: nextIdealHour.windSpeed,
              priority: hoursAway <= 2 ? "high" : "medium",
            });
          }
        }
      }

      // ENDING: viento se acaba pronto (solo si hay condiciones buenas ahora)
      if (currentDecision && currentDecision.condition !== "no_navegable") {
        const lastIdealHour = [...idealHours].reverse().find((h) => h.time > now);
        if (lastIdealHour) {
          const hoursLeft = Math.round((lastIdealHour.time.getTime() - now.getTime()) / 3_600_000);
          if (hoursLeft > 0 && hoursLeft <= 3) {
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
    }

    // ADVANCE: días futuros con al menos 1 hora ideal
    if (!isToday && idealHours.length >= 1) {
      const peakHour = idealHours.reduce((best, h) => h.windSpeed > best.windSpeed ? h : best);
      alerts.push({
        id: `advance-day-${dayIndex}`,
        type: "advance",
        message: isTomorrow ? "Mañana pinta bien" : `${day.dayLabel} hay buen viento`,
        subMessage: `Hasta ${peakHour.windSpeed} kn a las ${peakHour.time.getHours()}:00 · ${idealHours.length}h ideales`,
        time: day.date,
        windSpeed: peakHour.windSpeed,
        priority: isTomorrow ? "medium" : "low",
      });
    }
  });

  const priorityOrder: Record<AlertPriority, number> = { high: 0, medium: 1, low: 2 };
  return alerts.sort(
    (a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      a.time.getTime() - b.time.getTime()
  );
}

export function logAlerts(alerts: WindAlert[]): void {
  if (alerts.length === 0) {
    console.log("[WindAlerts] Sin alertas activas.");
    return;
  }
  console.group("[WindAlerts] Alertas activas:");
  alerts.forEach((a) => {
    const prefix = a.priority === "high" ? "🔴" : a.priority === "medium" ? "🟡" : "🟢";
    console.log(`${prefix} [${a.type.toUpperCase()}] ${a.message} — ${a.subMessage}`);
  });
  console.groupEnd();
}
