import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign, Users, TrendingUp, Sparkles } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import StatCard from "@/components/dashboard/StatCard";
import NextClients from "@/components/dashboard/NextClients";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const { data: todayAppointments = [] } = useQuery({
    queryKey: ["appointments-today"],
    queryFn: () => base44.entities.Appointment.filter({ date: today }),
  });

  const { data: monthTransactions = [] } = useQuery({
    queryKey: ["transactions-month"],
    queryFn: () => base44.entities.Transaction.filter({}, "-date", 200),
  });

  const todayRevenue = todayAppointments
    .filter((a) => a.status !== "cancelado")
    .reduce((sum, a) => sum + (a.price || 0), 0);

  const monthRevenue = monthTransactions
    .filter((t) => t.type === "entrada" && t.date >= monthStart && t.date <= monthEnd)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthExpenses = monthTransactions
    .filter((t) => t.type === "saida" && t.date >= monthStart && t.date <= monthEnd)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const upcomingAppointments = todayAppointments
    .filter((a) => a.status !== "cancelado" && a.status !== "concluido")
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 5);

  const completedToday = todayAppointments.filter((a) => a.status === "concluido").length;

  // Weekly chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = format(d, "yyyy-MM-dd");
    const dayLabel = format(d, "EEE", { locale: ptBR });
    const dayRevenue = monthTransactions
      .filter((t) => t.type === "entrada" && t.date === dateStr)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return { day: dayLabel, valor: dayRevenue };
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-heading font-semibold text-foreground">
            Olá! ✨
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Calendar}
          label="Atendimentos"
          value={todayAppointments.filter((a) => a.status !== "cancelado").length}
          sublabel={`${completedToday} concluídos`}
        />
        <StatCard
          icon={DollarSign}
          label="Faturamento Hoje"
          value={`R$ ${todayRevenue.toFixed(0)}`}
        />
        <StatCard
          icon={TrendingUp}
          label="Receita do Mês"
          value={`R$ ${monthRevenue.toFixed(0)}`}
        />
        <StatCard
          icon={Users}
          label="Lucro Líquido"
          value={`R$ ${(monthRevenue - monthExpenses).toFixed(0)}`}
          sublabel="este mês"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Next Clients */}
        <NextClients appointments={upcomingAppointments} />

        {/* Weekly Chart */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Faturamento da Semana</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => [`R$ ${value}`, "Valor"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}