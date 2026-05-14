import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, Clock, Pencil, Trash2 } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import AppointmentForm from "@/components/agenda/AppointmentForm";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const hour = 7 + i;
  return `${hour.toString().padStart(2, "0")}:00`;
});

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("day");
  const [formOpen, setFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const queryClient = useQueryClient();

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments", dateStr, viewMode],
    queryFn: () => {
      if (viewMode === "day") {
        return base44.entities.Appointment.filter({ date: dateStr });
      }
      const start = format(weekStart, "yyyy-MM-dd");
      const end = format(addDays(weekStart, 6), "yyyy-MM-dd");
      return base44.entities.Appointment.filter({}, "-date", 200);
    },
  });

  const filteredAppointments = viewMode === "week"
    ? appointments.filter((a) => {
        const d = a.date;
        return d >= format(weekStart, "yyyy-MM-dd") && d <= format(addDays(weekStart, 6), "yyyy-MM-dd");
      })
    : appointments;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento criado!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento atualizado!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Appointment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento removido!");
    },
  });

  const handleSave = (data) => {
    if (editingAppointment) {
      updateMutation.mutate({ id: editingAppointment.id, data });
    } else {
      createMutation.mutate(data);
      // Also create a transaction for the revenue
      if (data.price > 0 && data.status !== "cancelado") {
        base44.entities.Transaction.create({
          type: "entrada",
          amount: data.price,
          description: `${data.service} - ${data.client_name}`,
          category: "servico",
          date: data.date,
          appointment_id: "",
        });
      }
    }
    setFormOpen(false);
    setEditingAppointment(null);
  };

  const handleEdit = (apt) => {
    setEditingAppointment(apt);
    setFormOpen(true);
  };

  const navigateDate = (direction) => {
    if (viewMode === "day") {
      setSelectedDate((prev) => direction === "next" ? addDays(prev, 1) : subDays(prev, 1));
    } else {
      setSelectedDate((prev) => direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1));
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-semibold text-foreground">Agenda</h1>
        <Button
          onClick={() => { setEditingAppointment(null); setFormOpen(true); }}
          size="sm"
          className="bg-primary hover:bg-primary/90 rounded-xl gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo</span>
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between bg-card rounded-2xl p-3 border border-border">
        <button onClick={() => navigateDate("prev")} className="p-2 rounded-xl hover:bg-accent transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {viewMode === "day"
              ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })
              : `${format(weekStart, "d MMM", { locale: ptBR })} - ${format(addDays(weekStart, 6), "d MMM", { locale: ptBR })}`}
          </p>
        </div>
        <button onClick={() => navigateDate("next")} className="p-2 rounded-xl hover:bg-accent transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 bg-muted rounded-xl p-1">
        <button
          onClick={() => setViewMode("day")}
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
            viewMode === "day" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          Diário
        </button>
        <button
          onClick={() => setViewMode("week")}
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
            viewMode === "week" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          Semanal
        </button>
      </div>

      {/* Day View */}
      {viewMode === "day" && (
        <div className="space-y-2">
          {filteredAppointments.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Nenhum agendamento"
              description="Toque no botão + para agendar uma cliente"
            />
          ) : (
            filteredAppointments
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((apt) => (
                <div
                  key={apt.id}
                  className="bg-card rounded-2xl p-4 border border-border shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">{apt.time}</span>
                        <StatusBadge status={apt.status} />
                      </div>
                      <p className="text-base font-medium text-foreground">{apt.client_name}</p>
                      <p className="text-sm text-muted-foreground">{apt.service}</p>
                      {apt.price > 0 && (
                        <p className="text-sm font-semibold text-primary mt-1">R$ {apt.price.toFixed(2)}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(apt)}
                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(apt.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* Week View */}
      {viewMode === "week" && (
        <div className="space-y-3">
          {weekDays.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayAppointments = filteredAppointments
              .filter((a) => a.date === dayStr)
              .sort((a, b) => a.time.localeCompare(b.time));
            const isToday = dayStr === format(new Date(), "yyyy-MM-dd");

            return (
              <div key={dayStr} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className={cn(
                  "px-4 py-2.5 border-b border-border",
                  isToday ? "bg-primary/5" : "bg-muted/50"
                )}>
                  <p className={cn("text-sm font-semibold", isToday ? "text-primary" : "text-foreground")}>
                    {format(day, "EEEE, d", { locale: ptBR })}
                  </p>
                </div>
                {dayAppointments.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">Livre</div>
                ) : (
                  <div className="divide-y divide-border">
                    {dayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleEdit(apt)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-muted-foreground w-12">{apt.time}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{apt.client_name}</p>
                            <p className="text-xs text-muted-foreground">{apt.service}</p>
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

      <AppointmentForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingAppointment(null); }}
        appointment={editingAppointment}
        selectedDate={dateStr}
        onSave={handleSave}
      />
    </div>
  );
}