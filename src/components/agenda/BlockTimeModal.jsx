import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function BlockTimeModal({ open, onClose, nailProId, defaultDate, onSaved }) {
  const [form, setForm] = useState({ date: defaultDate || "", start_time: "12:00", end_time: "13:00", reason: "", recurring: false });

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.BlockedTime.create(data),
    onSuccess: () => { onSaved?.(); toast.success("Horário bloqueado!"); onClose(); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ ...form, nail_pro_id: nailProId });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Bloquear Horário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Data</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início</Label>
              <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required className="mt-1" />
            </div>
            <div>
              <Label>Fim</Label>
              <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Motivo</Label>
            <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Almoço, reunião..." className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="recurring" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} className="w-4 h-4 accent-primary" />
            <Label htmlFor="recurring" className="cursor-pointer">Repetir toda semana</Label>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending} className="flex-1 bg-primary hover:bg-primary/90">
              {mutation.isPending ? "Salvando..." : "Bloquear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}