-- Relax constraint to allow invoice transactions (which don't have category_id initially)
ALTER TABLE public.transactions
  DROP CONSTRAINT income_expense_requires_wallet;

ALTER TABLE public.transactions
  ADD CONSTRAINT income_expense_requires_wallet
    CHECK (
      (type = 'INCOME' AND wallet_id IS NOT NULL AND category_id IS NOT NULL) OR
      (type = 'EXPENSE' AND (
        (wallet_id IS NOT NULL AND category_id IS NOT NULL) OR
        (credit_card_id IS NOT NULL) -- Permite compras (com categoria) e faturas (sem categoria)
      )) OR
      type = 'TRANSFER'
    );
