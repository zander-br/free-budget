-- =============================================================
-- Migration 001: Schema inicial do Free Budget
-- =============================================================

-- Enums
CREATE TYPE public.transaction_type AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');
CREATE TYPE public.category_type AS ENUM ('INCOME', 'EXPENSE');

-- =============================================================
-- Tabela: profiles
-- Informações complementares dos usuários autenticados
-- =============================================================
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_user_id_key UNIQUE (user_id)
);

-- =============================================================
-- Tabela: wallets (bolsos)
-- Contas, carteiras e locais onde o usuário possui dinheiro
-- =============================================================
CREATE TABLE public.wallets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  icon            TEXT,
  color           TEXT,
  initial_balance BIGINT NOT NULL DEFAULT 0 CHECK (initial_balance >= 0),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- Tabela: categories
-- Categorias globais compartilhadas entre todos os usuários
-- =============================================================
CREATE TABLE public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  type       public.category_type NOT NULL,
  icon       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- Tabela: transactions (movimentações)
-- Entradas, saídas e transferências financeiras
-- =============================================================
CREATE TABLE public.transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           public.transaction_type NOT NULL,
  amount         BIGINT NOT NULL CHECK (amount > 0),
  date           DATE NOT NULL,
  category_id    UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  wallet_id      UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  wallet_from_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  wallet_to_id   UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  description    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: INCOME/EXPENSE devem ter wallet_id e category_id
  CONSTRAINT income_expense_requires_wallet
    CHECK (
      (type IN ('INCOME', 'EXPENSE') AND wallet_id IS NOT NULL AND category_id IS NOT NULL) OR
      type = 'TRANSFER'
    ),

  -- Constraint: TRANSFER deve ter wallet_from e wallet_to diferentes
  CONSTRAINT transfer_requires_wallets
    CHECK (
      (type = 'TRANSFER' AND wallet_from_id IS NOT NULL AND wallet_to_id IS NOT NULL AND wallet_from_id != wallet_to_id) OR
      type IN ('INCOME', 'EXPENSE')
    )
);

-- =============================================================
-- View: wallet_balances
-- Saldo calculado de cada bolso (evita saldo inconsistente)
-- =============================================================
CREATE VIEW public.wallet_balances AS
SELECT
  w.id,
  w.user_id,
  w.name,
  w.icon,
  w.color,
  w.initial_balance,
  w.is_active,
  w.created_at,
  w.updated_at,
  w.initial_balance
    + COALESCE(SUM(CASE WHEN t.type = 'INCOME' AND t.wallet_id = w.id THEN t.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' AND t.wallet_id = w.id THEN t.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN t.type = 'TRANSFER' AND t.wallet_from_id = w.id THEN t.amount ELSE 0 END), 0)
    + COALESCE(SUM(CASE WHEN t.type = 'TRANSFER' AND t.wallet_to_id = w.id THEN t.amount ELSE 0 END), 0)
  AS balance
FROM public.wallets w
LEFT JOIN public.transactions t ON t.user_id = w.user_id
GROUP BY w.id;

-- =============================================================
-- Índices para performance
-- =============================================================
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_wallets_user_active ON public.wallets(user_id, is_active);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX idx_transactions_wallet_from ON public.transactions(wallet_from_id);
CREATE INDEX idx_transactions_wallet_to ON public.transactions(wallet_to_id);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
CREATE INDEX idx_transactions_type ON public.transactions(user_id, type);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

-- =============================================================
-- Funções para atualizar updated_at automaticamente
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================
-- Função para criar profile automaticamente no signup
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
