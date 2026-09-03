-- =============================================================
-- Migration 004: Adiciona coluna notes na tabela transactions
-- Separa a observação (notes) da descrição principal (description)
-- =============================================================

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Migra dados existentes que usam o separador '\n[obs]:'
-- para a nova coluna notes
UPDATE public.transactions
SET
  notes       = SUBSTRING(description FROM POSITION(E'\n[obs]:' IN description) + 8),
  description = SUBSTRING(description FROM 1 FOR POSITION(E'\n[obs]:' IN description) - 1)
WHERE description LIKE E'%\n[obs]:%';
