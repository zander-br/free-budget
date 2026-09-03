-- =============================================================
-- Migration 003: Seed de categorias padrão
-- Idempotente: utiliza INSERT ... ON CONFLICT DO NOTHING
-- =============================================================

-- Categorias de Entrada (INCOME)
INSERT INTO public.categories (id, name, type, icon) VALUES
  ('a414bced-d67f-4c46-900c-f7a5e74882df', 'Salário',        'INCOME', 'briefcase'),
  ('0aaae4f7-f407-4b50-b5f4-9c7f1b1b1b1b', 'Freelance',      'INCOME', 'laptop'),
  ('22d0a102-3665-4e66-bf5a-049d5e35d74e', 'Investimentos',  'INCOME', 'trending-up'),
  ('96f8761b-5963-415c-a093-40c12cf0ab48', 'Rendimentos',    'INCOME', 'percent'),
  ('4c36b16b-97d8-448d-a4c4-4a1776d8e2e2', 'Reembolso',      'INCOME', 'rotate-ccw'),
  ('5d9f82b6-82d8-448d-a4c4-4a1776d8e2e3', 'Presente',       'INCOME', 'gift'),
  ('6e4a0f2d-9a8f-448d-a4c4-4a1776d8e2e4', 'Outros',         'INCOME', 'circle-plus')
ON CONFLICT (id) DO NOTHING;

-- Categorias de Saída (EXPENSE)
INSERT INTO public.categories (id, name, type, icon) VALUES
  ('7f4b4f2d-9a8f-448d-a4c4-4a1776d8e2e1', 'Alimentação',  'EXPENSE', 'utensils'),
  ('72848e03-b9b4-4a47-9300-62b40c62774e', 'Moradia',      'EXPENSE', 'home'),
  ('8d62cbf6-0e5d-4f9d-b56d-05f3008aef5f', 'Transporte',   'EXPENSE', 'car'),
  ('325315f5-9c6b-4f1e-88ce-9e8a8c14bd63', 'Saúde',        'EXPENSE', 'heart-pulse'),
  ('a938af01-fa09-4f49-91e5-e29c62394e90', 'Educação',     'EXPENSE', 'graduation-cap'),
  ('246dbd58-67fc-4dbf-8c79-207a9f65e7ad', 'Lazer',        'EXPENSE', 'gamepad-2'),
  ('bf8c1069-74b9-428f-8162-2b0edb395bea', 'Compras',      'EXPENSE', 'shopping-bag'),
  ('fc19d0f0-299d-46d4-ad3d-f208a17860f4', 'Assinaturas',  'EXPENSE', 'repeat'),
  ('0835bff2-85e3-49c7-9bd7-d0a0fbec16e6', 'Contas',       'EXPENSE', 'file-text'),
  ('3e6dc803-20c5-412f-9d6b-4e808156bb0e', 'Impostos',     'EXPENSE', 'receipt'),
  ('de323703-fc7f-4e02-a548-2fe22c2c5de2', 'Viagens',      'EXPENSE', 'plane'),
  ('741bafcb-f46a-4255-b4e2-98c6eaae0c53', 'Pets',         'EXPENSE', 'paw-print'),
  ('acc7ec7d-7085-4279-8059-330429c8a8ef', 'Outros',       'EXPENSE', 'circle-minus')
ON CONFLICT (id) DO NOTHING;
