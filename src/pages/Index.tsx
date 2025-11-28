import { useState } from "react";
import Header from "@/components/Header";
import WindMap from "@/components/WindMap";
import StationPanel from "@/components/StationPanel";
import WindFilter from "@/components/WindFilter";
import WindLegend from "@/components/WindLegend";
import Footer from "@/components/Footer";
import { mockStations, WindStation } from "@/data/stations";

const Index = () => {
  const [selectedStation, setSelectedStation] = useState<WindStation | null>(null);
  const [minWind, setMinWind] = useState(0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-ocean">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Mapa en tiempo real</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Los marcadores muestran velocidad en nudos. El color indica intensidad.
                </p>
              </div>
            </div>
            <WindMap
              stations={mockStations}
              onStationSelect={setSelectedStation}
              selectedStation={selectedStation}
              minWind={minWind}
            />
            <WindLegend />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <WindFilter value={minWind} onChange={setMinWind} />
            <StationPanel
              station={selectedStation}
              onClose={() => setSelectedStation(null)}
            />

            {/* Stats Card */}
            <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-card">
              <h3 className="text-lg font-semibold mb-4">Resumen del lago</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Estaciones activas</span>
                  <span className="font-semibold">{mockStations.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Viento máximo</span>
                  <span className="font-semibold text-wind-extreme">
                    {Math.max(...mockStations.map((s) => s.windSpeed))} kn
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Promedio</span>
                  <span className="font-semibold text-primary">
                    {Math.round(
                      mockStations.reduce((acc, s) => acc + s.windSpeed, 0) / mockStations.length
                    )}{" "}
                    kn
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Spots con +15 kn</span>
                  <span className="font-semibold text-accent">
                    {mockStations.filter((s) => s.windSpeed >= 15).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
