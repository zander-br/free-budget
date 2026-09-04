'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createTransactionSchema } from '@/lib/validations/transaction'
import { toCents } from '@/lib/utils/format'
import type { TransactionWithDetails, PaginatedResult, TransactionFilters, TransactionsSummary } from '@/types'
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
    .order('date', { ascending: true })
    .order('created_at', { ascending: true })
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
    .eq('is_paid', true)
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
  is_paid?: boolean
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

  const today = new Date().toISOString().split('T')[0]
  const isPaid = formData.is_paid !== undefined ? formData.is_paid : input.date <= today

  const insertData: TransactionInsert = {
    user_id: user.id,
    type: input.type,
    amount: amountInCents,
    date: input.date,
    description: input.description ?? null,
    notes: formData.notes?.trim() || null,
    is_paid: isPaid,
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
    is_paid?: boolean
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

  const today = new Date().toISOString().split('T')[0]
  const isPaid = formData.is_paid !== undefined ? formData.is_paid : input.date <= today

  const updateData: TransactionUpdate = {
    type: input.type,
    amount: amountInCents,
    date: input.date,
    description: input.description ?? null,
    notes: formData.notes?.trim() || null,
    is_paid: isPaid,
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

export async function getUpcomingTransactions(): Promise<
  ActionResult<{ expenses: TransactionWithDetails[]; income: TransactionWithDetails[] }>
> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

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
    .eq('is_paid', false)
    .in('type', ['INCOME', 'EXPENSE'])
    .gte('date', today)
    .lte('date', sevenDaysLater)
    .order('date', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }

  const all = (data as unknown as TransactionWithDetails[]) ?? []
  return {
    success: true,
    data: {
      expenses: all.filter((t) => t.type === 'EXPENSE'),
      income: all.filter((t) => t.type === 'INCOME'),
    },
  }
}

export type RepeatPeriod =
  | 'dias'
  | 'semanas'
  | 'quinzenas'
  | 'meses'
  | 'bimestres'
  | 'trimestres'
  | 'semestres'
  | 'anos'

function addPeriodToDate(baseDate: string, period: RepeatPeriod, count: number): string {
  const d = new Date(baseDate + 'T12:00:00')
  switch (period) {
    case 'dias': d.setDate(d.getDate() + count); break
    case 'semanas': d.setDate(d.getDate() + count * 7); break
    case 'quinzenas': d.setDate(d.getDate() + count * 15); break
    case 'meses': d.setMonth(d.getMonth() + count); break
    case 'bimestres': d.setMonth(d.getMonth() + count * 2); break
    case 'trimestres': d.setMonth(d.getMonth() + count * 3); break
    case 'semestres': d.setMonth(d.getMonth() + count * 6); break
    case 'anos': d.setFullYear(d.getFullYear() + count); break
  }
  return d.toISOString().split('T')[0]
}

export async function createRecurringTransactions(
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
    is_paid?: boolean
  },
  repeatCount: number,
  period: RepeatPeriod
): Promise<ActionResult<{ count: number }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = createTransactionSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }

  const input = parsed.data
  const amountInCents = toCents(input.amount)
  const total = repeatCount + 1
  const today = new Date().toISOString().split('T')[0]

  if ('wallet_id' in input && input.wallet_id) {
    const { data: wallet } = await supabase.from('wallets').select('id').eq('id', input.wallet_id).eq('user_id', user.id).single()
    if (!wallet) return { success: false, error: 'Bolso não encontrado' }
  }
  if ('wallet_from_id' in input && input.wallet_from_id) {
    const { data: w } = await supabase.from('wallets').select('id').eq('id', input.wallet_from_id).eq('user_id', user.id).single()
    if (!w) return { success: false, error: 'Bolso de origem não encontrado' }
  }
  if ('wallet_to_id' in input && input.wallet_to_id) {
    const { data: w } = await supabase.from('wallets').select('id').eq('id', input.wallet_to_id).eq('user_id', user.id).single()
    if (!w) return { success: false, error: 'Bolso de destino não encontrado' }
  }

  const baseDescription = formData.description ?? ''
  const suffixLen = ` ${total}/${total}`.length
  const safeBase = baseDescription.slice(0, Math.max(0, 200 - suffixLen))

  const records: TransactionInsert[] = []
  for (let i = 0; i < total; i++) {
    const date = addPeriodToDate(input.date, period, i)
    const isPaid =
      i === 0
        ? formData.is_paid !== undefined
          ? formData.is_paid
          : input.date <= today
        : date <= today
    const description = safeBase ? `${safeBase} ${i + 1}/${total}` : null

    const record: TransactionInsert = {
      user_id: user.id,
      type: input.type,
      amount: amountInCents,
      date,
      description,
      notes: formData.notes?.trim() || null,
      is_paid: isPaid,
      wallet_id: null,
      category_id: null,
      wallet_from_id: null,
      wallet_to_id: null,
    }

    if (input.type === 'INCOME' || input.type === 'EXPENSE') {
      record.wallet_id = (input as { wallet_id: string }).wallet_id
      record.category_id = (input as { category_id: string }).category_id
    } else {
      record.wallet_from_id = (input as { wallet_from_id: string }).wallet_from_id
      record.wallet_to_id = (input as { wallet_to_id: string }).wallet_to_id
    }

    records.push(record)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('transactions').insert(records as any[])
  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/movimentacoes')
  revalidatePath('/bolsos')

  return { success: true, data: { count: total } }
}

