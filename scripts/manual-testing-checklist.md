# Checklist de Testes Manuais - ClientFlow

**Data:** 2026-04-20
**URL:** http://localhost:8080
**Versão:** 1.0

---

## ✅ INSTRUÇÕES

1. Abra o navegador (Chrome, Firefox ou Edge)
2. Acesse: http://localhost:8080
3. Siga cada fluxo abaixo marcando [ ] conforme testar
4. Anote qualquer erro ou comportamento inesperado

---

## 🎯 FLUXO 1: Primeiro Acesso (Landing Page)

### Abertura da Página Inicial
- [ ] Acesse http://localhost:8080/landing
- [ ] A página carrega em menos de 3 segundos
- [ ] O título "ClientFlow" aparece no topo
- [ ] O subtítulo sobre automação é visível
- [ ] Imagens/ícones carregam corretamente
- [ ] Layout está responsivo (teste redimensionando a janela)

### Navegação na Landing
- [ ] Botão "Começar Agora" ou similar está visível
- [ ] Seção de funcionalidades é exibida
- [ ] Cards de preços aparecem (se houver)
- [ ] FAQ expande e retrai ao clicar
- [ ] Rodapé (footer) com links está presente

### Responsividade Mobile
- [ ] Abra em modo mobile (Ctrl+Shift+M no Chrome DevTools)
- [ ] Menu é adaptativo ou hamburguer aparece
- [ ] Texto é legível sem zoom
- [ ] Botões são clicáveis (tamanho adequado)

**Status do Fluxo 1:** ⬜ Não testado / ⏳ Em andamento / ✅ Concluído

---

## 🔐 FLUXO 2: Autenticação

### Cadastro de Novo Usuário
- [ ] Acesse http://localhost:8080/auth
- [ ] Clique em "Criar conta" ou "Cadastrar"
- [ ] Preencha:
  - Nome: "Usuário Teste"
  - Email: "teste@clientflow.com"
  - Senha: "Teste123!"
- [ ] Clique em "Criar Conta"
- [ ] Verifique se:
  - [ ] Mostra mensagem de sucesso
  - [ ] Redireciona para o Dashboard
  - [ ] Ou mostra erro se email já existe

### Login
- [ ] Acesse http://localhost:8080/auth
- [ ] Preencha email e senha válidos
- [ ] Clique em "Entrar"
- [ ] Verifique:
  - [ ] Redirecionamento para Dashboard
  - [ ] Nome do usuário aparece no topo
  - [ ] Menu lateral mostra opções completas

### Logout
- [ ] Localize botão de "Sair" ou ícone de logout
- [ ] Clique em Sair
- [ ] Verifique:
  - [ ] Redirecionamento para página de login
  - [ ] Ao tentar acessar /dashboard, redireciona para login

### Recuperação de Senha
- [ ] Na tela de login, clique em "Esqueci minha senha"
- [ ] Digite um email válido
- [ ] Clique em "Enviar"
- [ ] Verifique mensagem de confirmação

**Status do Fluxo 2:** ⬜ Não testado / ⏳ Em andamento / ✅ Concluído

---

## 📊 FLUXO 3: Dashboard

### Visualização
- [ ] Após login, Dashboard carrega automaticamente
- [ ] Verifique elementos:
  - [ ] Cards de estatísticas (Clientes, Campanhas, etc.)
  - [ ] Gráficos de mensagens (se houver dados)
  - [ ] Lista de clientes recentes
  - [ ] Próximas campanhas agendadas

### Interatividade
- [ ] Clique nos cards - navegam para páginas correspondentes?
- [ ] Passe o mouse sobre gráficos - mostram tooltip?
- [ ] Botões de ação rápida funcionam?

### Atualização em Tempo Real
- [ ] Abra o Dashboard em duas abas
- [ ] Em uma aba, adicione um cliente
- [ ] Verifique se a outra aba atualiza (se houver realtime)

**Status do Fluxo 3:** ⬜ Não testado / ⏳ Em andamento / ✅ Concluído

---

## 👥 FLUXO 4: Gestão de Clientes

