# PRD - ClientFlow: Plataforma de Gestão de Clientes e Campanhas

## 1. Visão Geral

**ClientFlow** é uma plataforma SaaS web/PWA para gestão completa de clientes e envio automatizado de campanhas promocionais multicanal (WhatsApp, Telegram, Instagram), com geração de conteúdo por IA integrada.

### 1.1 Problema
Pequenas e médias empresas enfrentam dificuldade em gerenciar clientes, organizar campanhas de marketing e automatizar o envio de mensagens em múltiplas plataformas. As soluções existentes são fragmentadas, caras ou complexas demais.

### 1.2 Solução
Uma plataforma unificada, intuitiva e instalável (PWA) que centraliza a gestão de clientes, criação de campanhas com IA e envio multicanal, tudo com métricas em tempo real.

### 1.3 Público-Alvo
- Microempreendedores e PMEs
- Profissionais de marketing digital
- Equipes de atendimento ao cliente
- Lojas e e-commerces

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilização | Tailwind CSS + shadcn/ui |
| Animações | Framer Motion |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions + Realtime) |
| IA | Supabase Edge Functions + AI Proxy Gateway / Hugging Face |
| PWA | vite-plugin-pwa + Service Worker |
| Deploy | Cloud Infrastructure |

---

## 3. Arquitetura do Banco de Dados

### 3.1 Tabelas

#### `profiles`
- `id` (uuid, FK → auth.users.id)
- `full_name`, `phone`, `avatar_url`
- `created_at`, `updated_at`
- RLS: Usuário lê/edita apenas seu próprio perfil

#### `clients`
- `id`, `user_id` (FK → auth.users)
- `name`, `phone`, `email`, `cpf`, `birth_date`
- `cep`, `street`, `house_number`, `neighborhood`, `city`, `state`, `complement`
- `whatsapp_id`, `telegram_chat_id`, `instagram_id`
- `notes`
- RLS: Usuário acessa apenas seus clientes

#### `client_tags`
- `id`, `client_id` (FK → clients), `tag`
- RLS: Via relacionamento com clients

#### `campaigns`
- `id`, `user_id`, `name`, `message`, `platform`
- `status` (draft | scheduled | sent)
- `scheduled_at`, `sent_at`
- RLS: Usuário acessa apenas suas campanhas

#### `campaign_targets`
- `id`, `campaign_id` (FK → campaigns), `client_id` (FK → clients)
- `status` (pending | sent | delivered | failed | read)
- `sent_at`, `delivered_at`, `read_at`
- RLS: Via relacionamento com campaigns

#### `message_logs`
- `id`, `user_id`, `client_id`, `campaign_id`
- `platform`, `direction` (outbound | inbound)
- `message`, `status`, `external_id`
- RLS: Usuário acessa apenas seus logs

#### `integration_configs`
- `id`, `user_id`, `platform`
- `config` (JSONB - tokens, webhooks, etc.)
- `is_active`
- RLS: Usuário acessa apenas suas integrações

---

## 4. Funcionalidades Detalhadas

### 4.1 Landing Page (Pública)
- Hero com CTA principal
- Cards preview de cada funcionalidade
- Seção de preços com 3 planos
- FAQ expandível
- Prova social com métricas
- Footer com links

### 4.2 Autenticação
- Login com email/senha
- Registro com nome, email e senha
- Recuperação de senha via email
- Página de redefinição de senha
- Redirecionamento automático pós-login
- Proteção de rotas com ProtectedRoute

### 4.3 Dashboard
- **Cards de estatísticas**: Clientes, Mensagens, Taxa de Entrega, Campanhas
- **Cards de status**: Em espera, Entregues, Enviadas, Falhas
- **Gráfico de linha**: Mensagens nos últimos 7 dias
- **Gráfico de pizza**: Distribuição por status
- **Gráfico de barras**: Mensagens por plataforma
- **Lista**: Próximas campanhas agendadas
- **Lista**: Clientes recentes
- **Real-time**: Atualização via Supabase Realtime