export async function getTransactionsSummary(
  filters: TransactionFilters
): Promise<ActionResult<TransactionsSummary>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { walletId, categoryId, startDate, endDate, search, type } = filters

  // Wallet initial balances (base for saldo anterior)
  let walletsQ = supabase
    .from('wallets')
    .select('initial_balance')
    .eq('user_id', user.id)
    .eq('is_active', true)
  if (walletId) walletsQ = walletsQ.eq('id', walletId)

  // Paid transactions before startDate (for saldo anterior computation)
  const buildPrevTxQ = () => {
    if (!startDate) return null
    let q = supabase
      .from('transactions')
      .select('type, amount, wallet_id, wallet_from_id, wallet_to_id')
      .eq('user_id', user.id)
      .eq('is_paid', true)
      .lt('date', startDate)
    if (!walletId) {
      q = q.in('type', ['INCOME', 'EXPENSE'])
    } else {
      q = q.or(`wallet_id.eq.${walletId},wallet_from_id.eq.${walletId},wallet_to_id.eq.${walletId}`)
    }
    return q
  }

  // Period queries: breakdown rows (all filters applied)
  const buildPeriodQ = (isPaid: boolean) => {
    let q = supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', user.id)
      .eq('is_paid', isPaid)
      .in('type', ['INCOME', 'EXPENSE'])
    if (walletId) q = q.eq('wallet_id', walletId)
    if (categoryId) q = q.eq('category_id', categoryId)
    if (startDate) q = q.gte('date', startDate)
    if (endDate) q = q.lte('date', endDate)
    if (search) q = q.ilike('description', `%${search}%`)
    if (type && type !== 'ALL' && type !== 'TRANSFER') q = q.eq('type', type)
    return q
  }

  // Balance queries: saldo/previsto (walletId + date only — no category/search/type filter)
  const buildBalanceQ = (isPaid: boolean) => {
    let q = supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', user.id)
      .eq('is_paid', isPaid)
      .in('type', ['INCOME', 'EXPENSE'])
    if (walletId) q = q.eq('wallet_id', walletId)
    if (startDate) q = q.gte('date', startDate)
    if (endDate) q = q.lte('date', endDate)
    return q
  }

  const prevTxQuery = buildPrevTxQ()
  const hasExtraFilters = !!(categoryId || search || (type && type !== 'ALL' && type !== 'TRANSFER'))

  const [walletsRes, prevTxRes, paidPeriodRes, pendingPeriodRes, paidBalanceRes, pendingBalanceRes] =
    await Promise.all([
      walletsQ,
      prevTxQuery ?? Promise.resolve({ data: [] as { type: string; amount: number; wallet_id: string | null; wallet_from_id: string | null; wallet_to_id: string | null }[], error: null }),
      buildPeriodQ(true),
      buildPeriodQ(false),
      hasExtraFilters ? buildBalanceQ(true) : buildPeriodQ(true),
      hasExtraFilters ? buildBalanceQ(false) : buildPeriodQ(false),
    ])

  // Compute saldo anterior
  const initialBalance = walletsRes.data?.reduce((sum, w) => sum + (w.initial_balance ?? 0), 0) ?? 0
  let saldoAnterior = initialBalance

  for (const tx of (prevTxRes.data ?? []) as { type: string; amount: number; wallet_id: string | null; wallet_from_id: string | null; wallet_to_id: string | null }[]) {
    if (tx.type === 'INCOME') {
      if (!walletId || tx.wallet_id === walletId) saldoAnterior += tx.amount
    } else if (tx.type === 'EXPENSE') {
      if (!walletId || tx.wallet_id === walletId) saldoAnterior -= tx.amount
    } else if (tx.type === 'TRANSFER' && walletId) {
      if (tx.wallet_to_id === walletId) saldoAnterior += tx.amount
      if (tx.wallet_from_id === walletId) saldoAnterior -= tx.amount
    }
  }

  // Compute filtered breakdown rows
  let receitaRealizada = 0
  let despesaRealizada = 0
  for (const tx of (paidPeriodRes.data ?? []) as { type: string; amount: number }[]) {
    if (tx.type === 'INCOME') receitaRealizada += tx.amount
    else if (tx.type === 'EXPENSE') despesaRealizada += tx.amount
  }

  let receitaPrevista = 0
  let despesaPrevista = 0
  for (const tx of (pendingPeriodRes.data ?? []) as { type: string; amount: number }[]) {
    if (tx.type === 'INCOME') receitaPrevista += tx.amount
    else if (tx.type === 'EXPENSE') despesaPrevista += tx.amount
  }

  // Compute saldo/previsto from unfiltered period data (walletId + date only)
  let balanceIncome = 0
  let balanceExpense = 0
  for (const tx of (paidBalanceRes.data ?? []) as { type: string; amount: number }[]) {
    if (tx.type === 'INCOME') balanceIncome += tx.amount
    else if (tx.type === 'EXPENSE') balanceExpense += tx.amount
  }

  let prevIncome = 0
  let prevExpense = 0
  for (const tx of (pendingBalanceRes.data ?? []) as { type: string; amount: number }[]) {
    if (tx.type === 'INCOME') prevIncome += tx.amount
    else if (tx.type === 'EXPENSE') prevExpense += tx.amount
  }

  return {
    success: true,
    data: {
      saldoAnterior,
      receitaRealizada,
      receitaPrevista,
      despesaRealizada,
      despesaPrevista,
      saldo: saldoAnterior + balanceIncome - balanceExpense,
      previsto: saldoAnterior + prevIncome - prevExpense,
    },
  }
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
