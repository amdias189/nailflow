import { cn } from "@/lib/utils";

const statusStyles = {
  confirmado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pendente: "bg-amber-50 text-amber-700 border-amber-200",
  cancelado: "bg-red-50 text-red-600 border-red-200",
  concluido: "bg-blue-50 text-blue-700 border-blue-200",
};

const statusLabels = {
  confirmado: "Confirmado",
  pendente: "Pendente",
  cancelado: "Cancelado",
  concluido: "Concluído",
};

export default function StatusBadge({ status }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      statusStyles[status] || "bg-muted text-muted-foreground border-border"
    )}>
      {statusLabels[status] || status}
    </span>
  );
}