export const TRANSACTION_TYPES = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
  TRANSFER: 'TRANSFER',
} as const

export const CATEGORY_TYPES = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const

export const WALLET_ICONS = [
  { value: 'wallet', label: 'Carteira' },
  { value: 'credit-card', label: 'Cartão' },
  { value: 'building-2', label: 'Banco' },
  { value: 'piggy-bank', label: 'Poupança' },
  { value: 'banknote', label: 'Dinheiro' },
  { value: 'landmark', label: 'Instituição' },
  { value: 'coins', label: 'Moedas' },
  { value: 'briefcase', label: 'Negócio' },
]

export const WALLET_COLORS = [
  { value: '#7C3AED', label: 'Roxo' },
  { value: '#2563EB', label: 'Azul' },
  { value: '#16A34A', label: 'Verde' },
  { value: '#DC2626', label: 'Vermelho' },
  { value: '#D97706', label: 'Laranja' },
  { value: '#0891B2', label: 'Ciano' },
  { value: '#DB2777', label: 'Rosa' },
  { value: '#65A30D', label: 'Lima' },
]

export const DEFAULT_PAGE_SIZE = 10

export const TRANSACTION_TYPE_LABELS = {
  INCOME: 'Entrada',
  EXPENSE: 'Saída',
  TRANSFER: 'Transferência',
} as const
