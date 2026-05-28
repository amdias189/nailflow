import { useNailPro } from "@/lib/useNailPro";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const PLANS = [
  {
    key: "free",
    label: "Gratuito",
    icon: Sparkles,
    price: "R$ 0",
    period: "/mês",
    description: "Ideal para começar",
    color: "border-border",
    features: ["Até 30 agendamentos/mês", "1 link de agendamento", "Cadastro de clientes", "Agenda básica"],
    limits: ["Financeiro limitado", "Sem relatórios"],
  },
  {
    key: "monthly",
    label: "Mensal",
    icon: Zap,
    price: "R$ 29,90",
    period: "/mês",
    description: "Para quem já tem clientes",
    color: "border-primary",
    highlight: true,
    features: ["Agendamentos ilimitados", "Link personalizado", "CRM de clientes completo", "Financeiro completo", "Gráficos e relatórios", "Histórico completo"],
  },
  {
    key: "yearly",
    label: "Anual",
    icon: Crown,
    price: "R$ 19,90",
    period: "/mês",
    badge: "Economize 33%",
    description: "Melhor custo-benefício",
    color: "border-amber-400",
    features: ["Tudo do Mensal", "2 meses grátis", "Suporte prioritário", "Acesso a novas funcionalidades"],
  },
];

const STATUS_MAP = {
  trial: { label: "Trial ativo", color: "text-blue-600 bg-blue-50 border-blue-200" },
  active: { label: "Ativa", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  expired: { label: "Vencida", color: "text-red-600 bg-red-50 border-red-200" },
  cancelled: { label: "Cancelada", color: "text-muted-foreground bg-muted border-border" },
};

export default function Plans() {
  const { nailPro } = useNailPro();

  const handleSubscribe = (plan) => {
    toast.info("Em breve: integração com pagamento! 💳");
  };

  const status = nailPro?.subscription_status || "trial";
  const statusInfo = STATUS_MAP[status];
  const currentPlan = nailPro?.subscription_plan || "free";

  const trialEnd = nailPro?.trial_ends_at ? format(new Date(nailPro.trial_ends_at + "T12:00"), "d 'de' MMMM", { locale: ptBR }) : null;
  const subEnd = nailPro?.subscription_ends_at ? format(new Date(nailPro.subscription_ends_at + "T12:00"), "d 'de' MMMM", { locale: ptBR }) : null;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-heading font-semibold text-foreground">Planos e Assinatura</h1>
        <p className="text-sm text-muted-foreground mt-1">Escolha o melhor plano para o seu negócio</p>
      </div>

      {/* Current Status */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Status atual</p>
            {trialEnd && status === "trial" && (
              <p className="text-xs text-muted-foreground mt-0.5">Trial termina em {trialEnd}</p>
            )}
            {subEnd && status === "active" && (
              <p className="text-xs text-muted-foreground mt-0.5">Renova em {subEnd}</p>
            )}
          </div>
          <span className={cn("text-xs font-semibold px-3 py-1.5 rounded-full border", statusInfo?.color)}>
            {statusInfo?.label}
          </span>
        </div>
      </div>

      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          return (
            <div key={plan.key} className={cn("bg-card rounded-2xl p-5 border-2 shadow-sm relative", plan.color, isCurrent && "ring-2 ring-primary/30")}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  {plan.badge}
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  Atual
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", plan.highlight ? "bg-primary" : "bg-accent")}>
                  <plan.icon className={cn("w-4 h-4", plan.highlight ? "text-primary-foreground" : "text-primary")} />
                </div>
                <p className="font-heading font-semibold text-foreground">{plan.label}</p>
              </div>

              <div className="mb-1">
                <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>

              <div className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="text-xs text-foreground">{f}</span>
                  </div>
                ))}
                {plan.limits?.map((l) => (
                  <div key={l} className="flex items-start gap-2 opacity-50">
                    <span className="w-3.5 h-3.5 mt-0.5 shrink-0 text-center text-xs">✗</span>
                    <span className="text-xs text-muted-foreground">{l}</span>
                  </div>
                ))}
              </div>

              <Button
                className={cn("w-full rounded-xl", plan.highlight ? "bg-primary hover:bg-primary/90" : "variant-outline")}
                variant={plan.highlight ? "default" : "outline"}
                disabled={isCurrent}
                onClick={() => handleSubscribe(plan.key)}
              >
                {isCurrent ? "Plano atual" : plan.key === "free" ? "Plano gratuito" : "Assinar agora"}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Pagamentos seguros · Cancele quando quiser · Suporte em português
      </p>
    </div>
  );
}