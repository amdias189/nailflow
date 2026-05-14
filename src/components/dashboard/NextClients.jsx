import { Clock, User } from "lucide-react";

export default function NextClients({ appointments }) {
  if (!appointments || appointments.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-3">Próximos Clientes</h3>
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum agendamento para hoje ✨
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-3">Próximos Clientes</h3>
      <div className="space-y-3">
        {appointments.map((apt) => (
          <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{apt.client_name}</p>
              <p className="text-xs text-muted-foreground">{apt.service}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {apt.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}