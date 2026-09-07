-- View para calcular o saldo devedor e limite disponível dos cartões de crédito
CREATE OR REPLACE VIEW public.credit_card_balances AS
SELECT
  cc.id,
  cc.user_id,
  cc.name,
  cc.credit_limit,
  cc.closing_day,
  cc.due_day,
  cc.is_active,
  (
    COALESCE((
      SELECT SUM(amount)
      FROM public.transactions t
      WHERE t.credit_card_id = cc.id
        AND t.description NOT ILIKE 'Fatura - %'
    ), 0)
    -
    COALESCE((
      SELECT SUM(amount)
      FROM public.transactions t
      WHERE t.credit_card_id = cc.id
        AND t.description ILIKE 'Fatura - %'
        AND t.is_paid = true
    ), 0)
  ) as balance
FROM public.credit_cards cc;
