import { useState, useEffect } from "react";
import { useNailPro } from "@/lib/useNailPro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, LogOut, ExternalLink, Copy, Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const DAYS = [
  { label: "Dom", value: 0 }, { label: "Seg", value: 1 }, { label: "Ter", value: 2 },
  { label: "Qua", value: 3 }, { label: "Qui", value: 4 }, { label: "Sex", value: 5 }, { label: "Sáb", value: 6 },
];

export default function Profile() {
  const { nailPro, updateNailPro } = useNailPro();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("profile");
  const [newBreak, setNewBreak] = useState({ start_time: "12:00", end_time: "13:00", reason: "" });

  const { data: recurringBlocks = [] } = useQuery({
    queryKey: ["recurring-blocks", nailPro?.id],
    queryFn: () => base44.entities.BlockedTime.filter({ nail_pro_id: nailPro.id, recurring: true }, "start_time", 50),
    enabled: !!nailPro?.id,
  });

  const addBlockMutation = useMutation({
    mutationFn: (data) => base44.entities.BlockedTime.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["recurring-blocks"] }); setNewBreak({ start_time: "12:00", end_time: "13:00", reason: "" }); toast.success("Intervalo adicionado!"); },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id) => base44.entities.BlockedTime.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["recurring-blocks"] }); toast.success("Intervalo removido!"); },
  });

  const handleAddBreak = () => {
    if (!newBreak.start_time || !newBreak.end_time) return;
    // Use a fixed reference date; recurring flag makes the date irrelevant for display
    addBlockMutation.mutate({
      nail_pro_id: nailPro.id,
      date: "2000-01-01",
      start_time: newBreak.start_time,
      end_time: newBreak.end_time,
      reason: newBreak.reason || "Intervalo",
      recurring: true,
    });
  };

  useEffect(() => {
    if (nailPro && !form) {
      setForm({
        business_name: nailPro.business_name || "",
        owner_name: nailPro.owner_name || "",
        whatsapp: nailPro.whatsapp || "",
        city: nailPro.city || "",
        bio: nailPro.bio || "",
        slug: nailPro.slug || "",
        working_days: nailPro.working_days || [1, 2, 3, 4, 5],
        work_start: nailPro.work_start || "08:00",
        work_end: nailPro.work_end || "18:00",
        slot_interval: nailPro.slot_interval || 30,
      });
    }
  }, [nailPro]);

  const handleSave = async () => {
    setSaving(true);
    await updateNailPro(form);
    toast.success("Perfil atualizado!");
    setSaving(false);
  };

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter((d) => d !== day)
        : [...prev.working_days, day],
    }));
  };

  const publicUrl = `${window.location.origin}/agendar/${nailPro?.slug}`;

  if (!form) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-semibold text-foreground">Perfil & Configurações</h1>
        <Button variant="outline" size="sm" className="rounded-xl text-destructive hover:text-destructive gap-1.5" onClick={() => base44.auth.logout()}>
          <LogOut className="w-4 h-4" /> Sair
        </Button>
      </div>

      {/* Public Link */}
      <div className="bg-accent/40 rounded-2xl p-4 border border-border">
        <p className="text-xs font-medium text-muted-foreground mb-2">Seu link de agendamento público</p>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-primary truncate flex-1">{publicUrl}</p>
          <button onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("Link copiado!"); }} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <Copy className="w-4 h-4 text-muted-foreground" />
          </button>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-accent transition-colors">
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {[{ k: "profile", l: "Perfil" }, { k: "schedule", l: "Horários" }, { k: "breaks", l: "Intervalos" }].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", tab === t.k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
          <div>
            <Label>Nome do negócio *</Label>
            <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Seu nome</Label>
            <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(11) 99999-9999" className="mt-1" />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="São Paulo - SP" className="mt-1" />
          </div>
          <div>
            <Label>Descrição / Bio</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Conte um pouco sobre você e seus serviços..." className="mt-1" />
          </div>
          <div>
            <Label>Slug (link personalizado)</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">/agendar/</span>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
            </div>
          </div>
        </div>
      )}

      {tab === "schedule" && (
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-5">
          <div>
            <Label className="mb-2 block">Dias de atendimento</Label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((d) => (
                <button key={d.value} type="button" onClick={() => toggleDay(d.value)} className={cn("w-12 h-12 rounded-xl text-sm font-medium transition-all border", form.working_days.includes(d.value) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border")}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Horário início</Label>
              <Input type="time" value={form.work_start} onChange={(e) => setForm({ ...form, work_start: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Horário fim</Label>
              <Input type="time" value={form.work_end} onChange={(e) => setForm({ ...form, work_end: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Intervalo entre horários</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              Define a grade de horários disponíveis. O tempo real de cada serviço é definido na duração do serviço.
            </p>
            <div className="flex gap-2 flex-wrap">
              {[15, 30, 45, 60, 90, 120].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, slot_interval: m })}
                  className={cn(
                    "py-2 px-3 rounded-xl text-sm font-medium border transition-all",
                    form.slot_interval === m
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {m}min
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Ou digite:</span>
              <Input
                type="number"
                min={5}
                max={480}
                step={5}
                placeholder="Ex: 75"
                value={[15, 30, 45, 60, 90, 120].includes(form.slot_interval) ? "" : form.slot_interval}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 5) setForm({ ...form, slot_interval: val });
                }}
                className="h-9 w-28"
              />
              <span className="text-xs text-muted-foreground">min</span>
              {!([15, 30, 45, 60, 90, 120].includes(form.slot_interval)) && (
                <span className="text-xs font-semibold text-primary">{form.slot_interval}min selecionado</span>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "breaks" && (
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Intervalos fixos semanais</p>
            <p className="text-xs text-muted-foreground mt-0.5">Esses horários serão bloqueados todos os dias automaticamente.</p>
          </div>

          {/* List */}
          {recurringBlocks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum intervalo cadastrado</p>
          ) : (
            <div className="space-y-2">
              {recurringBlocks.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-accent/40 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.start_time} – {b.end_time}</p>
                    {b.reason && <p className="text-xs text-muted-foreground">{b.reason}</p>}
                  </div>
                  <button
                    onClick={() => deleteBlockMutation.mutate(b.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new */}
          <div className="border border-dashed border-border rounded-xl p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Adicionar intervalo</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Início</Label>
                <Input type="time" value={newBreak.start_time} onChange={(e) => setNewBreak({ ...newBreak, start_time: e.target.value })} className="mt-1 h-9" />
              </div>
              <div>
                <Label className="text-xs">Fim</Label>
                <Input type="time" value={newBreak.end_time} onChange={(e) => setNewBreak({ ...newBreak, end_time: e.target.value })} className="mt-1 h-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Motivo (opcional)</Label>
              <Input value={newBreak.reason} onChange={(e) => setNewBreak({ ...newBreak, reason: e.target.value })} placeholder="Ex: Almoço, Pausa..." className="mt-1 h-9" />
            </div>
            <Button onClick={handleAddBreak} disabled={addBlockMutation.isPending} variant="outline" className="w-full rounded-xl gap-1.5">
              <Plus className="w-4 h-4" /> Adicionar intervalo
            </Button>
          </div>
        </div>
      )}

      {tab !== "breaks" && (
        <Button onClick={handleSave} disabled={saving} className="w-full bg-primary hover:bg-primary/90 rounded-xl">
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      )}
    </div>
  );
}