import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SpotSelector from "@/components/SpotSelector";
import SpotMap from "@/components/SpotMap";
import DecisionWidget from "@/components/DecisionWidget";
import ModelComparison from "@/components/ModelComparison";
import HourlyChart from "@/components/HourlyChart";
import Planner from "@/components/Planner";
import AlertFeed from "@/components/AlertFeed";
import WindLegend from "@/components/WindLegend";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSpot } from "@/hooks/useSpot";
import { useForecast, getPrimaryForecast } from "@/hooks/useForecast";
import { getDirectionName } from "@/data/stations";
import { Map, Compass, CalendarDays, Bell, Wifi, WifiOff, Loader, ExternalLink } from "lucide-react";

type Tab = "mapa" | "decidir" | "planificar" | "alertas";

const TABS: { id: Tab; label: string; icon: typeof Map }[] = [
  { id: "mapa",       label: "Mapa",       icon: Map          },
  { id: "decidir",    label: "¿Navego?",   icon: Compass      },
  { id: "planificar", label: "Planificar", icon: CalendarDays },
  { id: "alertas",    label: "Alertas",    icon: Bell         },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("decidir");

  const { profile, setProfile } = useUserProfile();
  const { spot, setSpot }       = useSpot();
  const windData                = useForecast(spot);
  const primaryForecast         = getPrimaryForecast(windData);
  const todayForecast           = primaryForecast[0] ?? null;

  const cw = windData.currentWind;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-ocean">
      <Header />

      {/* ── Selector de spot ──────────────────────────────── */}
      <div className="border-b border-border bg-card/30 px-4 py-3">
        <div className="container mx-auto max-w-2xl">
          <SpotSelector spot={spot} onSelect={(s) => setSpot(s)} />
        </div>
      </div>

      {/* ── Barra de estado de datos ───────────────────────── */}
      <div className="bg-secondary/20 border-b border-border/50 px-4 py-1.5">
        <div className="container mx-auto flex items-center gap-2 text-xs text-muted-foreground">
          {windData.loading ? (
            <>
              <Loader className="w-3 h-3 animate-spin" />
              <span>Consultando modelos meteorológicos…</span>
            </>
          ) : windData.isReal ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Datos reales</span>
              <span>· GFS · ECMWF · ICON via Open-Meteo</span>
              {cw && (
                <span className="ml-auto tabular-nums">
                  Ahora: {cw.speed} kn · {getDirectionName(cw.direction)}
                  {cw.gust > 0 && ` · ráf. ${cw.gust} kn`}
                </span>
              )}
            </>
          ) : windData.error ? (
            <>
              <WifiOff className="w-3 h-3 text-red-400" />
              <span className="text-red-400 font-medium">Sin conexión</span>
              <span>· {windData.error}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  flex items-center gap-1.5 px-4 py-3 text-sm font-medium
                  border-b-2 transition-colors whitespace-nowrap
                  ${activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"}
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">

        {/* ════════════════════════════════════════════════
            TAB: MAPA
        ════════════════════════════════════════════════ */}
        {activeTab === "mapa" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">{spot.flag} {spot.name}</h2>
                  <p className="text-muted-foreground text-sm mt-0.5">{spot.typicalWind}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{spot.bestMonths}</div>
                  <div>{spot.sport.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" · ")}</div>
                </div>
              </div>

              <SpotMap spot={spot} currentWind={cw} />
              <WindLegend />
            </div>

            {/* Panel lateral derecho */}
            <div className="space-y-4">
              {/* Condiciones ahora */}
              <div className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Condiciones ahora
                </h3>
                {windData.loading ? (
                  <div className="text-sm text-muted-foreground animate-pulse">Cargando…</div>
                ) : cw ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Velocidad</span>
                      <span className="font-bold text-primary">{cw.speed} kn</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Dirección</span>
                      <span className="font-semibold">{getDirectionName(cw.direction)} ({cw.direction}°)</span>
                    </div>
                    {cw.gust > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Ráfagas</span>
                        <span className="font-semibold text-yellow-400">{cw.gust} kn</span>
                      </div>
                    )}
                    {todayForecast && (
                      <>
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="text-muted-foreground text-sm">Pico hoy</span>
                          <span className="font-semibold text-accent">{todayForecast.maxWind} kn</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Hora pico</span>
                          <span className="font-semibold">{todayForecast.peakHour}:00</span>
                        </div>
                      </>
                    )}
                    <div className="pt-2 text-xs text-muted-foreground/60">
                      Fuente: Open-Meteo GFS · {cw.updatedAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {windData.error ? "Sin datos de viento disponibles." : "Esperando datos…"}
                  </div>
                )}
              </div>

              {/* Info del spot */}
              <div className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Info del spot
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Región</span>
                    <span className="font-medium text-right">{spot.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mejor época</span>
                    <span className="font-medium">{spot.bestMonths}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coordenadas</span>
                    <span className="font-mono text-xs">{spot.lat.toFixed(3)}, {spot.lng.toFixed(3)}</span>
                  </div>
                  {spot.hasAnemometer && (
                    <div className="text-xs text-emerald-400 pt-1">
                      ✓ Observaciones meteorológicas disponibles
                    </div>
                  )}
                </div>

                {/* Links externos */}
                <div className="mt-4 pt-4 border-t border-border space-y-1.5">
                  {spot.windguruId && (
                    <a
                      href={`https://www.windguru.cz/${spot.windguruId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Windguru
                    </a>
                  )}
                  <a
                    href={`https://www.windy.com/?wind,${spot.lat.toFixed(2)},${spot.lng.toFixed(2)},10`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver en Windy
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: ¿NAVEGO?
        ════════════════════════════════════════════════ */}
        {activeTab === "decidir" && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{spot.flag}</span>
              <span className="font-medium text-foreground">{spot.name}</span>
              <span>·</span>
              <span>{spot.typicalWind}</span>
            </div>

            <DecisionWidget
              profile={profile}
              onProfileChange={setProfile}
              currentWind={cw}
              todayForecast={todayForecast}
              loading={windData.loading}
            />

            {windData.isReal && (
              <HourlyChart models={windData.models} profile={profile} />
            )}

            <ModelComparison
              models={windData.models}
              profile={profile}
              loading={windData.loading}
              spot={spot}
            />
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: PLANIFICADOR
        ════════════════════════════════════════════════ */}
        {activeTab === "planificar" && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div>
              <h2 className="text-xl font-bold">Planificador — {spot.flag} {spot.name}</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {windData.isReal
                  ? "Pronóstico real (GFS · ECMWF · ICON) · 7 días"
                  : windData.loading
                  ? "Cargando pronóstico…"
                  : "Sin datos de pronóstico disponibles para este spot"}
              </p>
            </div>
            {primaryForecast.length > 0
              ? <Planner profile={profile} forecast={primaryForecast} />
              : !windData.loading && (
                <div className="bg-gradient-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
                  No hay datos de pronóstico disponibles. Verificá tu conexión.
                </div>
              )
            }
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: ALERTAS
        ════════════════════════════════════════════════ */}
        {activeTab === "alertas" && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div>
              <h2 className="text-xl font-bold">Alertas — {spot.flag} {spot.name}</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Notificaciones basadas en tu perfil y el pronóstico del spot.
              </p>
            </div>
            {primaryForecast.length > 0
              ? <AlertFeed profile={profile} forecast={primaryForecast} />
              : !windData.loading && (
                <div className="bg-gradient-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
                  No hay datos de pronóstico disponibles para generar alertas.
                </div>
              )
            }
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
