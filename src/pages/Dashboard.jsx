import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, DollarSign, Users, TrendingUp, Sparkles, AlertCircle, ExternalLink, Clock } from "lucide-react";
import { useNailPro } from "@/lib/useNailPro";
import StatCard from "@/components/dashboard/StatCard";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/shared/StatusBadge";

export default function Dashboard() {
  const { nailPro, isLoading } = useNailPro();
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const { data: todayAppointments = [] } = useQuery({
    queryKey: ["appointments-today", nailPro?.id],
    queryFn: () => base44.entities.Appointment.filter({ nail_pro_id: nailPro.id, date: today }),
    enabled: !!nailPro?.id,
  });

  const { data: monthAppointments = [] } = useQuery({
    queryKey: ["appointments-month", nailPro?.id],
    queryFn: () => base44.entities.Appointment.filter({ nail_pro_id: nailPro.id }, "-date", 300),
    enabled: !!nailPro?.id,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-count", nailPro?.id],
    queryFn: () => base44.entities.Client.filter({ nail_pro_id: nailPro.id }, "name", 500),
    enabled: !!nailPro?.id,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const monthRevenue = monthAppointments
    .filter((a) => a.status !== "cancelado" && a.date >= monthStart && a.date <= monthEnd)
    .reduce((sum, a) => sum + (a.price || 0), 0);

  const activeToday = todayAppointments.filter((a) => a.status !== "cancelado");
  const completedToday = todayAppointments.filter((a) => a.status === "concluido");
  const upcoming = todayAppointments
    .filter((a) => a.status === "confirmado" || a.status === "pendente")
    .sort((a, b) => a.time.localeCompare(b.time));

  // Top serviços
  const serviceCounts = {};
  monthAppointments.filter((a) => a.status !== "cancelado").forEach((a) => {
    serviceCounts[a.service_name] = (serviceCounts[a.service_name] || 0) + 1;
  });
  const topServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Alerta de assinatura
  const isTrialExpiring = nailPro?.subscription_status === "trial" && nailPro?.trial_ends_at;
  const trialDaysLeft = isTrialExpiring
    ? Math.ceil((new Date(nailPro.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-semibold text-foreground">
            Olá, {nailPro?.owner_name?.split(" ")[0] || "manicure"}! ✨
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        {nailPro?.slug && (
          <a
            href={`/agendar/${nailPro.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary bg-accent px-3 py-2 rounded-xl hover:bg-accent/80 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Meu link
          </a>
        )}
      </div>

      {/* Subscription Alert */}
      {trialDaysLeft !== null && trialDaysLeft <= 7 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {trialDaysLeft <= 0 ? "Seu período trial expirou!" : `Trial termina em ${trialDaysLeft} dia${trialDaysLeft !== 1 ? "s" : ""}`}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">Assine agora para continuar usando todos os recursos.</p>
          </div>
          <Link
            to="/planos"
            className="text-xs font-semibold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-lg whitespace-nowrap hover:bg-amber-200 transition-colors"
          >
            Ver planos
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Calendar} label="Hoje" value={activeToday.length} sublabel={`${completedToday.length} concluídos`} />
        <StatCard icon={DollarSign} label="Receita do Mês" value={`R$ ${monthRevenue.toFixed(0)}`} />
        <StatCard icon={Users} label="Clientes" value={clients.length} />
        <StatCard icon={TrendingUp} label="Atend. no Mês" value={monthAppointments.filter((a) => a.status !== "cancelado").length} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Próximos do dia */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Hoje</h3>
            <Link to="/agenda" className="text-xs text-primary hover:underline">Ver agenda →</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">Nenhum agendamento pendente hoje</p>
              <button
                onClick={() => navigate("/agenda")}
                className="text-xs text-primary mt-2 hover:underline"
              >
                + Criar agendamento
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((apt) => (
                <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/40">
                  <div className="text-center min-w-[44px]">
                    <Clock className="w-3.5 h-3.5 text-primary mx-auto" />
                    <p className="text-xs font-semibold text-foreground mt-0.5">{apt.time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{apt.client_name}</p>
                    <p className="text-xs text-muted-foreground">{apt.service_name}</p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top serviços */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Serviços mais agendados</h3>
          {topServices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum dado ainda</p>
          ) : (
            <div className="space-y-3">
              {topServices.map(([name, count], idx) => {
                const max = topServices[0][1];
                return (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground font-medium truncate">{name}</span>
                      <span className="text-muted-foreground text-xs ml-2">{count}x</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-border">
            <Link to="/servicos" className="text-xs text-primary hover:underline">
              Gerenciar serviços →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick link */}
      {nailPro?.slug && (
        <div className="bg-accent/40 rounded-2xl p-4 border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-1">Compartilhe seu link de agendamento</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-primary flex-1 truncate">
              {window.location.origin}/agendar/{nailPro.slug}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/agendar/${nailPro.slug}`);
              }}
              className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Copiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}