### Listagem de Clientes
- [ ] Acesse http://localhost:8080/clientes
- [ ] Verifique:
  - [ ] Tabela/grid de clientes carrega
  - [ ] Colunas: Nome, Telefone, Email, Tags, Ações
  - [ ] Busca funciona (filtro em tempo real)
  - [ ] Paginação funciona (se houver muitos clientes)

### Cadastro de Cliente
- [ ] Clique em "Novo Cliente" ou "+"
- [ ] Preencha formulário:
  - [ ] Nome completo
  - [ ] Telefone (com DDD)
  - [ ] Email
  - [ ] CPF (opcional)
  - [ ] Data de nascimento
  - [ ] Endereço completo (CEP, Rua, Número, Bairro, Cidade, Estado)
  - [ ] IDs de WhatsApp/Telegram/Instagram (se aplicável)
  - [ ] Tags (ex: "VIP", "Novo", "Ativo")
  - [ ] Observações
- [ ] Clique em "Salvar"
- [ ] Verifique:
  - [ ] Mensagem de sucesso
  - [ ] Cliente aparece na lista
  - [ ] CEP busca endereço automaticamente (se implementado)

### Edição de Cliente
- [ ] Na lista, clique em "Editar" em um cliente
- [ ] Altere algum campo
- [ ] Salve
- [ ] Verifique se atualizou na lista

### Exclusão de Cliente
- [ ] Clique em "Excluir" em um cliente
- [ ] Confirme a exclusão
- [ ] Verifique:
  - [ ] Modal de confirmação aparece
  - [ ] Cliente é removido da lista
  - [ ] Mensagem de sucesso

### Ações em Massa
- [ ] Selecione múltiplos clientes (checkbox)
- [ ] Tente:
  - [ ] Excluir em massa
  - [ ] Adicionar tag em massa
  - [ ] Exportar (se disponível)

**Status do Fluxo 4:** ⬜ Não testado / ⏳ Em andamento / ✅ Concluído

---

## 📢 FLUXO 5: Campanhas

### Criação de Campanha
- [ ] Acesse http://localhost:8080/campanhas
- [ ] Clique em "Nova Campanha"
- [ ] Preencha:
  - [ ] Nome da campanha
  - [ ] Plataforma (WhatsApp/Telegram/Instagram)
  - [ ] Mensagem (use variáveis como {{nome}} se disponível)
  - [ ] Data/hora de agendamento (ou envio imediato)
- [ ] Clique em "Próximo"

### Seleção de Destinatários
- [ ] Selecione clientes:
  - [ ] Por tags (ex: todos "VIP")
  - [ ] Individualmente (checkbox)
  - [ ] Selecionar todos
- [ ] Filtre por nome/telefone
- [ ] Veja contagem de destinatários
- [ ] Clique em "Criar Campanha"

### Agendamento
- [ ] Defina data futura
- [ ] Verifique se aparece em "Agendamentos"
- [ ] Teste cancelar agendamento

### Histórico
- [ ] Acesse http://localhost:8080/historico
- [ ] Veja campanhas enviadas
- [ ] Filtre por:
  - [ ] Data
  - [ ] Plataforma
  - [ ] Status (Enviada, Entregue, Falha)

**Status do Fluxo 5:** ⬜ Não testado / ⏳ Em andamento / ✅ Concluído

---

## 🔌 FLUXO 6: Integrações

### WhatsApp Business
- [ ] Acesse http://localhost:8080/integracoes
- [ ] Selecione WhatsApp
- [ ] Tente configurar:
  - [ ] Token de acesso
  - [ ] Phone Number ID
  - [ ] Business Account ID
- [ ] Salve configuração
- [ ] Verifique se status fica "Ativo"
- [ ] Recarregue página - configuração persiste?

### Telegram Bot
- [ ] Selecione Telegram
- [ ] Insira Bot Token
- [ ] Salve
- [ ] Teste conexão (se houver botão "Testar")

### Instagram/Facebook
- [ ] Selecione Instagram
- [ ] Insira App ID, App Secret, Page Token
- [ ] Salve e verifique persistência

### IA/Hugging Face
- [ ] Configure token da Hugging Face
- [ ] Teste geração de texto (em campanhas)

