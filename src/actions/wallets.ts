'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createWalletSchema, updateWalletSchema } from '@/lib/validations/wallet'
import { toCents } from '@/lib/utils/format'
import type { WalletWithBalance } from '@/types'
import type { Database } from '@/types/supabase'

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

type WalletInsert = Database['public']['Tables']['wallets']['Insert']
type WalletUpdate = Database['public']['Tables']['wallets']['Update']

export async function getWallets(): Promise<ActionResult<WalletWithBalance[]>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('wallet_balances')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) return { success: false, error: error.message }

  return { success: true, data: (data as WalletWithBalance[]) ?? [] }
}

export async function getAllWallets(): Promise<ActionResult<WalletWithBalance[]>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('wallet_balances')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return { success: false, error: error.message }

  return { success: true, data: (data as WalletWithBalance[]) ?? [] }
}

export async function getWalletById(id: string): Promise<ActionResult<WalletWithBalance>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('wallet_balances')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return { success: false, error: 'Bolso não encontrado' }

  return { success: true, data: data as WalletWithBalance }
}

export async function createWallet(formData: {
  name: string
  icon?: string
  color?: string
  initial_balance?: number
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = createWalletSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { name, icon, color, initial_balance } = parsed.data

  const insertData: WalletInsert = {
    user_id: user.id,
    name,
    icon: icon ?? 'wallet',
    color: color ?? '#7C3AED',
    initial_balance: toCents(initial_balance ?? 0),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.from('wallets').insert(insertData as any).select('id').single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/bolsos')

  return { success: true, data: { id: (data as { id: string }).id } }
}

export async function updateWallet(
  id: string,
  formData: {
    name?: string
    icon?: string
    color?: string
    initial_balance?: number
  }
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = updateWalletSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const updates: WalletUpdate = {}
  if (parsed.data.name !== undefined) updates.name = parsed.data.name
  if (parsed.data.icon !== undefined) updates.icon = parsed.data.icon
  if (parsed.data.color !== undefined) updates.color = parsed.data.color
  if (parsed.data.initial_balance !== undefined) {
    updates.initial_balance = toCents(parsed.data.initial_balance)
  }

  const { error } = await supabase.from('wallets').update(updates).eq('id', id).eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/bolsos')
  revalidatePath(`/bolsos/${id}`)

  return { success: true, data: undefined }
}

export async function deactivateWallet(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase
    .from('wallets')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/bolsos')

  return { success: true, data: undefined }
}

export async function reactivateWallet(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { error } = await supabase
    .from('wallets')
    .update({ is_active: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/bolsos')

  return { success: true, data: undefined }
}
