const WindLegend = () => {
  const levels = [
    { label: "Suave", range: "< 10 kn", color: "hsl(199, 70%, 50%)" },
    { label: "Moderado", range: "10-14 kn", color: "hsl(174, 72%, 46%)" },
    { label: "Fuerte", range: "15-19 kn", color: "hsl(45, 93%, 55%)" },
    { label: "Extremo", range: "≥ 20 kn", color: "hsl(0, 84%, 60%)" },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h4 className="text-sm font-semibold mb-3">Intensidad del viento</h4>
      <div className="flex flex-wrap gap-3">
        {levels.map((level) => (
          <div key={level.label} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 border-foreground/20"
              style={{ backgroundColor: level.color }}
            />
            <div className="text-xs">
              <span className="font-medium">{level.label}</span>
              <span className="text-muted-foreground ml-1">({level.range})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WindLegend;
