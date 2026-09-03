export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'
export type CategoryType = 'INCOME' | 'EXPENSE'

export interface Profile {
  id: string
  user_id: string
  name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Wallet {
  id: string
  user_id: string
  name: string
  icon: string | null
  color: string | null
  initial_balance: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WalletWithBalance extends Wallet {
  balance: number
}

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon: string | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  date: string
  category_id: string | null
  wallet_id: string | null
  wallet_from_id: string | null
  wallet_to_id: string | null
  description: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TransactionWithDetails extends Transaction {
  category: Category | null
  wallet: Wallet | null
  wallet_from: Wallet | null
  wallet_to: Wallet | null
}

export interface DashboardSummary {
  totalBalance: number
  periodIncome: number
  periodExpense: number
  periodBalance: number
}

export interface WalletBalance {
  walletId: string
  balance: number
}

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface TransactionFilters {
  walletId?: string
  categoryId?: string
  type?: TransactionType | 'ALL'
  startDate?: string
  endDate?: string
  search?: string
  page?: number
  pageSize?: number
}
