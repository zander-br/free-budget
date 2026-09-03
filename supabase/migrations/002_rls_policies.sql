-- =============================================================
-- Migration 002: Row Level Security (RLS)
-- Garante isolamento total de dados entre usuários
-- =============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- Policies: profiles
-- Usuário vê e altera apenas seu próprio perfil
-- =============================================================
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

-- =============================================================
-- Policies: wallets (bolsos)
-- =============================================================
CREATE POLICY "wallets_select_own" ON public.wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "wallets_insert_own" ON public.wallets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "wallets_update_own" ON public.wallets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "wallets_delete_own" ON public.wallets
  FOR DELETE USING (user_id = auth.uid());

-- =============================================================
-- Policies: categories
-- Todos os usuários autenticados podem visualizar categorias globais
-- Nenhum usuário pode criar/alterar/excluir categorias globais
-- =============================================================
CREATE POLICY "categories_select_authenticated" ON public.categories
  FOR SELECT TO authenticated USING (true);

-- =============================================================
-- Policies: transactions (movimentações)
-- =============================================================
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "transactions_insert_own" ON public.transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_update_own" ON public.transactions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "transactions_delete_own" ON public.transactions
  FOR DELETE USING (user_id = auth.uid());

-- =============================================================
-- RLS para a view wallet_balances
-- A view herda as policies da tabela wallets
-- =============================================================
