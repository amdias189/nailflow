import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNailPro } from "@/lib/useNailPro";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2, Lock } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AppointmentFormModal from "@/components/agenda/AppointmentFormModal";
import BlockTimeModal from "@/components/agenda/BlockTimeModal";

export default function Agenda() {
  const { nailPro } = useNailPro();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("day");
  const [formOpen, setFormOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments", nailPro?.id],
    queryFn: () => base44.entities.Appointment.filter({ nail_pro_id: nailPro.id }, "-date", 500),
    enabled: !!nailPro?.id,
  });

  const { data: blockedTimes = [] } = useQuery({
    queryKey: ["blocked-times", nailPro?.id],
    queryFn: () => base44.entities.BlockedTime.filter({ nail_pro_id: nailPro.id }, "-date", 200),
    enabled: !!nailPro?.id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); toast.success("Atualizado!"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Appointment.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); toast.success("Removido!"); },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id) => base44.entities.BlockedTime.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["blocked-times"] }); },
  });

  const dayAppointments = appointments
    .filter((a) => a.date === dateStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const dayBlocked = blockedTimes.filter((b) => b.date === dateStr);

  const navigate = (dir) => {
    if (viewMode === "day") setSelectedDate((p) => dir === "next" ? addDays(p, 1) : subDays(p, 1));
    else if (viewMode === "week") setSelectedDate((p) => dir === "next" ? addWeeks(p, 1) : subWeeks(p, 1));
    else setSelectedDate((p) => {
      const d = new Date(p);
      d.setMonth(d.getMonth() + (dir === "next" ? 1 : -1));
      return d;
    });
  };

  const titleLabel = viewMode === "day"
    ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })
    : viewMode === "week"
    ? `${format(weekStart, "d MMM", { locale: ptBR })} – ${format(addDays(weekStart, 6), "d MMM", { locale: ptBR })}`
    : format(selectedDate, "MMMM yyyy", { locale: ptBR });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-semibold text-foreground">Agenda</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => setBlockOpen(true)}>
            <Lock className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Bloquear</span>
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-xl gap-1" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo</span>
          </Button>
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between bg-card rounded-2xl p-3 border border-border">
        <button onClick={() => navigate("prev")} className="p-2 rounded-xl hover:bg-accent transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-sm font-semibold text-foreground capitalize">{titleLabel}</p>
        <button onClick={() => navigate("next")} className="p-2 rounded-xl hover:bg-accent transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {["day", "week", "month"].map((v) => (
          <button key={v} onClick={() => setViewMode(v)} className={cn("flex-1 py-2 text-xs font-medium rounded-lg transition-all", viewMode === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
            {v === "day" ? "Dia" : v === "week" ? "Semana" : "Mês"}
          </button>
        ))}
      </div>

      {/* Day View */}
      {viewMode === "day" && (
        <div className="space-y-2">
          {dayBlocked.map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-3 bg-muted/60 rounded-xl border border-border">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">{b.start_time} – {b.end_time} · {b.reason || "Bloqueado"}</p>
              </div>
              <button onClick={() => deleteBlockMutation.mutate(b.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg">
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
          {dayAppointments.length === 0 && dayBlocked.length === 0 ? (
            <EmptyState icon={Plus} title="Nenhum agendamento" description="Toque em + para criar um agendamento" />
          ) : (
            dayAppointments.map((apt) => (
              <div key={apt.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-foreground">{apt.time}</span>
                      <StatusBadge status={apt.status} />
                      {apt.booked_online && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">Online</span>}
                    </div>
                    <p className="text-base font-semibold text-foreground">{apt.client_name}</p>
                    <p className="text-sm text-muted-foreground">{apt.service_name} · {apt.duration}min</p>
                    {apt.price > 0 && <p className="text-sm font-semibold text-primary mt-1">R$ {apt.price.toFixed(2)}</p>}
                    {apt.client_whatsapp && (
                      <a href={`https://wa.me/${apt.client_whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline mt-1 inline-block">
                        WhatsApp
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => { setEditing(apt); setFormOpen(true); }} className="p-2 rounded-lg hover:bg-accent transition-colors">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(apt.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
                {/* Quick status change */}
                <div className="flex gap-1.5 mt-3 pt-3 border-t border-border">
                  {["pendente", "confirmado", "concluido", "cancelado"].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateMutation.mutate({ id: apt.id, data: { status: s } })}
                      className={cn("flex-1 py-1 text-xs rounded-lg transition-all border", apt.status === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-accent")}
                    >
                      {s === "pendente" ? "Pend." : s === "confirmado" ? "Conf." : s === "concluido" ? "✓ Ok" : "✗ Cancel."}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Week View */}
      {viewMode === "week" && (
        <div className="space-y-2">
          {weekDays.map((day) => {
            const ds = format(day, "yyyy-MM-dd");
            const dayApts = appointments.filter((a) => a.date === ds).sort((a, b) => a.time.localeCompare(b.time));
            const isToday = ds === format(new Date(), "yyyy-MM-dd");
            return (
              <div key={ds} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className={cn("px-4 py-2.5 flex items-center justify-between border-b border-border", isToday ? "bg-primary/5" : "bg-muted/30")}>
                  <p className={cn("text-sm font-semibold capitalize", isToday ? "text-primary" : "text-foreground")}>
                    {format(day, "EEEE, d", { locale: ptBR })}
                  </p>
                  <span className="text-xs text-muted-foreground">{dayApts.length} agend.</span>
                </div>
                {dayApts.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-muted-foreground">Livre</div>
                ) : (
                  <div className="divide-y divide-border">
                    {dayApts.map((apt) => (
                      <div key={apt.id} className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-accent/40 transition-colors" onClick={() => { setSelectedDate(day); setViewMode("day"); }}>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-muted-foreground w-10">{apt.time}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{apt.client_name}</p>
                            <p className="text-xs text-muted-foreground">{apt.service_name}</p>
                          </div>
                        </div>
                        <StatusBadge status={apt.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Month View */}
      {viewMode === "month" && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
              <div key={i} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: monthStart.getDay() }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square border-b border-r border-border/40 bg-muted/20" />
            ))}
            {monthDays.map((day) => {
              const ds = format(day, "yyyy-MM-dd");
              const count = appointments.filter((a) => a.date === ds && a.status !== "cancelado").length;
              const isToday = ds === format(new Date(), "yyyy-MM-dd");
              const isSelected = ds === dateStr;
              return (
                <div
                  key={ds}
                  onClick={() => { setSelectedDate(day); setViewMode("day"); }}
                  className={cn("aspect-square border-b border-r border-border/40 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/40 transition-colors relative", isSelected && "bg-accent")}
                >
                  <span className={cn("text-sm font-medium", isToday ? "w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs" : "text-foreground")}>
                    {format(day, "d")}
                  </span>
                  {count > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: Math.min(count, 3) }, (_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AppointmentFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} appointment={editing} nailPro={nailPro} defaultDate={dateStr} onSaved={() => queryClient.invalidateQueries({ queryKey: ["appointments"] })} />
      <BlockTimeModal open={blockOpen} onClose={() => setBlockOpen(false)} nailProId={nailPro?.id} defaultDate={dateStr} onSaved={() => queryClient.invalidateQueries({ queryKey: ["blocked-times"] })} />
    </div>
  );
}