-- =============================================================
-- Migration 011: Add cycle_date to transactions
-- =============================================================

ALTER TABLE public.transactions
  ADD COLUMN cycle_date DATE;

-- Índice para agilizar buscas por ciclo de fatura
CREATE INDEX idx_transactions_cycle_date ON public.transactions(cycle_date);
