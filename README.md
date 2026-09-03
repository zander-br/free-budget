# Free Budget

Aplicativo de controle financeiro pessoal com suporte a múltiplos bolsos (carteiras), movimentações de entrada, saída e transferência, dashboard com gráficos e tema claro/escuro.

Construído com **Next.js 16**, **Supabase**, **TypeScript**, **Tailwind CSS** e **shadcn/ui**.

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) — versão 20 ou superior
- [npm](https://www.npmjs.com/) — já vem com o Node.js
- [Git](https://git-scm.com/)
- Uma conta no [Supabase](https://supabase.com/) (gratuita)
- Uma conta no [Google Cloud Console](https://console.cloud.google.com/) (para o OAuth)

---

## Passo 1 — Clonar o repositório

```bash
git clone <url-do-repositorio>
cd free-budget
```

---

## Passo 2 — Criar o projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e faça login
2. Clique em **New project**
3. Preencha:
   - **Name**: `free-budget` (ou o nome que preferir)
   - **Database Password**: escolha uma senha forte e guarde-a
   - **Region**: escolha a região mais próxima de você (ex.: South America — São Paulo)
4. Clique em **Create new project** e aguarde a criação (cerca de 1 minuto)

---

## Passo 3 — Executar as migrations do banco de dados

Com o projeto criado no Supabase, acesse o **SQL Editor** (menu lateral esquerdo).

Execute cada migration na ordem abaixo, colando o conteúdo no editor e clicando em **Run**:

### Migration 1 — Esquema inicial

Cole o conteúdo do arquivo `supabase/migrations/001_initial_schema.sql` e execute.

### Migration 2 — Políticas de segurança (RLS)

Cole o conteúdo do arquivo `supabase/migrations/002_rls_policies.sql` e execute.

### Migration 3 — Categorias padrão

Cole o conteúdo do arquivo `supabase/migrations/003_seed_categories.sql` e execute.

> **Dica:** você pode selecionar tudo com `Ctrl+A` em cada arquivo, copiar e colar diretamente no SQL Editor.

---

## Passo 4 — Configurar o Google OAuth

### 4.1 — Criar credenciais no Google Cloud Console

1. Acesse [https://console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto novo (ou selecione um existente)
3. No menu lateral, vá em **APIs e Serviços** → **Credenciais**
4. Clique em **Criar credenciais** → **ID do cliente OAuth**
5. Se solicitado, configure a **Tela de consentimento OAuth** primeiro:
   - Tipo de usuário: **Externo**
   - Preencha nome do app, e-mail de suporte e contato do desenvolvedor
   - Salve e continue até a última etapa
6. De volta em **Criar ID do cliente OAuth**:
   - Tipo de aplicativo: **Aplicativo da Web**
   - Nome: `Free Budget`
   - **Origens JavaScript autorizadas**: `http://localhost:3000`
   - **URIs de redirecionamento autorizados**: você vai preencher no próximo passo
7. Clique em **Criar** e anote o **Client ID** e o **Client Secret**

### 4.2 — Obter a URL de callback do Supabase

1. No painel do Supabase, vá em **Authentication** → **Providers**
2. Localize **Google** e clique para expandir
3. Copie a **Callback URL** que aparece (formato: `https://<seu-projeto>.supabase.co/auth/v1/callback`)

### 4.3 — Adicionar a URL de callback no Google Cloud

1. Volte ao Google Cloud Console → **Credenciais** → clique no seu OAuth Client ID
2. Em **URIs de redirecionamento autorizados**, adicione a URL copiada do Supabase
3. Salve

### 4.4 — Configurar o Google no Supabase

1. No Supabase, vá em **Authentication** → **Providers** → **Google**
2. Ative o toggle **Enable**
3. Cole o **Client ID** e o **Client Secret** do Google
4. Clique em **Save**

---

## Passo 5 — Configurar as variáveis de ambiente

Na raiz do projeto, crie um arquivo `.env.local`:

```bash
cp .env.example .env.local
```

> Se o arquivo `.env.example` não existir, crie o `.env.local` manualmente com o conteúdo abaixo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
```

Para encontrar esses valores no Supabase:

1. Acesse **Settings** → **API** no painel do Supabase
2. Copie:
   - **Project URL** → use como `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (em Project API Keys) → use como `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> **Nunca** use a `service_role` key no frontend — ela tem acesso total ao banco.

---

## Passo 6 — Instalar as dependências

```bash
npm install
```

---

## Passo 7 — Executar em modo de desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

Você será redirecionado para a página de login. Clique em **Entrar com Google** para autenticar.

---

## Passo 8 — Testar a aplicação

Após o login, você verá o **dashboard** vazio com um botão para criar seu primeiro bolso.

Crie alguns bolsos (ex.: "Nubank", "Carteira", "Poupança") e adicione movimentações para explorar o app.

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Cria o build de produção |
| `npm start` | Inicia o servidor de produção (requer build) |
| `npm run lint` | Executa o ESLint |
| `npm run format` | Formata o código com Prettier |
| `npm run format:check` | Verifica a formatação sem alterar arquivos |
| `npm run typecheck` | Verifica os tipos TypeScript |
| `npm test` | Executa os testes com Vitest |
| `npm run test:watch` | Executa os testes em modo watch |

---

## Verificar qualidade do código

Para verificar se tudo está correto antes de um deploy:

```bash
# Verificação de tipos TypeScript
npm run typecheck

# Linting
npm run lint

# Testes automatizados
npm test

# Build de produção
npm run build
```

---

## Instalar como PWA

O Free Budget é um Progressive Web App (PWA) e pode ser instalado no celular ou desktop como um aplicativo nativo.

### No celular (Android / iOS)

1. Abra o app no navegador do celular
2. No Android: toque no menu do Chrome → **Adicionar à tela inicial**
3. No iOS (Safari): toque no botão de compartilhar → **Adicionar à Tela de Início**

### No desktop (Chrome / Edge)

1. Abra o app no navegador
2. Clique no ícone de instalação que aparece na barra de endereços (ícone de computador ou seta para baixo)
3. Confirme a instalação

---

## Estrutura do projeto

```
free-budget/
├── src/
│   ├── actions/          # Server Actions (auth, bolsos, movimentações)
│   ├── app/              # Rotas Next.js (App Router)
│   │   ├── (auth)/       # Páginas de autenticação
│   │   ├── (dashboard)/  # Páginas protegidas
│   │   └── api/          # Route Handlers
│   ├── components/       # Componentes React
│   │   ├── dashboard/    # Componentes do dashboard
│   │   ├── shared/       # Componentes reutilizáveis
│   │   ├── transactions/ # Componentes de movimentações
│   │   ├── ui/           # Componentes de UI base (shadcn)
│   │   └── wallets/      # Componentes de bolsos
│   ├── lib/              # Utilitários e configurações
│   │   ├── constants/    # Constantes da aplicação
│   │   ├── supabase/     # Clientes Supabase (browser, server, proxy)
│   │   ├── utils/        # Funções utilitárias (format, cn)
│   │   └── validations/  # Schemas Zod
│   ├── tests/            # Testes automatizados
│   └── types/            # Definições de tipos TypeScript
├── supabase/
│   └── migrations/       # Migrations SQL
└── public/               # Arquivos estáticos (manifest, icons)
```

---

## Decisões técnicas

- **Valores monetários em centavos**: todos os valores são armazenados como inteiros (`BIGINT`) no banco de dados para evitar erros de ponto flutuante. A conversão para reais só acontece na exibição.
- **Row Level Security (RLS)**: cada usuário só acessa seus próprios dados — garantido no nível do banco de dados pelo Supabase.
- **Saldo calculado via VIEW**: o saldo dos bolsos é calculado em tempo real pela view `wallet_balances`, nunca armazenado diretamente.
- **Transferências não alteram o patrimônio**: uma transferência entre bolsos reduz o saldo de origem e aumenta o destino pelo mesmo valor, mantendo o total intacto.

---

## Solução de problemas

### Login não funciona / redirect infinito

- Verifique se as variáveis de ambiente no `.env.local` estão corretas
- Certifique-se de que o **Callback URL** do Supabase está adicionado nos **URIs de redirecionamento autorizados** do Google Cloud Console
- Limpe os cookies do navegador e tente novamente

### Erro ao executar as migrations

- Certifique-se de executar as migrations **na ordem** (001 → 002 → 003)
- Se a migration 002 falhar, verifique se a migration 001 foi executada com sucesso primeiro

### Variáveis de ambiente não reconhecidas

- O arquivo deve se chamar exatamente `.env.local` (com ponto no início)
- Reinicie o servidor de desenvolvimento após criar ou alterar o `.env.local`
- Variáveis com prefixo `NEXT_PUBLIC_` ficam disponíveis no cliente; as demais, apenas no servidor
