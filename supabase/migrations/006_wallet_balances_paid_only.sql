-- Recreate wallet_balances view to only account for paid transactions.
-- Pending transactions (is_paid = false) no longer affect wallet or total balances.
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
    + COALESCE(SUM(CASE WHEN t.type = 'INCOME'    AND t.wallet_id      = w.id AND t.is_paid = true THEN t.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN t.type = 'EXPENSE'   AND t.wallet_id      = w.id AND t.is_paid = true THEN t.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN t.type = 'TRANSFER'  AND t.wallet_from_id = w.id AND t.is_paid = true THEN t.amount ELSE 0 END), 0)
    + COALESCE(SUM(CASE WHEN t.type = 'TRANSFER'  AND t.wallet_to_id   = w.id AND t.is_paid = true THEN t.amount ELSE 0 END), 0)
  AS balance
FROM public.wallets w
LEFT JOIN public.transactions t ON t.user_id = w.user_id
GROUP BY w.id;
