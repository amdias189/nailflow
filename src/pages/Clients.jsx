import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, User, Phone, MessageCircle, Pencil, Trash2, ChevronRight } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import ClientForm from "@/components/clients/ClientForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "@/components/shared/StatusBadge";

export default function Clients() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("name", 500),
  });

  const { data: allAppointments = [] } = useQuery({
    queryKey: ["all-appointments"],
    queryFn: () => base44.entities.Appointment.list("-date", 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente cadastrada!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente atualizada!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente removida!");
    },
  });

  const handleSave = (data) => {
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
    } else {
      createMutation.mutate(data);
    }
    setFormOpen(false);
    setEditingClient(null);
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const getClientHistory = (clientId) => {
    return allAppointments
      .filter((a) => a.client_id === clientId)
      .sort((a, b) => b.date.localeCompare(a.date));
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-semibold text-foreground">Clientes</h1>
        <Button
          onClick={() => { setEditingClient(null); setFormOpen(true); }}
          size="sm"
          className="bg-primary hover:bg-primary/90 rounded-xl gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl bg-card"
        />
      </div>

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={User}
          title="Nenhuma cliente"
          description="Cadastre suas clientes para gerenciar melhor seus atendimentos"
        />
      ) : (
        <div className="space-y-2">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-card rounded-2xl p-4 border border-border shadow-sm cursor-pointer hover:border-primary/30 transition-all"
              onClick={() => setSelectedClient(client)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{client.name}</p>
                    {client.whatsapp && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {client.whatsapp}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {client.whatsapp && (
                    <a
                      href={`https://wa.me/${client.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                    </a>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingClient(null); }}
        client={editingClient}
        onSave={handleSave}
      />

      {/* Client Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading">{selectedClient.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedClient.whatsapp && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {selectedClient.whatsapp}
                  </div>
                )}
                {selectedClient.notes && (
                  <div className="bg-accent/50 rounded-xl p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm text-foreground">{selectedClient.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => {
                      setSelectedClient(null);
                      setEditingClient(selectedClient);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-destructive hover:text-destructive"
                    onClick={() => {
                      deleteMutation.mutate(selectedClient.id);
                      setSelectedClient(null);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remover
                  </Button>
                </div>

                {/* History */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Histórico de Atendimentos</h3>
                  {getClientHistory(selectedClient.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum atendimento registrado</p>
                  ) : (
                    <div className="space-y-2">
                      {getClientHistory(selectedClient.id).slice(0, 10).map((apt) => (
                        <div key={apt.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
                          <div>
                            <p className="text-sm font-medium text-foreground">{apt.service}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(apt.date), "d MMM yyyy", { locale: ptBR })} às {apt.time}
                            </p>
                          </div>
                          <div className="text-right">
                            {apt.price > 0 && (
                              <p className="text-sm font-semibold text-foreground">R$ {apt.price.toFixed(2)}</p>
                            )}
                            <StatusBadge status={apt.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}