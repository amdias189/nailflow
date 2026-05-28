import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, ArrowLeft, Check, Clock, Calendar, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DAYS = [
  { label: "Dom", value: 0 },
  { label: "Seg", value: 1 },
  { label: "Ter", value: 2 },
  { label: "Qua", value: 3 },
  { label: "Qui", value: 4 },
  { label: "Sex", value: 5 },
  { label: "Sáb", value: 6 },
];

const DEFAULT_SERVICES = [
  { name: "Manicure", price: 35, duration: 45 },
  { name: "Pedicure", price: 45, duration: 60 },
  { name: "Manicure + Pedicure", price: 70, duration: 90 },
  { name: "Esmaltação em Gel", price: 60, duration: 60 },
  { name: "Alongamento", price: 180, duration: 120 },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    business_name: "",
    owner_name: "",
    whatsapp: "",
    city: "",
    slug: "",
  });

  const [schedule, setSchedule] = useState({
    working_days: [1, 2, 3, 4, 5],
    work_start: "08:00",
    work_end: "18:00",
    slot_interval: 30,
  });

  const [services, setServices] = useState(
    DEFAULT_SERVICES.map((s) => ({ ...s, active: true, selected: true }))
  );

  const [customService, setCustomService] = useState({ name: "", price: "", duration: 60 });

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleBusinessNameChange = (value) => {
    setProfile((prev) => ({
      ...prev,
      business_name: value,
      slug: generateSlug(value),
    }));
  };

  const toggleDay = (day) => {
    setSchedule((prev) => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter((d) => d !== day)
        : [...prev.working_days, day],
    }));
  };

  const toggleService = (idx) => {
    setServices((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, selected: !s.selected } : s))
    );
  };

  const updateService = (idx, field, value) => {
    setServices((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const addCustomService = () => {
    if (!customService.name || !customService.price) return;
    setServices((prev) => [
      ...prev,
      { ...customService, active: true, selected: true, price: parseFloat(customService.price) },
    ]);
    setCustomService({ name: "", price: "", duration: 60 });
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // Cria o perfil NailPro
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      const nailPro = await base44.entities.NailPro.create({
        user_email: user.email,
        ...profile,
        ...schedule,
        onboarding_done: true,
        subscription_status: "trial",
        subscription_plan: "free",
        trial_ends_at: trialEnd.toISOString().split("T")[0],
      });

      // Cria os serviços selecionados
      const selectedServices = services.filter((s) => s.selected);
      await Promise.all(
        selectedServices.map((s) =>
          base44.entities.Service.create({
            nail_pro_id: nailPro.id,
            name: s.name,
            price: parseFloat(s.price),
            duration: parseInt(s.duration),
            active: true,
          })
        )
      );

      queryClient.invalidateQueries();
      toast.success("Perfil configurado com sucesso!");
      navigate("/");
    } catch (e) {
      toast.error("Erro ao salvar. Tente novamente.");
    }
    setLoading(false);
  };

  const steps = [
    { num: 1, label: "Perfil", icon: Sparkles },
    { num: 2, label: "Horários", icon: Clock },
    { num: 3, label: "Serviços", icon: Scissors },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary mb-3">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Bem-vinda ao NailFlow!</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure seu negócio em 3 etapas</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                step === s.num ? "bg-primary text-primary-foreground" :
                step > s.num ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
              )}>
                {step > s.num ? <Check className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                {s.label}
              </div>
              {i < steps.length - 1 && <div className={cn("w-8 h-px", step > s.num ? "bg-emerald-400" : "bg-border")} />}
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">

          {/* Step 1: Perfil */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-heading font-semibold text-foreground mb-1">Seu Negócio</h2>
                <p className="text-sm text-muted-foreground">Como suas clientes vão te encontrar?</p>
              </div>
              <div>
                <Label>Nome do negócio *</Label>
                <Input
                  placeholder="Ex: Studio da Ana, Nail Art by Mari..."
                  value={profile.business_name}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Seu nome</Label>
                <Input
                  placeholder="Seu nome completo"
                  value={profile.owner_name}
                  onChange={(e) => setProfile({ ...profile, owner_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={profile.whatsapp}
                  onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  placeholder="Ex: São Paulo - SP"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="mt-1"
                />
              </div>
              {profile.slug && (
                <div className="bg-accent/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Seu link de agendamento:</p>
                  <p className="text-sm font-medium text-primary mt-0.5">
                    nailflow.app/agendar/<span className="font-bold">{profile.slug}</span>
                  </p>
                  <Input
                    value={profile.slug}
                    onChange={(e) => setProfile({ ...profile, slug: generateSlug(e.target.value) })}
                    className="mt-2 text-xs h-8"
                    placeholder="meu-slug-personalizado"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Horários */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-heading font-semibold text-foreground mb-1">Seus Horários</h2>
                <p className="text-sm text-muted-foreground">Quando você atende?</p>
              </div>
              <div>
                <Label className="mb-2 block">Dias de atendimento</Label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={cn(
                        "w-12 h-12 rounded-xl text-sm font-medium transition-all border",
                        schedule.working_days.includes(d.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:border-primary/50"
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Início</Label>
                  <Input
                    type="time"
                    value={schedule.work_start}
                    onChange={(e) => setSchedule({ ...schedule, work_start: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Fim</Label>
                  <Input
                    type="time"
                    value={schedule.work_end}
                    onChange={(e) => setSchedule({ ...schedule, work_end: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Intervalo entre horários</Label>
                <div className="flex gap-2 mt-1">
                  {[15, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSchedule({ ...schedule, slot_interval: m })}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-sm font-medium border transition-all",
                        schedule.slot_interval === m
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground"
                      )}
                    >
                      {m}min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Serviços */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-heading font-semibold text-foreground mb-1">Seus Serviços</h2>
                <p className="text-sm text-muted-foreground">Selecione e ajuste os valores</p>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {services.map((s, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-xl border p-3 transition-all",
                      s.selected ? "border-primary/40 bg-accent/30" : "border-border bg-card opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => toggleService(idx)}
                        className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                          s.selected ? "bg-primary border-primary" : "border-border"
                        )}
                      >
                        {s.selected && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <span className="text-sm font-medium text-foreground">{s.name}</span>
                    </div>
                    {s.selected && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <Label className="text-xs">Valor (R$)</Label>
                          <Input
                            type="number"
                            value={s.price}
                            onChange={(e) => updateService(idx, "price", e.target.value)}
                            className="h-8 text-sm mt-0.5"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Duração (min)</Label>
                          <Input
                            type="number"
                            value={s.duration}
                            onChange={(e) => updateService(idx, "duration", e.target.value)}
                            className="h-8 text-sm mt-0.5"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="border border-dashed border-border rounded-xl p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Adicionar serviço personalizado</p>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Nome"
                    value={customService.name}
                    onChange={(e) => setCustomService({ ...customService, name: e.target.value })}
                    className="h-8 text-sm col-span-1"
                  />
                  <Input
                    type="number"
                    placeholder="R$"
                    value={customService.price}
                    onChange={(e) => setCustomService({ ...customService, price: e.target.value })}
                    className="h-8 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="min"
                    value={customService.duration}
                    onChange={(e) => setCustomService({ ...customService, duration: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 rounded-lg"
                  onClick={addCustomService}
                >
                  + Adicionar
                </Button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setStep((s) => s - 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 rounded-xl"
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && !profile.business_name}
              >
                Próximo <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 rounded-xl"
                onClick={handleFinish}
                disabled={loading}
              >
                {loading ? "Salvando..." : "Começar a usar! ✨"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}