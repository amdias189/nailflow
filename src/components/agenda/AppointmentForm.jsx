import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

const SERVICES = [
  "Manicure",
  "Pedicure",
  "Manicure + Pedicure",
  "Alongamento",
  "Manutenção",
  "Nail Art",
  "Esmaltação em Gel",
  "Banho de Gel",
  "Fibra de Vidro",
  "Remoção",
  "Outro",
];

export default function AppointmentForm({ open, onClose, appointment, selectedDate, onSave }) {
  const [form, setForm] = useState({
    client_name: "",
    client_id: "",
    service: "",
    price: "",
    date: selectedDate || "",
    time: "",
    duration: 60,
    status: "pendente",
    notes: "",
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: () => base44.entities.Client.list("name", 200),
  });

  useEffect(() => {
    if (appointment) {
      setForm({
        client_name: appointment.client_name || "",
        client_id: appointment.client_id || "",
        service: appointment.service || "",
        price: appointment.price || "",
        date: appointment.date || selectedDate || "",
        time: appointment.time || "",
        duration: appointment.duration || 60,
        status: appointment.status || "pendente",
        notes: appointment.notes || "",
      });
    } else {
      setForm((prev) => ({
        ...prev,
        client_name: "",
        client_id: "",
        service: "",
        price: "",
        date: selectedDate || "",
        time: "",
        duration: 60,
        status: "pendente",
        notes: "",
      }));
    }
  }, [appointment, selectedDate, open]);

  const handleClientSelect = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setForm((prev) => ({ ...prev, client_id: clientId, client_name: client.name }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      price: parseFloat(form.price) || 0,
      duration: parseInt(form.duration) || 60,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {appointment ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Cliente</Label>
            {clients.length > 0 ? (
              <Select value={form.client_id} onValueChange={handleClientSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Nome da cliente"
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                required
              />
            )}
            {clients.length > 0 && (
              <Input
                placeholder="Ou digite o nome"
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value, client_id: "" })}
                className="mt-2"
              />
            )}
          </div>

          <div>
            <Label>Serviço</Label>
            <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                {SERVICES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <Label>Duração (min)</Label>
              <Input
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Horário</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
            <Textarea
              placeholder="Alguma observação..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
              {appointment ? "Salvar" : "Agendar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}