-- =============================================================
-- Migration 008: Credit Card Closing Day
-- Adiciona a coluna closing_day na tabela credit_cards
-- =============================================================

ALTER TABLE public.credit_cards
ADD COLUMN closing_day INTEGER NOT NULL DEFAULT 1 CHECK (closing_day >= 1 AND closing_day <= 31);

-- Remove the default now that existing rows are populated
ALTER TABLE public.credit_cards
ALTER COLUMN closing_day DROP DEFAULT;
