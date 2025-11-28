import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface WindFilterProps {
  value: number;
  onChange: (value: number) => void;
}

const WindFilter = ({ value, onChange }: WindFilterProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Filter className="w-4 h-4 text-primary" />
        <span>Filtrar por intensidad:</span>
      </div>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="w-full sm:w-[180px] bg-secondary border-border">
          <SelectValue placeholder="Seleccionar..." />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="0">Mostrar todos</SelectItem>
          <SelectItem value="10">+10 nudos</SelectItem>
          <SelectItem value="15">+15 nudos</SelectItem>
          <SelectItem value="20">+20 nudos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default WindFilter;
