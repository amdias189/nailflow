import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import TransactionForm from "@/components/financial/TransactionForm";
import EmptyState from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORY_LABELS = {
  servico: "Serviço",
  produto: "Produto",
  material: "Material",
  aluguel: "Aluguel",
  transporte: "Transporte",
  alimentacao: "Alimentação",
  marketing: "Marketing",
  outros: "Outros",
};

const PIE_COLORS = [
  "hsl(340, 45%, 65%)",
  "hsl(340, 30%, 75%)",
  "hsl(30, 40%, 70%)",
  "hsl(340, 20%, 55%)",
  "hsl(20, 50%, 75%)",
  "hsl(340, 40%, 50%)",
];

export default function Financial() {
  const [formOpen, setFormOpen] = useState(false);
  const [period, setPeriod] = useState("month");
  const queryClient = useQueryClient();

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => base44.entities.Transaction.list("-date", 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação registrada!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Transaction.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação removida!");
    },
  });

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const weekStartStr = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEndStr = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStartStr = format(startOfMonth(today), "yyyy-MM-dd");
  const monthEndStr = format(endOfMonth(today), "yyyy-MM-dd");

  const getFilteredTransactions = () => {
    return transactions.filter((t) => {
      if (period === "day") return t.date === todayStr;
      if (period === "week") return t.date >= weekStartStr && t.date <= weekEndStr;
      if (period === "month") return t.date >= monthStartStr && t.date <= monthEndStr;
      return true;
    });
  };

  const filtered = getFilteredTransactions();
  const totalIncome = filtered.filter((t) => t.type === "entrada").reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpense = filtered.filter((t) => t.type === "saida").reduce((sum, t) => sum + (t.amount || 0), 0);
  const netProfit = totalIncome - totalExpense;

  // Expense by category for pie chart
  const expenseByCategory = {};
  filtered.filter((t) => t.type === "saida").forEach((t) => {
    const cat = t.category || "outros";
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + (t.amount || 0);
  });
  const pieData = Object.entries(expenseByCategory).map(([key, value]) => ({
    name: CATEGORY_LABELS[key] || key,
    value,
  }));

  // Monthly chart (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(today, 5 - i);
    const mStart = format(startOfMonth(d), "yyyy-MM-dd");
    const mEnd = format(endOfMonth(d), "yyyy-MM-dd");
    const income = transactions
      .filter((t) => t.type === "entrada" && t.date >= mStart && t.date <= mEnd)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const expense = transactions
      .filter((t) => t.type === "saida" && t.date >= mStart && t.date <= mEnd)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return {
      month: format(d, "MMM", { locale: ptBR }),
      receita: income,
      despesa: expense,
    };
  });

  const handleSave = (data) => {
    createMutation.mutate(data);
    setFormOpen(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading font-semibold text-foreground">Financeiro</h1>
        <Button
          onClick={() => setFormOpen(true)}
          size="sm"
          className="bg-primary hover:bg-primary/90 rounded-xl gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova</span>
        </Button>
      </div>

      {/* Period Toggle */}
      <div className="flex gap-2 bg-muted rounded-xl p-1">
        {[
          { key: "day", label: "Hoje" },
          { key: "week", label: "Semana" },
          { key: "month", label: "Mês" },
        ].map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
              period === p.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm text-center">
          <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Receita</p>
          <p className="text-lg font-semibold text-emerald-600">R$ {totalIncome.toFixed(0)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm text-center">
          <TrendingDown className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Despesas</p>
          <p className="text-lg font-semibold text-red-500">R$ {totalExpense.toFixed(0)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm text-center">
          <DollarSign className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Lucro</p>
          <p className={cn("text-lg font-semibold", netProfit >= 0 ? "text-emerald-600" : "text-red-500")}>
            R$ {netProfit.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Evolução Mensal</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis hide />
                <Tooltip
                  formatter={(value, name) => [`R$ ${value}`, name === "receita" ? "Receita" : "Despesa"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {pieData.length > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4">Despesas por Categoria</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`R$ ${value}`, "Valor"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {pieData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Transações Recentes</h3>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="Sem transações"
            description="Adicione entradas e saídas para controlar suas finanças"
          />
        ) : (
          <div className="divide-y divide-border">
            {filtered.slice(0, 20).map((t) => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-sm",
                    t.type === "entrada" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                  )}>
                    {t.type === "entrada" ? "↑" : "↓"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[t.category] || t.category} · {format(new Date(t.date), "d MMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-sm font-semibold",
                    t.type === "entrada" ? "text-emerald-600" : "text-red-500"
                  )}>
                    {t.type === "entrada" ? "+" : "-"} R$ {t.amount?.toFixed(2)}
                  </p>
                  <button
                    onClick={() => deleteMutation.mutate(t.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}