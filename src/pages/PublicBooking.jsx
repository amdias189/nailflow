import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAvailableSlots } from "@/lib/availability";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ChevronLeft, ChevronRight, Clock, Check, MapPin, Phone, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PublicBooking() {
  const { slug } = useParams();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [clientInfo, setClientInfo] = useState({ name: "", whatsapp: "" });
  const [success, setSuccess] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const { data: nailPro, isLoading: loadingPro } = useQuery({
    queryKey: ["public-nailpro", slug],
    queryFn: () => base44.entities.NailPro.filter({ slug }, "-created_date", 1).then((r) => r[0] || null),
    enabled: !!slug,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["public-services", nailPro?.id],
    queryFn: () => base44.entities.Service.filter({ nail_pro_id: nailPro.id, active: true }, "name", 50),
    enabled: !!nailPro?.id,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["public-appointments", nailPro?.id],
    queryFn: () => base44.entities.Appointment.filter({ nail_pro_id: nailPro.id }, "-date", 500),
    enabled: !!nailPro?.id,
  });

  const { data: blockedTimes = [] } = useQuery({
    queryKey: ["public-blocked", nailPro?.id],
    queryFn: () => base44.entities.BlockedTime.filter({ nail_pro_id: nailPro.id }, "-date", 200),
    enabled: !!nailPro?.id,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: () => setSuccess(true),
  });

  const createClientMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
  });

  // Generate week days starting from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = addDays(today, weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const availableSlots = selectedDate && selectedService && nailPro
    ? getAvailableSlots({
        nailPro,
        appointments,
        blockedTimes,
        date: format(selectedDate, "yyyy-MM-dd"),
        duration: selectedService.duration,
      })
    : [];

  const handleConfirm = async () => {
    if (!clientInfo.name || !selectedDate || !selectedTime || !selectedService || !nailPro) return;

    // Try to find or create client
    const existingClients = await base44.entities.Client.filter({ nail_pro_id: nailPro.id, whatsapp: clientInfo.whatsapp });
    let clientId = existingClients[0]?.id;

    if (!clientId && clientInfo.name) {
      const newClient = await createClientMutation.mutateAsync({
        nail_pro_id: nailPro.id,
        name: clientInfo.name,
        whatsapp: clientInfo.whatsapp,
      });
      clientId = newClient.id;
    }

    await createAppointmentMutation.mutateAsync({
      nail_pro_id: nailPro.id,
      client_name: clientInfo.name,
      client_whatsapp: clientInfo.whatsapp,
      client_id: clientId || "",
      service_id: selectedService.id,
      service_name: selectedService.name,
      price: selectedService.price,
      duration: selectedService.duration,
      date: format(selectedDate, "yyyy-MM-dd"),
      time: selectedTime,
      status: "pendente",
      booked_online: true,
    });
  };

  if (loadingPro) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!nailPro) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-heading font-semibold text-foreground">Perfil não encontrado</h1>
          <p className="text-sm text-muted-foreground mt-1">O link pode estar incorreto.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Agendado! 🎉</h1>
          <p className="text-muted-foreground mb-6">
            Seu horário foi solicitado. Aguarde a confirmação de <strong>{nailPro.business_name}</strong>.
          </p>
          <div className="bg-accent/50 rounded-2xl p-4 text-left space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Scissors className="w-4 h-4 text-primary" />
              <span className="font-medium">{selectedService?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span>{format(selectedDate, "d 'de' MMMM", { locale: ptBR })} às {selectedTime}</span>
            </div>
          </div>
          {nailPro.whatsapp && (
            <a
              href={`https://wa.me/${nailPro.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Acabei de agendar via NailFlow: ${selectedService?.name} em ${format(selectedDate, "d/MM")} às ${selectedTime}. Nome: ${clientInfo.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              Confirmar pelo WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-heading font-bold text-foreground">{nailPro.business_name}</h1>
        </div>
        {nailPro.city && (
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" /> {nailPro.city}
          </p>
        )}
        {nailPro.bio && <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">{nailPro.bio}</p>}
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 justify-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all", step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 3 && <div className={cn("w-10 h-0.5", step > s ? "bg-primary" : "bg-border")} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground px-2">
          <span>Serviço</span>
          <span className="ml-8">Data e hora</span>
          <span>Seus dados</span>
        </div>

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Escolha o serviço</h2>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum serviço disponível no momento.</p>
            ) : (
              services.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => { setSelectedService(svc); setStep(2); }}
                  className="w-full bg-card rounded-2xl p-4 border border-border shadow-sm text-left hover:border-primary/40 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Scissors className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{svc.name}</p>
                      {svc.description && <p className="text-xs text-muted-foreground">{svc.description}</p>}
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs font-bold text-primary">R$ {svc.price?.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{svc.duration}min</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Step 2: Date and Time */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(1)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <h2 className="text-base font-semibold text-foreground">
                {selectedService?.name} · R$ {selectedService?.price?.toFixed(2)}
              </h2>
            </div>

            {/* Week navigation */}
            <div className="flex items-center justify-between bg-card rounded-2xl p-3 border border-border">
              <button onClick={() => setWeekOffset((p) => Math.max(0, p - 1))} disabled={weekOffset === 0} className="p-1.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="text-xs font-medium text-muted-foreground">
                {format(weekStart, "d MMM", { locale: ptBR })} – {format(addDays(weekStart, 6), "d MMM", { locale: ptBR })}
              </p>
              <button onClick={() => setWeekOffset((p) => p + 1)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day Selector */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => {
                const dayStr = format(day, "yyyy-MM-dd");
                const dayOfWeek = day.getDay();
                const isAvailable = nailPro.working_days?.includes(dayOfWeek);
                const isPast = day < today;
                const isSelected = selectedDate && format(selectedDate, "yyyy-MM-dd") === dayStr;

                return (
                  <button
                    key={dayStr}
                    onClick={() => { if (!isPast && isAvailable) { setSelectedDate(day); setSelectedTime(null); } }}
                    disabled={isPast || !isAvailable}
                    className={cn(
                      "flex flex-col items-center py-2.5 rounded-xl transition-all",
                      isSelected ? "bg-primary text-primary-foreground" :
                      isPast || !isAvailable ? "opacity-30 cursor-not-allowed" :
                      "bg-card border border-border hover:border-primary/40"
                    )}
                  >
                    <span className="text-[10px] font-medium">{format(day, "EEE", { locale: ptBR })}</span>
                    <span className="text-sm font-bold mt-0.5">{format(day, "d")}</span>
                  </button>
                );
              })}
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Horários disponíveis – {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                </h3>
                {availableSlots.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">Nenhum horário disponível neste dia.</p>
                    <p className="text-xs text-muted-foreground mt-1">Tente outro dia.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={cn(
                          "py-2.5 rounded-xl text-sm font-medium border transition-all",
                          selectedTime === slot ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedDate && selectedTime && (
              <Button onClick={() => setStep(3)} className="w-full bg-primary hover:bg-primary/90 rounded-xl">
                Continuar
              </Button>
            )}
          </div>
        )}

        {/* Step 3: Client Info */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(2)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <h2 className="text-base font-semibold text-foreground">Seus dados</h2>
            </div>

            {/* Summary */}
            <div className="bg-accent/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Scissors className="w-4 h-4 text-primary" />
                <span className="font-medium">{selectedService?.name}</span>
                <span className="ml-auto text-primary font-semibold">R$ {selectedService?.price?.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{format(selectedDate, "d 'de' MMMM", { locale: ptBR })} às {selectedTime}</span>
              </div>
            </div>

            <div>
              <Label>Seu nome *</Label>
              <Input value={clientInfo.name} onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })} placeholder="Nome completo" required className="mt-1" />
            </div>
            <div>
              <Label>WhatsApp *</Label>
              <Input value={clientInfo.whatsapp} onChange={(e) => setClientInfo({ ...clientInfo, whatsapp: e.target.value })} placeholder="(11) 99999-9999" required className="mt-1" />
            </div>

            <Button
              onClick={handleConfirm}
              disabled={!clientInfo.name || !clientInfo.whatsapp || createAppointmentMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 rounded-xl py-3 text-base"
            >
              {createAppointmentMutation.isPending ? "Confirmando..." : "Confirmar Agendamento ✨"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Ao agendar, você concorda com os termos de uso. O agendamento fica pendente até confirmação.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 mt-8">
        <p className="text-xs text-muted-foreground">Agendamento via <span className="font-semibold text-primary">NailFlow</span></p>
      </div>
    </div>
  );
}