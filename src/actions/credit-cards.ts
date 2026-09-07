'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createCreditCardSchema, updateCreditCardSchema } from '@/lib/validations/credit-card'
import { toCents } from '@/lib/utils/format'
import type { CreditCard, CreditCardWithUsage } from '@/types'
import type { ActionResult } from './wallets'
import type { Database } from '@/types/supabase'

type CreditCardInsert = Database['public']['Tables']['credit_cards']['Insert']

export async function getCreditCards(): Promise<ActionResult<CreditCard[]>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) return { success: false, error: error.message }

  return { success: true, data: (data as CreditCard[]) ?? [] }
}

export async function getAllCreditCards(): Promise<ActionResult<CreditCard[]>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return { success: false, error: error.message }

  return { success: true, data: (data as CreditCard[]) ?? [] }
}

export async function getCreditCardById(id: string): Promise<ActionResult<CreditCard>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return { success: false, error: 'Cartão não encontrado' }

  return { success: true, data: data as CreditCard }
}

export async function createCreditCard(formData: {
  name: string
  credit_limit?: number
  closing_day?: number
  due_day?: number
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = createCreditCardSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { name, credit_limit, closing_day, due_day } = parsed.data

  const insertData: CreditCardInsert = {
    user_id: user.id,
    name,
    credit_limit: toCents(credit_limit),
    closing_day,
    due_day,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.from('credit_cards').insert(insertData as any).select('id').single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/cartoes')

  return { success: true, data: { id: (data as { id: string }).id } }
}

export async function updateCreditCard(
  id: string,
  formData: {
    name?: string
    credit_limit?: number
    closing_day?: number
    due_day?: number
  }
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = updateCreditCardSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updates.name = parsed.data.name
  if (parsed.data.credit_limit !== undefined) updates.credit_limit = toCents(parsed.data.credit_limit)
  if (parsed.data.closing_day !== undefined) updates.closing_day = parsed.data.closing_day
  if (parsed.data.due_day !== undefined) updates.due_day = parsed.data.due_day

  const { error } = await supabase.from('credit_cards').update(updates).eq('id', id).eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/cartoes')
  revalidatePath(`/cartoes/${id}`)

  return { success: true, data: undefined }
}

export async function deactivateCreditCard(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase
    .from('credit_cards')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/cartoes')

  return { success: true, data: undefined }
}

export async function reactivateCreditCard(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase
    .from('credit_cards')
    .update({ is_active: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/cartoes')

  return { success: true, data: undefined }
}

/**
 * Returns credit cards with current invoice info for the Dashboard.
 * For each card, calculates: used_amount, available_limit, current_invoice_amount, invoice_due_date.
 */
export async function getCreditCardsSummary(
  startDate: string,
  endDate: string
): Promise<ActionResult<CreditCardWithUsage[]>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  // Get active credit cards from the view (which includes balance)
  const { data: cards, error: cardsError } = await supabase
    .from('credit_card_balances')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (cardsError) return { success: false, error: cardsError.message }
  if (!cards || cards.length === 0) return { success: true, data: [] }

  // We still need to calculate the *current* invoice amount to display on the card
  // This is the sum of purchases for the current period
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const result: CreditCardWithUsage[] = await Promise.all(
    cards.map(async (card) => {
      // Find the current invoice period (roughly from previous closing to current closing)
      // To simplify for the UI, we can just calculate the due date and find the open invoice for it
      // Actually, since the view gives us the *global* balance, we can just use `balance` as `used_amount`
      // Wait, what does the user expect "Fatura Atual" to be? 
      // It should be the amount of the pending invoice that is due next!
      // Let's just fetch the pending invoices.
      const { data: pendingInvoices } = await supabase
        .from('transactions')
        .select('amount, date')
        .eq('user_id', user.id)
        .eq('credit_card_id', card.id)
        .eq('is_paid', false)
        .ilike('description', 'Fatura - %')
        .order('date', { ascending: true })

      // The next due invoice
      const currentInvoice = pendingInvoices?.[0]
      const invoiceAmount = currentInvoice?.amount ?? 0
      const invoiceDueDate = currentInvoice?.date ?? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(card.due_day).padStart(2, '0')}`

      return {
        id: card.id,
        user_id: card.user_id,
        name: card.name,
        credit_limit: card.credit_limit,
        due_day: card.due_day,
        closing_day: card.closing_day,
        is_active: card.is_active,
        used_amount: card.balance,
        available_limit: card.credit_limit - card.balance,
        current_invoice_amount: invoiceAmount,
        invoice_due_date: invoiceDueDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })
  )

  return { success: true, data: result }
}

/**
 * Creates or updates the invoice transaction for a credit card based on a transaction date.
 * The invoice is an EXPENSE transaction with wallet_id=NULL, is_paid=false,
 * dated on the card's calculated due date for the invoice period.
 */
export async function upsertInvoiceTransaction(
  creditCardId: string,
  transactionDate: string, // e.g. '2026-10-07'
  exactDueDate?: string // e.g. '2026-10-15' (if provided, bypasses transactionDate period calculation)
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  // Get the credit card
  const { data: card, error: cardError } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('id', creditCardId)
    .eq('user_id', user.id)
    .single()

  if (cardError || !card) return { success: false, error: 'Cartão não encontrado' }

  // Compute the invoice period (startDate, endDate, dueDate)
  let targetClosingDate: Date
  let targetDueDate: Date

  if (exactDueDate) {
    const parts = exactDueDate.split('-')
    const dueYear = parseInt(parts[0], 10)
    const dueMonth = parseInt(parts[1], 10) - 1
    const dueDay = parseInt(parts[2], 10)
    targetDueDate = new Date(dueYear, dueMonth, dueDay)

    if (card.due_day >= card.closing_day) {
      // e.g. close 10, due 15 -> same month
      const daysInMonth = new Date(dueYear, dueMonth + 1, 0).getDate()
      const cDay = Math.min(card.closing_day, daysInMonth)
      targetClosingDate = new Date(dueYear, dueMonth, cDay)
    } else {
      // e.g. close 25, due 5 -> closing is previous month
      const daysInPrevMonth = new Date(dueYear, dueMonth, 0).getDate()
      const cDay = Math.min(card.closing_day, daysInPrevMonth)
      targetClosingDate = new Date(dueYear, dueMonth - 1, cDay)
    }
  } else {
    const tDate = new Date(`${transactionDate}T00:00:00`)
    const tYear = tDate.getFullYear()
    const tMonth = tDate.getMonth()

    // Closing date for the transaction's month
    const daysInMonth = new Date(tYear, tMonth + 1, 0).getDate()
    const cDay = Math.min(card.closing_day, daysInMonth)
    const cDate = new Date(tYear, tMonth, cDay)

    if (tDate <= cDate) {
      targetClosingDate = cDate
    } else {
      // Next month's closing date
      const nextMonthDays = new Date(tYear, tMonth + 2, 0).getDate()
      const nextCDay = Math.min(card.closing_day, nextMonthDays)
      targetClosingDate = new Date(tYear, tMonth + 1, nextCDay)
    }

    // Due date is the first due_day strictly after (or equal) targetClosingDate
    targetDueDate = new Date(targetClosingDate.getFullYear(), targetClosingDate.getMonth(), card.due_day)
    if (targetDueDate <= targetClosingDate) {
      targetDueDate = new Date(targetClosingDate.getFullYear(), targetClosingDate.getMonth() + 1, card.due_day)
    }
  }

  // Start date is day after previous closing date
  const prevMonthDays = new Date(targetClosingDate.getFullYear(), targetClosingDate.getMonth(), 0).getDate()
  const prevCDay = Math.min(card.closing_day, prevMonthDays)
  const prevClosingDate = new Date(targetClosingDate.getFullYear(), targetClosingDate.getMonth() - 1, prevCDay)
  const startDate = new Date(prevClosingDate)
  startDate.setDate(startDate.getDate() + 1)

  const pad = (n: number) => String(n).padStart(2, '0')
  const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  const invoiceStartDateStr = toStr(startDate)
  const invoiceEndDateStr = toStr(targetClosingDate)
  const invoiceDueDateStr = toStr(targetDueDate)

  const invoiceDescription = `Fatura - ${card.name}`

  // Sum all credit card transactions for this period (excluding invoice transactions)
  const { data: txData, error: txError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', user.id)
    .eq('credit_card_id', creditCardId)
    .eq('type', 'EXPENSE')
    .not('description', 'ilike', 'Fatura - %')
    .gte('date', invoiceStartDateStr)
    .lte('date', invoiceEndDateStr)

  if (txError) return { success: false, error: txError.message }

  const totalAmount = (txData ?? []).reduce((sum, tx) => sum + tx.amount, 0)

  // Sum all PAID invoices for this exact cycle
  const { data: paidTxData } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', user.id)
    .eq('credit_card_id', creditCardId)
    .eq('type', 'EXPENSE')
    .eq('is_paid', true)
    .eq('description', invoiceDescription)
    .eq('cycle_date', invoiceDueDateStr)

  const totalPaid = (paidTxData ?? []).reduce((sum, tx) => sum + tx.amount, 0)
  const remainingAmount = totalAmount - totalPaid

  // Find existing UNPAID invoice transaction for this exact cycle
  const { data: pendingInvoice } = await supabase
    .from('transactions')
    .select('id, amount, is_paid, wallet_id')
    .eq('user_id', user.id)
    .eq('credit_card_id', creditCardId)
    .eq('type', 'EXPENSE')
    .eq('description', invoiceDescription)
    .eq('cycle_date', invoiceDueDateStr)
    .eq('is_paid', false)
    .limit(1)
    .maybeSingle()

  if (remainingAmount <= 0) {
    // No remaining debt for this period — delete any pending unpaid invoice
    if (pendingInvoice) {
      await supabase.from('transactions').delete().eq('id', pendingInvoice.id).eq('user_id', user.id)
    }
  } else {
    if (pendingInvoice) {
      // Update existing pending invoice
      await supabase
        .from('transactions')
        .update({ amount: remainingAmount })
        .eq('id', pendingInvoice.id)
        .eq('user_id', user.id)
    } else {
      // Create new pending invoice
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'EXPENSE' as const,
        amount: remainingAmount,
        date: invoiceDueDateStr,
        description: invoiceDescription,
        credit_card_id: creditCardId,
        category_id: null,
        wallet_id: null,
        wallet_from_id: null,
        wallet_to_id: null,
        invoice_id: null,
        notes: `Período: ${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)} a ${pad(targetClosingDate.getDate())}/${pad(targetClosingDate.getMonth() + 1)}`,
        is_paid: false,
        cycle_date: invoiceDueDateStr,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/movimentacoes')
  revalidatePath('/cartoes')

  return { success: true, data: undefined }
}

/**
 * Pay an invoice transaction: sets wallet_id and is_paid = true
 */
export async function payInvoice(
  invoiceTransactionId: string,
  walletId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  // Verify the invoice exists and belongs to the user
  const { data: invoice } = await supabase
    .from('transactions')
    .select('id, credit_card_id, is_paid, description')
    .eq('id', invoiceTransactionId)
    .eq('user_id', user.id)
    .single()

  if (!invoice) return { success: false, error: 'Fatura não encontrada' }
  if (invoice.is_paid) return { success: false, error: 'Fatura já foi paga' }
  if (!invoice.credit_card_id) return { success: false, error: 'Esta movimentação não é uma fatura de cartão' }

  // Verify wallet belongs to user
  const { data: wallet } = await supabase
    .from('wallets')
    .select('id')
    .eq('id', walletId)
    .eq('user_id', user.id)
    .single()

  if (!wallet) return { success: false, error: 'Bolso não encontrado' }

  // Get expense category for invoice (use first EXPENSE category available)
  const { data: expenseCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('type', 'EXPENSE')
    .limit(1)
    .single()

  const { error } = await supabase
    .from('transactions')
    .update({
      wallet_id: walletId,
      category_id: expenseCategory?.id ?? null,
      is_paid: true,
    })
    .eq('id', invoiceTransactionId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/movimentacoes')
  revalidatePath('/bolsos')
  revalidatePath('/cartoes')

  return { success: true, data: undefined }
}
