-- =============================================================
-- Migration 003: Seed de categorias padrão
-- Idempotente: utiliza INSERT ... ON CONFLICT DO NOTHING
-- =============================================================

-- Categorias de Entrada (INCOME)
INSERT INTO public.categories (id, name, type, icon) VALUES
  ('cat-inc-01', 'Salário',        'INCOME', 'briefcase'),
  ('cat-inc-02', 'Freelance',      'INCOME', 'laptop'),
  ('cat-inc-03', 'Investimentos',  'INCOME', 'trending-up'),
  ('cat-inc-04', 'Rendimentos',    'INCOME', 'percent'),
  ('cat-inc-05', 'Reembolso',      'INCOME', 'rotate-ccw'),
  ('cat-inc-06', 'Presente',       'INCOME', 'gift'),
  ('cat-inc-07', 'Outros',         'INCOME', 'circle-plus')
ON CONFLICT (id) DO NOTHING;

-- Categorias de Saída (EXPENSE)
INSERT INTO public.categories (id, name, type, icon) VALUES
  ('cat-exp-01', 'Alimentação',  'EXPENSE', 'utensils'),
  ('cat-exp-02', 'Moradia',      'EXPENSE', 'home'),
  ('cat-exp-03', 'Transporte',   'EXPENSE', 'car'),
  ('cat-exp-04', 'Saúde',        'EXPENSE', 'heart-pulse'),
  ('cat-exp-05', 'Educação',     'EXPENSE', 'graduation-cap'),
  ('cat-exp-06', 'Lazer',        'EXPENSE', 'gamepad-2'),
  ('cat-exp-07', 'Compras',      'EXPENSE', 'shopping-bag'),
  ('cat-exp-08', 'Assinaturas',  'EXPENSE', 'repeat'),
  ('cat-exp-09', 'Contas',       'EXPENSE', 'file-text'),
  ('cat-exp-10', 'Impostos',     'EXPENSE', 'receipt'),
  ('cat-exp-11', 'Viagens',      'EXPENSE', 'plane'),
  ('cat-exp-12', 'Pets',         'EXPENSE', 'paw-print'),
  ('cat-exp-13', 'Outros',       'EXPENSE', 'circle-minus')
ON CONFLICT (id) DO NOTHING;
