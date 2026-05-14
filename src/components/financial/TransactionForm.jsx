import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

const CATEGORIES = {
  entrada: [
    { value: "servico", label: "Serviço" },
    { value: "produto", label: "Produto" },
    { value: "outros", label: "Outros" },
  ],
  saida: [
    { value: "material", label: "Material" },
    { value: "aluguel", label: "Aluguel" },
    { value: "transporte", label: "Transporte" },
    { value: "alimentacao", label: "Alimentação" },
    { value: "marketing", label: "Marketing" },
    { value: "outros", label: "Outros" },
  ],
};

export default function TransactionForm({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    type: "entrada",
    amount: "",
    description: "",
    category: "servico",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    if (open) {
      setForm({
        type: "entrada",
        amount: "",
        description: "",
        category: "servico",
        date: format(new Date(), "yyyy-MM-dd"),
      });
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      amount: parseFloat(form.amount) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Nova Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tipo</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "entrada", category: "servico" })}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  form.type === "entrada"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-card border-border text-muted-foreground"
                }`}
              >
                💰 Entrada
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "saida", category: "material" })}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  form.type === "saida"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-card border-border text-muted-foreground"
                }`}
              >
                💸 Saída
              </button>
            </div>
          </div>

          <div>
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              placeholder="0,00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              className="text-lg"
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Input
              placeholder="Ex: Manicure + Pedicure"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES[form.type].map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}