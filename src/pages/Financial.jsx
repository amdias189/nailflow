import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNailPro } from "@/lib/useNailPro";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import EmptyState from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORY_LABELS = { servico: "Serviço", produto: "Produto", material: "Material", aluguel: "Aluguel", transporte: "Transporte", alimentacao: "Alimentação", marketing: "Marketing", outros: "Outros" };

function TransactionFormModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ type: "entrada", amount: "", description: "", category: "servico", date: format(new Date(), "yyyy-MM-dd") });
  const handleSubmit = (e) => { e.preventDefault(); onSave({ ...form, amount: parseFloat(form.amount) }); };
  const cats = form.type === "entrada" ? ["servico", "produto", "outros"] : ["material", "aluguel", "transporte", "alimentacao", "marketing", "outros"];
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-heading">Nova Transação</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setForm({ ...form, type: "entrada", category: "servico" })} className={cn("py-3 rounded-xl text-sm font-medium border transition-all", form.type === "entrada" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-card border-border text-muted-foreground")}>💰 Entrada</button>
            <button type="button" onClick={() => setForm({ ...form, type: "saida", category: "material" })} className={cn("py-3 rounded-xl text-sm font-medium border transition-all", form.type === "saida" ? "bg-red-50 border-red-300 text-red-700" : "bg-card border-border text-muted-foreground")}>💸 Saída</button>
          </div>
          <div>
            <Label>Valor (R$) *</Label>
            <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" required className="mt-1 text-lg" />
          </div>
          <div>
            <Label>Descrição *</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Manicure Ana Paula" required className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{cats.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="mt-1" />
            </div>
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

export default function Financial() {
  const { nailPro } = useNailPro();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [period, setPeriod] = useState("month");

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", nailPro?.id],
    queryFn: () => base44.entities.Transaction.filter({ nail_pro_id: nailPro.id }, "-date", 500),
    enabled: !!nailPro?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["transactions"] }); toast.success("Transação salva!"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Transaction.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["transactions"] }); toast.success("Removida!"); },
  });

  const today = new Date();
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");
  const weekStart = format(new Date(today.setDate(today.getDate() - today.getDay() + 1)), "yyyy-MM-dd");

  const filtered = transactions.filter((t) => {
    if (period === "day") return t.date === todayStr;
    if (period === "week") return t.date >= weekStart;
    return t.date >= monthStart && t.date <= monthEnd;
  });

  const income = filtered.filter((t) => t.type === "entrada").reduce((s, t) => s + (t.amount || 0), 0);
  const expense = filtered.filter((t) => t.type === "saida").reduce((s, t) => s + (t.amount || 0), 0);

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const ms = format(startOfMonth(d), "yyyy-MM-dd");
    const me = format(endOfMonth(d), "yyyy-MM-dd");
    const inc = transactions.filter((t) => t.type === "entrada" && t.date >= ms && t.date <= me).reduce((s, t) => s + (t.amount || 0), 0);
    const exp = transactions.filter((t) => t.type === "saida" && t.date >= ms && t.date <= me).reduce((s, t) => s + (t.amount || 0), 0);
    return { month: format(d, "MMM", { locale: ptBR }), receita: inc, despesa: exp };
  });

  const handleSave = (data) => {
    createMutation.mutate({ ...data, nail_pro_id: nailPro?.id });
    setFormOpen(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-semibold text-foreground">Financeiro</h1>
        <Button onClick={() => setFormOpen(true)} size="sm" className="bg-primary hover:bg-primary/90 rounded-xl gap-1.5">
          <Plus className="w-4 h-4" /> Nova
        </Button>
      </div>

      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {[{ k: "day", l: "Hoje" }, { k: "week", l: "Semana" }, { k: "month", l: "Mês" }].map((p) => (
          <button key={p.k} onClick={() => setPeriod(p.k)} className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", period === p.k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
            {p.l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm text-center">
          <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">Receita</p>
          <p className="text-lg font-bold text-emerald-600">R$ {income.toFixed(0)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm text-center">
          <TrendingDown className="w-5 h-5 text-red-500 mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">Despesas</p>
          <p className="text-lg font-bold text-red-500">R$ {expense.toFixed(0)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm text-center">
          <DollarSign className="w-5 h-5 text-primary mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">Lucro</p>
          <p className={cn("text-lg font-bold", (income - expense) >= 0 ? "text-emerald-600" : "text-red-500")}>
            R$ {(income - expense).toFixed(0)}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">Evolução dos últimos 6 meses</h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis hide />
              <Tooltip formatter={(v, n) => [`R$ ${v}`, n === "receita" ? "Receita" : "Despesa"]} contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Transações</h3>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={DollarSign} title="Sem transações" description="Registre suas entradas e saídas" />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((t) => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold", t.type === "entrada" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>
                    {t.type === "entrada" ? "+" : "-"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[t.category] || t.category} · {format(new Date(t.date + "T12:00"), "d MMM", { locale: ptBR })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className={cn("text-sm font-bold", t.type === "entrada" ? "text-emerald-600" : "text-red-500")}>
                    {t.type === "entrada" ? "+" : "-"}R$ {t.amount?.toFixed(2)}
                  </p>
                  <button onClick={() => deleteMutation.mutate(t.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TransactionFormModal open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} />
    </div>
  );
}