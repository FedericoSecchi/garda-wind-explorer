// ─────────────────────────────────────────────────────────
// Simple i18n — no external libraries
// Usage:  const { t, lang, setLang } = useLanguage()
//         t("header.title")  →  "WindSpots" | "WindSpots"
// ─────────────────────────────────────────────────────────

export type Lang = "es" | "en";

const translations = {
  es: {
    // Header
    "header.tagline": "Pronóstico inteligente para kite y windsurf",

    // Tabs
    "tab.map":     "Mapa",
    "tab.sail":    "¿Navego?",
    "tab.plan":    "Planificar",
    "tab.alerts":  "Alertas",

    // Status bar
    "status.loading":   "Consultando modelos meteorológicos…",
    "status.real":      "Datos reales",
    "status.via":       "GFS · ECMWF · ICON via Open-Meteo",
    "status.now":       "Ahora",
    "status.gust":      "ráf.",
    "status.offline":   "Sin conexión",

    // Spot info
    "spot.conditions":  "Condiciones ahora",
    "spot.speed":       "Velocidad",
    "spot.direction":   "Dirección",
    "spot.gusts":       "Ráfagas",
    "spot.peakToday":   "Pico hoy",
    "spot.peakHour":    "Hora pico",
    "spot.source":      "Fuente: Open-Meteo GFS",
    "spot.noWind":      "Sin datos de viento disponibles.",
    "spot.waiting":     "Esperando datos…",
    "spot.info":        "Info del spot",
    "spot.region":      "Región",
    "spot.bestMonths":  "Mejor época",
    "spot.coords":      "Coordenadas",
    "spot.anemometer":  "✓ Observaciones meteorológicas disponibles",

    // Decision Widget
    "decision.myProfile":    "Mi perfil",
    "decision.weight":       "Peso",
    "decision.kiteSize":     "Tamaño de kite",
    "decision.boardType":    "Tipo de tabla",
    "decision.boardTwintip": "Twin Tip",
    "decision.boardDir":     "Direccional",
    "decision.boardFoil":    "Foil",
    "decision.conditionNow": "Condición ahora",
    "decision.knNow":        "kn ahora",
    "decision.knPeak":       "kn pico hoy",
    "decision.knGusts":      "kn ráfagas",
    "decision.realtime":     "tiempo real",
    "decision.estimated":    "estimado",
    "decision.forecast":     "pronóstico",
    "decision.maxGusts":     "máximas",
    "decision.noGusts":      "sin datos",
    "decision.loading":      "Consultando viento real…",
    "decision.noData":       "Sin datos de viento para este spot en este momento.",
    "decision.kiteFor":      "Para",
    "decision.kiteOptimal":  "kite óptimo",
    "decision.kiteYouHave":  "tenés",
    "decision.idealRange":   "Ideal:",

    // Planner
    "planner.title":         "Planificador semanal",
    "planner.subtitle":      "Marcá los días que podés salir y te digo cuándo vale la pena.",
    "planner.selectDays":    "Tocá los días para marcar tu disponibilidad.",
    "planner.reco":          "Mi recomendación",
    "planner.noWind":        "Ninguno de tus días tiene condiciones suficientes con tu",
    "planner.goSail":        "Salí, pico de",
    "planner.mayWork":       "Puede servir, pico de",
    "planner.idealHours":    "h ideales",
    "planner.navTitle":      "Planificador —",
    "planner.realForecast":  "Pronóstico real (GFS · ECMWF · ICON) · 7 días",
    "planner.loading":       "Cargando pronóstico…",
    "planner.noForecast":    "Sin datos de pronóstico disponibles para este spot",
    "planner.noForecastMsg": "No hay datos de pronóstico disponibles. Verificá tu conexión.",
    "planner.tomorrow":      "¿Puedo navegar mañana?",
    "planner.today":         "¿Puedo navegar hoy?",
    "planner.yes":           "Sí",
    "planner.no":            "No",
    "planner.bestWindow":    "Mejor ventana",
    "planner.peakAt":        "Pico",
    "planner.hours":         "h navegables",
    "planner.noWindow":      "Sin ventana navegable",

    // Condition labels
    "cond.ideal":     "Navegable",
    "cond.medium":    "Puede servir",
    "cond.no":        "No vale la pena",
    "cond.ideal_fw":  "Ideal",
    "cond.noNow":     "No navegable",
    "cond.medium_fw": "Condiciones medias",

    // Alerts
    "alert.title":       "Alertas de viento",
    "alert.basedOn":     "Basadas en tu",
    "alert.and":         "y",
    "alert.none":        "Sin alertas activas para los próximos 7 días con tu equipo.",
    "alert.noneHint":    "Probá con un kite más grande o ajustá tu peso.",
    "alert.pushTitle":   "Notificaciones push",
    "alert.pushEnable":  "Activar notificaciones",
    "alert.pushEnabled": "Notificaciones activas",
    "alert.pushBlocked": "Bloqueadas por el navegador",
    "alert.pushFuture":  "Próximamente: notificaciones push y email.",
    "alert.pushConsole": "Por ahora las alertas también se logean en la consola.",
    "alert.typeNow":     "Ahora",
    "alert.typeNext":    "Próximo",
    "alert.typeAdv":     "Avance",
    "alert.typeEnd":     "Finalizando",
    "alert.priHigh":     "alta",
    "alert.priMed":      "media",
    "alert.priLow":      "baja",

    // Model comparison
    "models.title":      "Comparación de modelos meteorológicos",
    "models.loading":    "Cargando…",
    "models.noData":     "Sin datos",
    "models.consensus":  "Consenso",
    "models.confidence": "% confianza",
    "models.ofModels":   "modelos",
    "models.noForecast": "No hay datos de pronóstico disponibles. Verificá tu conexión.",

    // Map
    "map.peak":   "Pico hoy",
    "map.sports": "Deportes",
  },

  en: {
    // Header
    "header.tagline": "Smart forecast for kite and windsurf",

    // Tabs
    "tab.map":     "Map",
    "tab.sail":    "Sail today?",
    "tab.plan":    "Planner",
    "tab.alerts":  "Alerts",

    // Status bar
    "status.loading":   "Fetching weather models…",
    "status.real":      "Live data",
    "status.via":       "GFS · ECMWF · ICON via Open-Meteo",
    "status.now":       "Now",
    "status.gust":      "gust",
    "status.offline":   "Offline",

    // Spot info
    "spot.conditions":  "Current conditions",
    "spot.speed":       "Speed",
    "spot.direction":   "Direction",
    "spot.gusts":       "Gusts",
    "spot.peakToday":   "Today's peak",
    "spot.peakHour":    "Peak hour",
    "spot.source":      "Source: Open-Meteo GFS",
    "spot.noWind":      "No wind data available.",
    "spot.waiting":     "Waiting for data…",
    "spot.info":        "Spot info",
    "spot.region":      "Region",
    "spot.bestMonths":  "Best months",
    "spot.coords":      "Coordinates",
    "spot.anemometer":  "✓ Weather observations available",

    // Decision Widget
    "decision.myProfile":    "My profile",
    "decision.weight":       "Weight",
    "decision.kiteSize":     "Kite size",
    "decision.boardType":    "Board type",
    "decision.boardTwintip": "Twin Tip",
    "decision.boardDir":     "Directional",
    "decision.boardFoil":    "Foil",
    "decision.conditionNow": "Condition now",
    "decision.knNow":        "kn now",
    "decision.knPeak":       "kn peak today",
    "decision.knGusts":      "kn gusts",
    "decision.realtime":     "real time",
    "decision.estimated":    "estimated",
    "decision.forecast":     "forecast",
    "decision.maxGusts":     "max",
    "decision.noGusts":      "no data",
    "decision.loading":      "Fetching live wind…",
    "decision.noData":       "No wind data for this spot right now.",
    "decision.kiteFor":      "For",
    "decision.kiteOptimal":  "optimal kite",
    "decision.kiteYouHave":  "you have",
    "decision.idealRange":   "Ideal:",

    // Planner
    "planner.title":         "Weekly planner",
    "planner.subtitle":      "Mark days you're available and I'll tell you when it's worth going.",
    "planner.selectDays":    "Tap days to mark your availability.",
    "planner.reco":          "My recommendation",
    "planner.noWind":        "None of your days have enough wind for your",
    "planner.goSail":        "Go sail, peak",
    "planner.mayWork":       "Could work, peak",
    "planner.idealHours":    "ideal hrs",
    "planner.navTitle":      "Planner —",
    "planner.realForecast":  "Live forecast (GFS · ECMWF · ICON) · 7 days",
    "planner.loading":       "Loading forecast…",
    "planner.noForecast":    "No forecast data available for this spot",
    "planner.noForecastMsg": "No forecast data available. Check your connection.",
    "planner.tomorrow":      "Can I sail tomorrow?",
    "planner.today":         "Can I sail today?",
    "planner.yes":           "Yes",
    "planner.no":            "No",
    "planner.bestWindow":    "Best window",
    "planner.peakAt":        "Peak",
    "planner.hours":         "ideal hrs",
    "planner.noWindow":      "No sailing window",

    // Condition labels
    "cond.ideal":     "Sailable",
    "cond.medium":    "Could work",
    "cond.no":        "Not worth it",
    "cond.ideal_fw":  "Ideal",
    "cond.noNow":     "Not sailable",
    "cond.medium_fw": "Marginal",

    // Alerts
    "alert.title":       "Wind alerts",
    "alert.basedOn":     "Based on your",
    "alert.and":         "and",
    "alert.none":        "No active alerts for the next 7 days with your gear.",
    "alert.noneHint":    "Try a larger kite or adjust your weight.",
    "alert.pushTitle":   "Push notifications",
    "alert.pushEnable":  "Enable notifications",
    "alert.pushEnabled": "Notifications active",
    "alert.pushBlocked": "Blocked by browser",
    "alert.pushFuture":  "Coming soon: push and email notifications.",
    "alert.pushConsole": "Alerts are also logged to the browser console.",
    "alert.typeNow":     "Now",
    "alert.typeNext":    "Upcoming",
    "alert.typeAdv":     "Advance",
    "alert.typeEnd":     "Ending",
    "alert.priHigh":     "high",
    "alert.priMed":      "medium",
    "alert.priLow":      "low",

    // Model comparison
    "models.title":      "Weather model comparison",
    "models.loading":    "Loading…",
    "models.noData":     "No data",
    "models.consensus":  "Consensus",
    "models.confidence": "% confidence",
    "models.ofModels":   "models",
    "models.noForecast": "No forecast data available. Check your connection.",

    // Map
    "map.peak":   "Today's peak",
    "map.sports": "Sports",
  },
} as const;

export type TranslationKey = keyof typeof translations.es;

export function createT(lang: Lang) {
  return function t(key: TranslationKey): string {
    return (translations[lang] as Record<string, string>)[key] ?? (translations.es as Record<string, string>)[key] ?? key;
  };
}
