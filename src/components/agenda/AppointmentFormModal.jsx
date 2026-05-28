import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AppointmentFormModal({ open, onClose, appointment, nailPro, defaultDate, onSaved }) {
  const queryClient = useQueryClient();

  const emptyForm = {
    client_name: "",
    client_whatsapp: "",
    service_id: "",
    service_name: "",
    price: "",
    duration: 60,
    date: defaultDate || "",
    time: "",
    status: "pendente",
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);

  const { data: services = [] } = useQuery({
    queryKey: ["services", nailPro?.id],
    queryFn: () => base44.entities.Service.filter({ nail_pro_id: nailPro.id, active: true }, "name", 100),
    enabled: !!nailPro?.id,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", nailPro?.id],
    queryFn: () => base44.entities.Client.filter({ nail_pro_id: nailPro.id }, "name", 300),
    enabled: !!nailPro?.id,
  });

  useEffect(() => {
    if (open) {
      if (appointment) {
        setForm({
          client_name: appointment.client_name || "",
          client_whatsapp: appointment.client_whatsapp || "",
          service_id: appointment.service_id || "",
          service_name: appointment.service_name || "",
          price: appointment.price || "",
          duration: appointment.duration || 60,
          date: appointment.date || defaultDate || "",
          time: appointment.time || "",
          status: appointment.status || "pendente",
          notes: appointment.notes || "",
        });
      } else {
        setForm({ ...emptyForm, date: defaultDate || "" });
      }
    }
  }, [open, appointment, defaultDate]);

  const handleServiceSelect = (serviceId) => {
    const svc = services.find((s) => s.id === serviceId);
    if (svc) {
      setForm((prev) => ({
        ...prev,
        service_id: serviceId,
        service_name: svc.name,
        price: svc.price,
        duration: svc.duration,
      }));
    }
  };

  const handleClientSelect = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setForm((prev) => ({ ...prev, client_name: client.name, client_whatsapp: client.whatsapp || "" }));
    }
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: () => { onSaved?.(); toast.success("Agendado!"); onClose(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => { onSaved?.(); toast.success("Atualizado!"); onClose(); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      nail_pro_id: nailPro?.id,
      price: parseFloat(form.price) || 0,
      duration: parseInt(form.duration) || 60,
    };
    if (appointment) {
      updateMutation.mutate({ id: appointment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{appointment ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente */}
          <div>
            <Label>Cliente</Label>
            {clients.length > 0 && (
              <Select onValueChange={handleClientSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecionar cliente salva..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Input
              placeholder="Nome da cliente *"
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              required
              className="mt-2"
            />
            <Input
              placeholder="WhatsApp"
              value={form.client_whatsapp}
              onChange={(e) => setForm({ ...form, client_whatsapp: e.target.value })}
              className="mt-2"
            />
          </div>

          {/* Serviço */}
          <div>
            <Label>Serviço</Label>
            {services.length > 0 ? (
              <Select value={form.service_id} onValueChange={handleServiceSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Escolha o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} – R$ {s.price?.toFixed(2)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Nome do serviço"
                value={form.service_name}
                onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                className="mt-1"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Duração (min)</Label>
              <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="mt-1" />
            </div>
            <div>
              <Label>Horário *</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1" />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending} className="flex-1 bg-primary hover:bg-primary/90">
              {isPending ? "Salvando..." : appointment ? "Salvar" : "Agendar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}