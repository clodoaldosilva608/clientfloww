# ClientFlow - Automação Avançada de Clientes

ClientFlow é uma plataforma SaaS de automação de comunicação e gestão de clientes com motor de execução distribuído.

## Principais Tecnologias

Este projeto foi construído utilizando:

- **Vite**: Build tool veloz para o frontend.
- **TypeScript**: Tipagem estática para maior robustez.
- **React**: Biblioteca para interfaces reativas.
- **shadcn/ui**: Componentes de UI modernos e acessíveis.
- **Tailwind CSS**: Estilização baseada em utilitários.
- **Supabase**: Backend-as-a-service para banco de dados e autenticação.

## Como Iniciar Localmente

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn

### Passos para instalação

1. **Clone o repositório**
   ```sh
   git clone <URL_DO_REPO>
   ```

2. **Navegue até o diretório**
   ```sh
   cd ClientFlow
   ```

3. **Instale as dependências**
   ```sh
   npm install
   ```

4. **Inicie o servidor de desenvolvimento**
   ```sh
   npm run dev
   ```

O servidor estará disponível por padrão em `http://localhost:8080`.

## Scripts Úteis

- `npm run build`: Gera o bundle de produção na pasta `dist`.
- `npm run lint`: Executa a verificação de linting.
- `npm run preview`: Visualiza o build de produção localmente.
- `npm run test`: Executa os testes unitários com Vitest.

## Estrutura do Projeto

- `/src`: Código-fonte da aplicação React.
- `/supabase`: Migrações e Edge Functions do backend.
- `/public`: Assets estáticos.
- `/tests`: Testes E2E (Playwright).

---
Desenvolvido por ClientFlow Connect.