**Status do Fluxo 6:** ⬜ Não testado / ⏳ Em andamento / ✅ Concluído

---

## ⚙️ FLUXO 7: Configurações

### Perfil do Usuário
- [ ] Acesse http://localhost:8080/configuracoes
- [ ] Altere:
  - [ ] Nome
  - [ ] Telefone
  - [ ] Avatar/foto (se suportado)
- [ ] Salve e verifique persistência

### Preferências
- [ ] Altere tema (Dark/Light) - se disponível
- [ ] Altere idioma (PT/EN/ES) - se disponível
- [ ] Verifique se preferências persistem após reload

**Status do Fluxo 7:** ⬜ Não testado / ⏳ Em andamento / ✅ Concluído

---

## 📱 FLUXO 8: Testes Mobile

### Navegação Mobile
- [ ] Abra http://localhost:8080 no celular (mesma rede WiFi)
- [ ] Ou use DevTools em modo mobile
- [ ] Teste:
  - [ ] Menu hamburguer funciona
  - [ ] Todos os botões são clicáveis
  - [ ] Formulários são preenchíveis
  - [ ] Scroll é suave
  - [ ] Não há cortes de texto

### PWA (Se suportado)
- [ ] No Chrome mobile, adicione à tela inicial
- [ ] Abra como app standalone
- [ ] Verifique se abre em tela cheia
- [ ] Teste offline (se houver service worker)

**Status do Fluxo 8:** ⬜ Não testado / ⏳ Em andamento / ✅ Concluído

---

## 🐛 FLUXO 9: Testes de Erro

### Validações
- [ ] Tente criar cliente sem nome → deve mostrar erro
- [ ] Tente criar campanha sem mensagem → erro
- [ ] Email inválido → erro de validação
- [ ] Telefone inválido → erro

### Conexão
- [ ] Desligue internet temporariamente
- [ ] Tente salvar algo → deve mostrar erro de conexão
- [ ] Reconecte - aplicação recupera?

### Dados
- [ ] Tente acessar cliente inexistente (/clientes/99999)
- [ ] Deve mostrar "Não encontrado" ou redirecionar

**Status do Fluxo 9:** ⬜ Não testado / ⏳ Em andamento / ✅ Concluído

---

## 📝 RESUMO DOS TESTES

| Fluxo | Status | Problemas Encontrados |
|-------|--------|----------------------|
| 1. Landing Page | ⬜ | |
| 2. Autenticação | ⬜ | |
| 3. Dashboard | ⬜ | |
| 4. Clientes | ⬜ | |
| 5. Campanhas | ⬜ | |
| 6. Integrações | ⬜ | |
| 7. Configurações | ⬜ | |
| 8. Mobile | ⬜ | |
| 9. Erros | ⬜ | |

### Resultado Final
- **Total de Itens:** ~80 verificações
- **Concluídos:** ___
- **Com Problemas:** ___
- **Taxa de Sucesso:** ___%

---

## 🚨 RELATO DE BUGS

Use esta seção para anotar qualquer problema encontrado:

### Bug 1
- **Onde:** (página/funcionalidade)
- **O que:** (descrição do problema)
- **Esperado:** (como deveria funcionar)
- **Obtido:** (o que aconteceu)
- **Gravidade:** 🔴 Crítica / 🟡 Média / 🟢 Baixa

### Bug 2
- **Onde:**
- **O que:**
- **Esperado:**
- **Obtido:**
- **Gravidade:**

---

## 🎓 CONCLUSÃO

Após completar todos os testes:

1. Conte quantos itens falharam
2. Classifique a gravidade
3. Priorize correções (críticas primeiro)
4. Reteste após correções

**Classificação Final:**
- ✅ **APROVADO** - 0-2 bugs leves
- ⚠️ **APROVADO COM RESSALVAS** - 3-5 bugs, nenhum crítico
- ❌ **REPROVADO** - Mais de 5 bugs ou 1+ crítico

---

**Tester:** _____________________
**Data:** _____________________
**Navegador:** _____________________
**Versão:** _____________________

*Checklist gerado automaticamente para ClientFlow*