### 4.4 Gestão de Clientes
- **Listagem**: Tabela com busca, tags e ações rápidas
- **Detalhes**: Modal com todas as informações do cliente
- **Cadastro completo**: Nome, CPF, telefone, email, data de nascimento, endereço completo (CEP, rua, número, bairro, cidade, estado, complemento), IDs de WhatsApp/Telegram/Instagram, tags e observações
- **Exclusão**: Com confirmação
- **Responsivo**: Cards no mobile, tabela no desktop

### 4.5 Campanhas
- **Fluxo em 2 etapas**:
  1. Formulário: nome, plataforma, mensagem (com gerador IA), data/hora de agendamento
  2. Seleção de destinatários: busca, selecionar todos, checkbox individual
- **Gerador IA**: Campo de prompt → gera texto via Edge Function
- **Lista de campanhas**: Com status, plataforma, contagem de destinatários
- **Exclusão**: Remove campanha e targets

### 4.6 Agendamentos
- Listagem de campanhas agendadas
- Visualização de datas e horários
- Status de cada agendamento

### 4.7 Histórico
- Log completo de mensagens
- Filtros por plataforma, status, data
- Detalhes de cada mensagem

### 4.8 Integrações
- **WhatsApp Business**: Token, Phone Number ID, Business Account ID
- **Telegram Bot**: Bot Token, Webhook URL
- **Instagram/Facebook**: App ID, App Secret, Page Token
- **Hugging Face**: API Token, Model ID
- Status de cada integração (ativo/inativo)
- Teste de conexão

### 4.9 Configurações
- Edição de perfil (nome, telefone)
- Logout

---

## 5. Integrações Externas

### 5.1 WhatsApp Business API
- Envio de mensagens via Cloud API
- Webhook para recebimento de respostas
- Templates de mensagem

### 5.2 Telegram Bot API
- Envio de mensagens via Bot Token
- Webhook para recebimento
- Suporte a formatação Markdown

### 5.3 Instagram Graph API
- Envio de mensagens diretas
- Integração via Facebook Business

### 5.4 Hugging Face Inference API
- Geração de textos promocionais
- Modelos customizáveis

### 5.5 AI Proxy Gateway
- Geração de textos via Edge Function
- Fallback quando Hugging Face não configurado

---

## 6. PWA & Mobile

### 6.1 Recursos PWA
- Manifest.json completo com ícones
- Service Worker com cache estratégico
- Instalável via navegador (Add to Home Screen)
- Offline-capable para páginas estáticas
- Splash screen customizada

### 6.2 Google Play Store
- Geração de TWA (Trusted Web Activity) via Bubblewrap
- Manifest otimizado para Play Store
- Screenshots e ícones nos tamanhos corretos
- Assetlinks.json para verificação de domínio

### 6.3 Responsividade
- Mobile-first design
- Bottom navigation no mobile
- Sidebar colapsável no desktop
- Sheet menu para itens adicionais

---

## 7. Segurança

- **RLS (Row Level Security)**: Todas as tabelas protegidas
- **Auth**: Supabase Auth com JWT
- **Tokens**: Armazenados em JSONB criptografado
- **CORS**: Configurado nas Edge Functions
- **Rate Limiting**: Via Supabase

---

## 8. Métricas de Sucesso

| Métrica | Meta |
|---------|------|
| Time to First Value | < 5 min (cadastro → primeira campanha) |
| Taxa de entrega de mensagens | > 95% |
| Uptime | > 99.9% |
| Tempo de carregamento | < 2s (Lighthouse > 90) |
| Retenção D7 | > 60% |

---

## 9. Roadmap Futuro

### Fase 2
- [ ] Multi-usuários por conta
- [ ] Templates de mensagem reutilizáveis
- [ ] A/B testing de campanhas
- [ ] Webhooks para receber respostas

### Fase 3
- [ ] Chatbot integrado com IA
- [ ] Segmentação avançada de clientes
- [ ] Relatórios exportáveis (PDF/Excel)
- [ ] API pública para integrações externas

### Fase 4
- [ ] Marketplace de templates
- [ ] Integração com CRMs populares
- [ ] Automações condicionais (workflows)
- [ ] White-label para agências
