import { describe, it, expect } from 'vitest'
import { createWalletSchema } from '@/lib/validations/wallet'
import { createIncomeSchema, createExpenseSchema, createTransferSchema } from '@/lib/validations/transaction'

describe('Validação de bolsos', () => {
  it('aceita bolso válido', () => {
    const result = createWalletSchema.safeParse({
      name: 'Nubank',
      icon: 'wallet',
      color: '#7C3AED',
      initial_balance: 1000,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita nome vazio', () => {
    const result = createWalletSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita nome muito longo', () => {
    const result = createWalletSchema.safeParse({ name: 'a'.repeat(51) })
    expect(result.success).toBe(false)
  })

  it('rejeita saldo inicial negativo', () => {
    const result = createWalletSchema.safeParse({ name: 'Banco', initial_balance: -100 })
    expect(result.success).toBe(false)
  })

  it('aceita saldo inicial zero', () => {
    const result = createWalletSchema.safeParse({ name: 'Banco', initial_balance: 0 })
    expect(result.success).toBe(true)
  })
})

describe('Validação de movimentações — Entrada', () => {
  const validIncome = {
    type: 'INCOME' as const,
    amount: 5000,
    date: '2026-09-01',
    wallet_id: 'wallet-uuid',
    category_id: 'category-uuid',
  }

  it('aceita entrada válida', () => {
    const result = createIncomeSchema.safeParse(validIncome)
    expect(result.success).toBe(true)
  })

  it('rejeita valor zero', () => {
    const result = createIncomeSchema.safeParse({ ...validIncome, amount: 0 })
    expect(result.success).toBe(false)
  })

  it('rejeita valor negativo', () => {
    const result = createIncomeSchema.safeParse({ ...validIncome, amount: -100 })
    expect(result.success).toBe(false)
  })

  it('rejeita sem bolso', () => {
    const result = createIncomeSchema.safeParse({ ...validIncome, wallet_id: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita sem categoria', () => {
    const result = createIncomeSchema.safeParse({ ...validIncome, category_id: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita sem data', () => {
    const result = createIncomeSchema.safeParse({ ...validIncome, date: '' })
    expect(result.success).toBe(false)
  })
})

describe('Validação de movimentações — Saída', () => {
  it('aceita saída válida', () => {
    const result = createExpenseSchema.safeParse({
      type: 'EXPENSE',
      amount: 350,
      date: '2026-09-02',
      wallet_id: 'wallet-uuid',
      category_id: 'category-uuid',
    })
    expect(result.success).toBe(true)
  })
})

describe('Validação de movimentações — Transferência', () => {
  const validTransfer = {
    type: 'TRANSFER' as const,
    amount: 500,
    date: '2026-09-03',
    wallet_from_id: 'wallet-a',
    wallet_to_id: 'wallet-b',
  }

  it('aceita transferência válida', () => {
    const result = createTransferSchema.safeParse(validTransfer)
    expect(result.success).toBe(true)
  })

  it('rejeita transferência para o mesmo bolso', () => {
    const result = createTransferSchema.safeParse({
      ...validTransfer,
      wallet_to_id: 'wallet-a',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const toIdError = result.error.issues.find((e) => e.path.includes('wallet_to_id'))
      expect(toIdError).toBeTruthy()
    }
  })

  it('rejeita sem bolso de origem', () => {
    const result = createTransferSchema.safeParse({ ...validTransfer, wallet_from_id: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita sem bolso de destino', () => {
    const result = createTransferSchema.safeParse({ ...validTransfer, wallet_to_id: '' })
    expect(result.success).toBe(false)
  })

  it('aceita descrição opcional', () => {
    const result = createTransferSchema.safeParse({
      ...validTransfer,
      description: 'Transferência mensal',
    })
    expect(result.success).toBe(true)
  })
})
