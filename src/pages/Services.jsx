import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNailPro } from "@/lib/useNailPro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Scissors, Clock, DollarSign } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function ServiceForm({ open, onClose, service, nailProId, onSave }) {
  const [form, setForm] = useState(
    service
      ? { name: service.name, description: service.description || "", price: service.price, duration: service.duration, active: service.active }
      : { name: "", description: "", price: "", duration: 60, active: true }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, price: parseFloat(form.price), duration: parseInt(form.duration), nail_pro_id: nailProId });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{service ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome do serviço *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Manicure, Nail Art..." required className="mt-1" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descreva o serviço..." rows={2} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0,00" required className="mt-1" />
            </div>
            <div>
              <Label>Duração (min) *</Label>
              <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required className="mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, active: !form.active })}
              className={cn("w-10 h-6 rounded-full transition-all relative", form.active ? "bg-primary" : "bg-muted")}
            >
              <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all", form.active ? "left-5" : "left-1")} />
            </button>
            <Label className="cursor-pointer" onClick={() => setForm({ ...form, active: !form.active })}>
              {form.active ? "Ativo" : "Inativo"}
            </Label>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Services() {
  const { nailPro } = useNailPro();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: services = [] } = useQuery({
    queryKey: ["services", nailPro?.id],
    queryFn: () => base44.entities.Service.filter({ nail_pro_id: nailPro.id }, "name", 100),
    enabled: !!nailPro?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Service.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["services"] }); toast.success("Serviço criado!"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Service.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["services"] }); toast.success("Serviço atualizado!"); },
  });

  const toggleActive = (service) => {
    updateMutation.mutate({ id: service.id, data: { active: !service.active } });
  };

  const handleSave = (data) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const active = services.filter((s) => s.active);
  const inactive = services.filter((s) => !s.active);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-semibold text-foreground">Serviços</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} size="sm" className="bg-primary hover:bg-primary/90 rounded-xl gap-1.5">
          <Plus className="w-4 h-4" /> Novo
        </Button>
      </div>

      {services.length === 0 ? (
        <EmptyState icon={Scissors} title="Nenhum serviço" description="Cadastre seus serviços para aparecer na agenda pública" />
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ativos</p>
              <div className="space-y-2">
                {active.map((s) => (
                  <div key={s.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Scissors className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{s.name}</p>
                      {s.description && <p className="text-xs text-muted-foreground truncate">{s.description}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                          <DollarSign className="w-3 h-3" /> R$ {s.price?.toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" /> {s.duration}min
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditing(s); setFormOpen(true); }} className="p-2 rounded-lg hover:bg-accent transition-colors">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => toggleActive(s)} className={cn("w-9 h-5 rounded-full transition-all relative", s.active ? "bg-primary" : "bg-muted")}>
                        <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all", s.active ? "left-4" : "left-0.5")} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inactive.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Inativos</p>
              <div className="space-y-2">
                {inactive.map((s) => (
                  <div key={s.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center gap-3 opacity-50">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Scissors className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{s.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">R$ {s.price?.toFixed(2)} · {s.duration}min</span>
                      </div>
                    </div>
                    <button onClick={() => toggleActive(s)} className={cn("w-9 h-5 rounded-full transition-all relative", s.active ? "bg-primary" : "bg-muted")}>
                      <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all", s.active ? "left-4" : "left-0.5")} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ServiceForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} service={editing} nailProId={nailPro?.id} onSave={handleSave} />
    </div>
  );
}