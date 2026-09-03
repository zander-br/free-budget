'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createTransactionSchema } from '@/lib/validations/transaction'
import { toCents } from '@/lib/utils/format'
import type { TransactionWithDetails, PaginatedResult, TransactionFilters } from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'
import type { ActionResult } from './wallets'
import type { Database } from '@/types/supabase'

type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export async function getTransactions(
  filters: TransactionFilters = {}
): Promise<ActionResult<PaginatedResult<TransactionWithDetails>>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('transactions')
    .select(
      `
      *,
      category:categories(*),
      wallet:wallets!wallet_id(*),
      wallet_from:wallets!wallet_from_id(*),
      wallet_to:wallets!wallet_to_id(*)
    `,
      { count: 'exact' }
    )
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.type && filters.type !== 'ALL') {
    query = query.eq('type', filters.type)
  }

  if (filters.walletId) {
    query = query.or(
      `wallet_id.eq.${filters.walletId},wallet_from_id.eq.${filters.walletId},wallet_to_id.eq.${filters.walletId}`
    )
  }

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }

  if (filters.startDate) {
    query = query.gte('date', filters.startDate)
  }

  if (filters.endDate) {
    query = query.lte('date', filters.endDate)
  }

  if (filters.search) {
    query = query.ilike('description', `%${filters.search}%`)
  }

  const { data, error, count } = await query

  if (error) return { success: false, error: error.message }

  const total = count ?? 0

  return {
    success: true,
    data: {
      data: (data as unknown as TransactionWithDetails[]) ?? [],
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

export async function getRecentTransactions(
  limit = 5
): Promise<ActionResult<TransactionWithDetails[]>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('transactions')
    .select(
      `
      *,
      category:categories(*),
      wallet:wallets!wallet_id(*),
      wallet_from:wallets!wallet_from_id(*),
      wallet_to:wallets!wallet_to_id(*)
    `
    )
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { success: false, error: error.message }

  return { success: true, data: (data as unknown as TransactionWithDetails[]) ?? [] }
}

export async function getDashboardSummary(
  startDate: string,
  endDate: string
): Promise<
  ActionResult<{
    income: number
    expense: number
    categoryExpenses: { name: string; value: number; icon: string | null }[]
  }>
> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount, category:categories(name, icon)')
    .eq('user_id', user.id)
    .in('type', ['INCOME', 'EXPENSE'])
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) return { success: false, error: error.message }

  let income = 0
  let expense = 0
  const categoryMap: Record<string, { name: string; value: number; icon: string | null }> = {}

  for (const t of (data as unknown as Array<{
    type: string
    amount: number
    category: { name: string; icon: string | null } | Array<{ name: string; icon: string | null }> | null
  }>) ?? []) {
    const catRaw = t.category
    const cat = Array.isArray(catRaw)
      ? catRaw[0] as { name: string; icon: string | null } | undefined
      : catRaw as { name: string; icon: string | null } | null

    if (t.type === 'INCOME') {
      income += t.amount
    } else if (t.type === 'EXPENSE') {
      expense += t.amount
      const catName = cat?.name ?? 'Outros'
      if (!categoryMap[catName]) {
        categoryMap[catName] = { name: catName, value: 0, icon: cat?.icon ?? null }
      }
      categoryMap[catName].value += t.amount
    }
  }

  return {
    success: true,
    data: {
      income,
      expense,
      categoryExpenses: Object.values(categoryMap).sort((a, b) => b.value - a.value),
    },
  }
}

export async function createTransaction(formData: {
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  amount: number
  date: string
  category_id?: string
  wallet_id?: string
  wallet_from_id?: string
  wallet_to_id?: string
  description?: string
  notes?: string
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = createTransactionSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const input = parsed.data
  const amountInCents = toCents(input.amount)

  const insertData: TransactionInsert = {
    user_id: user.id,
    type: input.type,
    amount: amountInCents,
    date: input.date,
    description: input.description ?? null,
    notes: formData.notes?.trim() || null,
    wallet_id: null,
    category_id: null,
    wallet_from_id: null,
    wallet_to_id: null,
  }

  if (input.type === 'INCOME' || input.type === 'EXPENSE') {
    insertData.wallet_id = input.wallet_id
    insertData.category_id = input.category_id
  } else {
    insertData.wallet_from_id = input.wallet_from_id
    insertData.wallet_to_id = input.wallet_to_id
  }

  // Verify ownership of wallets
  if (insertData.wallet_id) {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('id', insertData.wallet_id)
      .eq('user_id', user.id)
      .single()
    if (!wallet) return { success: false, error: 'Bolso não encontrado' }
  }

  if (insertData.wallet_from_id) {
    const { data: walletFrom } = await supabase
      .from('wallets')
      .select('id')
      .eq('id', insertData.wallet_from_id)
      .eq('user_id', user.id)
      .single()
    if (!walletFrom) return { success: false, error: 'Bolso de origem não encontrado' }
  }

  if (insertData.wallet_to_id) {
    const { data: walletTo } = await supabase
      .from('wallets')
      .select('id')
      .eq('id', insertData.wallet_to_id)
      .eq('user_id', user.id)
      .single()
    if (!walletTo) return { success: false, error: 'Bolso de destino não encontrado' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.from('transactions').insert(insertData as any).select('id').single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/movimentacoes')
  revalidatePath('/bolsos')

  return { success: true, data: { id: (data as { id: string }).id } }
}

export async function updateTransaction(
  id: string,
  formData: {
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
    amount: number
    date: string
    category_id?: string
    wallet_id?: string
    wallet_from_id?: string
    wallet_to_id?: string
    description?: string
    notes?: string
  }
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: existing } = await supabase
    .from('transactions')
    .select('id, type')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) return { success: false, error: 'Movimentação não encontrada' }

  const parsed = createTransactionSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const input = parsed.data
  const amountInCents = toCents(input.amount)

  const updateData: TransactionUpdate = {
    type: input.type,
    amount: amountInCents,
    date: input.date,
    description: input.description ?? null,
    notes: formData.notes?.trim() || null,
    wallet_id: null,
    category_id: null,
    wallet_from_id: null,
    wallet_to_id: null,
  }

  if (input.type === 'INCOME' || input.type === 'EXPENSE') {
    updateData.wallet_id = input.wallet_id
    updateData.category_id = input.category_id
  } else {
    updateData.wallet_from_id = input.wallet_from_id
    updateData.wallet_to_id = input.wallet_to_id
  }

  const { error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/movimentacoes')
  revalidatePath('/bolsos')

  return { success: true, data: undefined }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/movimentacoes')
  revalidatePath('/bolsos')

  return { success: true, data: undefined }
}

export async function getCategories(): Promise<
  ActionResult<{ id: string; name: string; type: 'INCOME' | 'EXPENSE'; icon: string | null }[]>
> {
  const supabase = await createClient()

  const { data, error } = await supabase.from('categories').select('id, name, type, icon').order('name')

  if (error) return { success: false, error: error.message }

  return {
    success: true,
    data: (data as { id: string; name: string; type: 'INCOME' | 'EXPENSE'; icon: string | null }[]) ?? [],
  }
}
