import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNailPro } from "@/lib/useNailPro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, User, MessageCircle, ChevronRight, Pencil, Trash2, Phone, Mail } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

function ClientForm({ open, onClose, client, nailProId, onSave }) {
  const [form, setForm] = useState(client ? { name: client.name, whatsapp: client.whatsapp || "", email: client.email || "", notes: client.notes || "" } : { name: "", whatsapp: "", email: "", notes: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, nail_pro_id: nailProId });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{client ? "Editar Cliente" : "Nova Cliente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" required className="mt-1" />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(11) 99999-9999" className="mt-1" />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" className="mt-1" />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Alergias, preferências..." rows={2} className="mt-1" />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">{client ? "Salvar" : "Cadastrar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Clients() {
  const { nailPro } = useNailPro();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", nailPro?.id],
    queryFn: () => base44.entities.Client.filter({ nail_pro_id: nailPro.id }, "name", 500),
    enabled: !!nailPro?.id,
  });

  const { data: allAppointments = [] } = useQuery({
    queryKey: ["all-appointments", nailPro?.id],
    queryFn: () => base44.entities.Appointment.filter({ nail_pro_id: nailPro.id }, "-date", 500),
    enabled: !!nailPro?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["clients"] }); toast.success("Cliente cadastrada!"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["clients"] }); toast.success("Cliente atualizada!"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["clients"] }); setSelected(null); toast.success("Removida!"); },
  });

  const handleSave = (data) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
    setFormOpen(false);
    setEditing(null);
  };

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const getHistory = (clientId) => allAppointments.filter((a) => a.client_id === clientId).sort((a, b) => b.date.localeCompare(a.date));
  const getStats = (clientId) => {
    const history = allAppointments.filter((a) => a.client_id === clientId && a.status !== "cancelado");
    const total = history.reduce((s, a) => s + (a.price || 0), 0);
    return { count: history.length, total };
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-semibold text-foreground">Clientes</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} size="sm" className="bg-primary hover:bg-primary/90 rounded-xl gap-1.5">
          <Plus className="w-4 h-4" /> Nova
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl bg-card" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={User} title="Nenhuma cliente" description="Cadastre suas clientes para gerenciar melhor" />
      ) : (
        <div className="space-y-2">
          {filtered.map((client) => {
            const stats = getStats(client.id);
            return (
              <div key={client.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm cursor-pointer hover:border-primary/30 transition-all" onClick={() => setSelected(client)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{client.name[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.count} atend. · R$ {stats.total.toFixed(0)} no total
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {client.whatsapp && (
                      <a href={`https://wa.me/${client.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 rounded-lg hover:bg-accent transition-colors">
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                      </a>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ClientForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} client={editing} nailProId={nailPro?.id} onSave={handleSave} />

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selected && (() => {
            const stats = getStats(selected.id);
            const history = getHistory(selected.id);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-heading">{selected.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-accent/40 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-foreground">{stats.count}</p>
                      <p className="text-xs text-muted-foreground">Atendimentos</p>
                    </div>
                    <div className="bg-accent/40 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-primary">R$ {stats.total.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Total gasto</p>
                    </div>
                  </div>

                  {(selected.whatsapp || selected.email) && (
                    <div className="space-y-1.5">
                      {selected.whatsapp && (
                        <a href={`https://wa.me/${selected.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-emerald-700 hover:underline">
                          <MessageCircle className="w-4 h-4" />{selected.whatsapp}
                        </a>
                      )}
                      {selected.email && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />{selected.email}
                        </p>
                      )}
                    </div>
                  )}

                  {selected.notes && (
                    <div className="bg-accent/40 rounded-xl p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
                      <p className="text-sm text-foreground">{selected.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { setSelected(null); setEditing(selected); setFormOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(selected.id)}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Histórico</h3>
                    {history.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum atendimento registrado</p>
                    ) : (
                      <div className="space-y-2">
                        {history.slice(0, 10).map((apt) => (
                          <div key={apt.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
                            <div>
                              <p className="text-sm font-medium text-foreground">{apt.service_name}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(apt.date + "T12:00"), "d MMM yyyy", { locale: ptBR })} · {apt.time}</p>
                            </div>
                            <div className="text-right">
                              {apt.price > 0 && <p className="text-sm font-semibold text-foreground">R$ {apt.price.toFixed(2)}</p>}
                              <StatusBadge status={apt.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}