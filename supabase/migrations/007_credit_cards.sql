-- =============================================================
-- Migration 007: Cartões de Crédito
-- Adiciona tabela de cartões de crédito e integra com transações
-- =============================================================

-- =============================================================
-- Tabela: credit_cards
-- Cartões de crédito do usuário
-- =============================================================
CREATE TABLE public.credit_cards (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  credit_limit BIGINT NOT NULL CHECK (credit_limit > 0),
  due_day    INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- Trigger: updated_at automático para credit_cards
-- =============================================================
CREATE TRIGGER handle_credit_cards_updated_at
  BEFORE UPDATE ON public.credit_cards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================
-- Índices para credit_cards
-- =============================================================
CREATE INDEX idx_credit_cards_user_id ON public.credit_cards(user_id);
CREATE INDEX idx_credit_cards_user_active ON public.credit_cards(user_id, is_active);

-- =============================================================
-- RLS: credit_cards
-- =============================================================
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_cards_select_own" ON public.credit_cards
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "credit_cards_insert_own" ON public.credit_cards
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "credit_cards_update_own" ON public.credit_cards
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "credit_cards_delete_own" ON public.credit_cards
  FOR DELETE USING (user_id = auth.uid());

-- =============================================================
-- Alterações em transactions: credit_card_id e invoice_id
-- =============================================================
ALTER TABLE public.transactions
  ADD COLUMN credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL;

ALTER TABLE public.transactions
  ADD COLUMN invoice_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL;

-- Índices para os novos campos
CREATE INDEX idx_transactions_credit_card ON public.transactions(credit_card_id);
CREATE INDEX idx_transactions_invoice ON public.transactions(invoice_id);

-- =============================================================
-- Atualizar constraint: EXPENSE pode ter wallet_id NULL
-- se credit_card_id não for NULL
-- =============================================================
ALTER TABLE public.transactions
  DROP CONSTRAINT income_expense_requires_wallet;

ALTER TABLE public.transactions
  ADD CONSTRAINT income_expense_requires_wallet
    CHECK (
      (type = 'INCOME' AND wallet_id IS NOT NULL AND category_id IS NOT NULL) OR
      (type = 'EXPENSE' AND (
        (wallet_id IS NOT NULL AND category_id IS NOT NULL) OR
        (credit_card_id IS NOT NULL AND category_id IS NOT NULL)
      )) OR
      type = 'TRANSFER'
    );

-- =============================================================
-- Atualizar view wallet_balances:
-- Excluir transações de cartão de crédito (credit_card_id NOT NULL)
-- do cálculo de saldo, EXCETO faturas (que têm wallet_id preenchido)
-- =============================================================
CREATE OR REPLACE VIEW public.wallet_balances AS
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
    + COALESCE(SUM(CASE WHEN t.type = 'INCOME'   AND t.wallet_id      = w.id AND t.is_paid = true AND t.credit_card_id IS NULL THEN t.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN t.type = 'EXPENSE'  AND t.wallet_id      = w.id AND t.is_paid = true THEN t.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN t.type = 'TRANSFER' AND t.wallet_from_id = w.id AND t.is_paid = true THEN t.amount ELSE 0 END), 0)
    + COALESCE(SUM(CASE WHEN t.type = 'TRANSFER' AND t.wallet_to_id   = w.id AND t.is_paid = true THEN t.amount ELSE 0 END), 0)
  AS balance
FROM public.wallets w
LEFT JOIN public.transactions t ON t.user_id = w.user_id
GROUP BY w.id;
