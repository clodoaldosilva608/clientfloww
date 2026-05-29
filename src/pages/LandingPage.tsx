import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap, Users, Megaphone, CalendarClock, History, Plug, MessageSquare,
  BarChart3, Send, Shield, Smartphone, Sparkles, ArrowRight, CheckCircle,
  Bot, Instagram, Phone, Globe, Star, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0, 0, 0.2, 1] as const }
  })
};

const features = [
  {
    icon: BarChart3,
    title: "Dashboard Inteligente",
    description: "Métricas em tempo real com gráficos interativos. Acompanhe mensagens, campanhas e clientes instantaneamente.",
    color: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    preview: (
      <div className="space-y-2">
        <div className="flex justify-between">
          {[
            { label: "Clientes", value: "1.2K", color: "text-primary" },
            { label: "Entrega", value: "97%", color: "text-success" },
            { label: "Campanhas", value: "34", color: "text-warning" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="h-8 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded" />
      </div>
    ),
  },
  {
    icon: Users,
    title: "CRM Completo",
    description: "Cadastro completo com endereço, redes sociais, tags, timeline de interações e score de engajamento.",
    color: "from-info/20 to-info/5",
    iconBg: "bg-info/10",
    iconColor: "text-info",
    preview: (
      <div className="space-y-1.5">
        {["Maria Silva", "João Santos", "Ana Costa"].map(c => (
          <div key={c} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-[8px] font-bold text-primary">{c[0]}</span>
            </div>
            <span className="text-xs text-card-foreground">{c}</span>
            <div className="ml-auto flex gap-0.5">
              {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-success" />)}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Megaphone,
    title: "Campanhas Multicanal",
    description: "Crie campanhas para WhatsApp, Telegram e Instagram com IA. Selecione destinatários e agende envios.",
    color: "from-accent/20 to-accent/5",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    preview: (
      <div className="space-y-1.5">
        {[
          { name: "Promoção Verão", status: "Agendada", badge: "bg-warning/10 text-warning" },
          { name: "Black Friday", status: "Enviada", badge: "bg-success/10 text-success" },
        ].map(c => (
          <div key={c.name} className="flex items-center justify-between">
            <span className="text-xs text-card-foreground">{c.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.badge}`}>{c.status}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: CalendarClock,
    title: "Agendamentos",
    description: "Programe campanhas para datas e horários específicos. Nunca perca o timing ideal.",
    color: "from-warning/20 to-warning/5",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    preview: (
      <div className="space-y-1">
        {["14/03 - 09:00", "15/03 - 14:30", "16/03 - 18:00"].map(s => (
          <div key={s} className="flex items-center gap-2">
            <CalendarClock className="w-3 h-3 text-warning" />
            <span className="text-xs text-card-foreground">{s}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Sparkles,
    title: "IA Geradora de Textos",
    description: "Gere textos promocionais com inteligência artificial. Tom de voz, variáveis dinâmicas e refinamento automático.",
    color: "from-chart-5/20 to-chart-5/5",
    iconBg: "bg-chart-5/10",
    iconColor: "text-chart-5",
    preview: (
      <p className="text-xs text-card-foreground italic leading-relaxed">
        "Aproveite nossa oferta exclusiva! Descontos de até 50% em produtos selecionados..."
      </p>
    ),
  },
  {
    icon: Plug,
    title: "Integrações Poderosas",
    description: "Conecte WhatsApp Business, Telegram Bot, Instagram API e IA em poucos cliques.",
    color: "from-success/20 to-success/5",
    iconBg: "bg-success/10",
    iconColor: "text-success",
    preview: (
      <div className="flex flex-wrap gap-1.5">
        {["WhatsApp", "Telegram", "Instagram", "IA"].map(i => (
          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">{i}</span>
        ))}
      </div>
    ),
  },
  {
    icon: History,
    title: "Histórico Completo",
    description: "Rastreie todas as mensagens enviadas e recebidas. Filtros por data, plataforma e status.",
    color: "from-muted to-transparent",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    preview: (
      <div className="space-y-1">
        {[
          { msg: "Promoção enviada", status: "✓", color: "text-success" },
          { msg: "Resposta recebida", status: "↩", color: "text-primary" },
        ].map(l => (
          <div key={l.msg} className="flex items-center justify-between">
            <span className="text-xs text-card-foreground">{l.msg}</span>
            <span className={`text-xs ${l.color}`}>{l.status}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Dados criptografados, autenticação segura, RLS e políticas de acesso por usuário.",
    color: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    preview: (
      <div className="space-y-1">
        {["Criptografia E2E", "Auth Seguro", "RLS Ativo"].map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-success" />
            <span className="text-xs text-card-foreground">{s}</span>
          </div>
        ))}
      </div>
    ),
  },
];

const plans = [
  {
    name: "Starter",
    price: "Grátis",
    features: ["Até 100 clientes", "3 campanhas/mês", "Dashboard básico", "1 integração"],
    highlighted: false
  },
  {
    name: "Professional",
    price: "R$ 97/mês",
    features: ["Clientes ilimitados", "Campanhas ilimitadas", "Dashboard completo", "Todas integrações", "IA geradora de textos", "Suporte prioritário"],
    highlighted: true
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    features: ["Tudo do Professional", "API dedicada", "Multi-usuários", "Onboarding dedicado", "SLA garantido"],
    highlighted: false
  },
];

const faqs = [
  { q: "Preciso de conhecimentos técnicos?", a: "Não! O ClientFlow foi feito para ser intuitivo. Você configura tudo em poucos cliques, sem necessidade de programação." },
  { q: "Como funciona a integração com WhatsApp?", a: "Utilizamos a API oficial do WhatsApp Business (Cloud API). Você precisa de uma conta Meta Business verificada para enviar mensagens em escala." },
  { q: "Posso usar o ClientFlow no celular?", a: "Sim! O ClientFlow é um PWA (Progressive Web App), totalmente instalável no celular e funciona offline para páginas estáticas." },
  { q: "Existe limite de mensagens?", a: "No plano Professional não há limite de campanhas. Os limites de envio dependem da API de cada plataforma (WhatsApp, Telegram, etc.)." },
  { q: "A IA geradora de textos é confiável?", a: "Sim! Utilizamos modelos de linguagem avançados para gerar textos promocionais de alta qualidade. Você pode editar e refinar qualquer texto antes de enviar." },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border" style={{ background: "hsl(var(--glass-bg))", backdropFilter: "blur(var(--glass-blur))", WebkitBackdropFilter: "blur(var(--glass-blur))" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground tracking-tight">ClientFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Preços</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 glow-accent rounded-full font-bold px-6">
                Teste Grátis 7 Dias
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium mb-6 border border-accent/20">
              <Sparkles className="w-3.5 h-3.5" />
              Plataforma com IA integrada
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-black text-foreground leading-tight mb-6">
              Automatize seu atendimento e aumente suas vendas com <span className="gradient-text">IA</span>
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
              Pare de perder clientes por falta de acompanhamento automático.
            </p>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              O ClientFlow transforma seu WhatsApp e Instagram em uma máquina de vendas, recuperando clientes inativos, gerenciando seu CRM e disparando campanhas inteligentes no piloto automático.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 rounded-full px-8 text-lg font-black tracking-tight glow-primary">
                  Começar agora <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  Ver funcionalidades
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Hero Preview Card */}
          <motion.div
            className="mt-16 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            <div className="glass-card-solid p-6 sm:p-8 glow-primary">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Clientes", value: "1.247", icon: Users, color: "text-primary", bg: "bg-primary/10" },
                  { label: "Mensagens", value: "8.392", icon: MessageSquare, color: "text-accent", bg: "bg-accent/10" },
                  { label: "Entrega", value: "97%", icon: Send, color: "text-success", bg: "bg-success/10" },
                  { label: "Campanhas", value: "34", icon: Megaphone, color: "text-warning", bg: "bg-warning/10" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <p className="text-xl font-bold font-heading text-card-foreground">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { platform: "WhatsApp", icon: Phone, count: "4.200 msgs", active: true },
                  { platform: "Telegram", icon: Send, count: "2.890 msgs", active: true },
                  { platform: "Instagram", icon: Instagram, count: "1.302 msgs", active: false },
                ].map((p) => (
                  <div key={p.platform} className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.active ? "bg-success/10" : "bg-muted"}`}>
                      <p.icon className={`w-4 h-4 ${p.active ? "text-success" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{p.platform}</p>
                      <p className="text-[11px] text-muted-foreground">{p.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
              Tudo que você precisa em <span className="gradient-text">uma plataforma</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas completas para gestão de clientes, envio de campanhas e automação de marketing digital.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="group glass-card-solid overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className={`h-1 bg-gradient-to-r ${feature.color}`} />
                <div className="p-5">
                  <div className={`w-10 h-10 rounded-lg ${feature.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-base font-semibold font-heading text-card-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{feature.description}</p>
                </div>
                <div className="px-5 pb-5">
                  <div className="bg-muted/40 rounded-lg p-3 border border-dashed border-border">
                    {feature.preview}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: "5.000+", label: "Usuários ativos" },
              { value: "120k+", label: "Mensagens enviadas" },
              { value: "99.9%", label: "Uptime garantido" },
              { value: "4.9", label: "Avaliação média", icon: Star },
            ].map((s) => (
              <motion.div key={s.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
                <p className="text-2xl sm:text-3xl font-bold font-heading text-foreground flex items-center justify-center gap-1">
                  {s.value}
                  {s.icon && <Star className="w-5 h-5 text-warning fill-warning" />}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl sm:text-5xl font-heading font-black text-foreground mb-4 tracking-tighter">
              Aprovado por líderes de vendas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Veja como negócios reais estão multiplicando seu faturamento com a nossa plataforma.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { text: "Nossas vendas aumentaram 40% no primeiro mês. O robô faz o follow-up automático com clientes que sumiram do WhatsApp e a conversão é insana.", name: "Carlos Andrade", role: "CEO, E-commerce", avatar: "CA" },
              { text: "A Inteligência Artificial deles lê as tags do meu CRM e monta o script perfeito. Nunca mais perdi tempo escrevendo ofertas.", name: "Juliana Mendes", role: "Gestora de Vendas", avatar: "JM" },
              { text: "O painel me dá previsibilidade total. Eu sei exatamente que horas disparar minhas campanhas para ter 2x mais abertura.", name: "Roberto Silva", role: "Agência de Marketing", avatar: "RS" }
            ].map((t, i) => (
              <motion.div key={i} className="glass-card-solid p-8 relative" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="text-primary mb-6"><Star className="w-6 h-6 fill-primary inline-block" /><Star className="w-6 h-6 fill-primary inline-block" /><Star className="w-6 h-6 fill-primary inline-block" /><Star className="w-6 h-6 fill-primary inline-block" /><Star className="w-6 h-6 fill-primary inline-block" /></div>
                <p className="text-lg text-foreground italic mb-8 font-medium leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black text-lg">{t.avatar}</div>
                  <div>
                    <h4 className="font-bold text-foreground">{t.name}</h4>
                    <span className="text-sm text-muted-foreground">{t.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">Planos e Preços</h2>
            <p className="text-lg text-muted-foreground">Escolha o plano ideal para o seu negócio.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`rounded-xl border p-6 transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground border-primary shadow-xl scale-105 glow-primary"
                    : "glass-card-solid hover:shadow-md"
                }`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <h3 className="text-lg font-heading font-bold mb-1">{plan.name}</h3>
                <p className={`text-3xl font-bold font-heading mb-6 ${plan.highlighted ? "" : "text-foreground"}`}>{plan.price}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 shrink-0 ${plan.highlighted ? "text-primary-foreground" : "text-success"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth?mode=signup">
                  <Button
                    className={`w-full ${plan.highlighted ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90" : "bg-accent text-accent-foreground hover:bg-accent/90"}`}
                  >
                    {plan.highlighted ? "Assinar agora" : "Começar grátis"}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">Perguntas Frequentes</h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                className="glass-card-solid overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-sm font-medium text-card-foreground pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
              Pronto para transformar seu negócio?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Comece gratuitamente e descubra como o ClientFlow pode automatizar sua comunicação.
            </p>
            <Link to="/auth?mode=signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-full h-14 px-10 text-lg font-black tracking-tight glow-primary">
                Teste Grátis por 7 Dias <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t pt-10 pb-24 sm:pb-10 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-foreground">ClientFlow</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</a>
              <a href="#pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Preços</a>
              <a href="#faq" className="text-xs text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-xs text-muted-foreground">© 2026 ClientFlow. Todos os direitos reservados.</p>
              <Link to="/admin/login" className="text-[9px] text-zinc-800 hover:text-zinc-500 transition-colors cursor-default select-none" title="">
                ●
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
