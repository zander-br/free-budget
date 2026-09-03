import { describe, it, expect } from 'vitest'

// Regras financeiras puras — sem depender do banco
// Testam a lógica de cálculo de saldo

type TxEntry = {
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  amount: number
  wallet_id?: string
  wallet_from_id?: string
  wallet_to_id?: string
}

function calculateBalance(
  initialBalance: number,
  transactions: TxEntry[],
  walletId: string
): number {
  return (
    initialBalance +
    transactions.reduce((sum, t) => {
      if (t.type === 'INCOME' && t.wallet_id === walletId) return sum + t.amount
      if (t.type === 'EXPENSE' && t.wallet_id === walletId) return sum - t.amount
      if (t.type === 'TRANSFER' && t.wallet_from_id === walletId) return sum - t.amount
      if (t.type === 'TRANSFER' && t.wallet_to_id === walletId) return sum + t.amount
      return sum
    }, 0)
  )
}

function totalPatrimony(
  wallets: Array<{ id: string; initialBalance: number }>,
  transactions: TxEntry[]
): number {
  return wallets.reduce((sum, w) => sum + calculateBalance(w.initialBalance, transactions, w.id), 0)
}

const WALLET_A = 'wallet-a'
const WALLET_B = 'wallet-b'

describe('Regras financeiras', () => {
  it('entrada aumenta o saldo do bolso', () => {
    const balance = calculateBalance(
      100000,
      [{ type: 'INCOME', amount: 500000, wallet_id: WALLET_A }],
      WALLET_A
    )
    expect(balance).toBe(600000)
  })

  it('saída reduz o saldo do bolso', () => {
    const balance = calculateBalance(
      500000,
      [{ type: 'EXPENSE', amount: 35000, wallet_id: WALLET_A }],
      WALLET_A
    )
    expect(balance).toBe(465000)
  })

  it('transferência reduz saldo da origem', () => {
    const balance = calculateBalance(
      500000,
      [{ type: 'TRANSFER', amount: 50000, wallet_from_id: WALLET_A, wallet_to_id: WALLET_B }],
      WALLET_A
    )
    expect(balance).toBe(450000)
  })

  it('transferência aumenta saldo do destino', () => {
    const balance = calculateBalance(
      200000,
      [{ type: 'TRANSFER', amount: 50000, wallet_from_id: WALLET_A, wallet_to_id: WALLET_B }],
      WALLET_B
    )
    expect(balance).toBe(250000)
  })

  it('transferência não altera o patrimônio total', () => {
    const wallets = [
      { id: WALLET_A, initialBalance: 500000 },
      { id: WALLET_B, initialBalance: 200000 },
    ]
    const transactions: TxEntry[] = [
      { type: 'TRANSFER', amount: 100000, wallet_from_id: WALLET_A, wallet_to_id: WALLET_B },
    ]

    const before = totalPatrimony(wallets, [])
    const after = totalPatrimony(wallets, transactions)
    expect(after).toBe(before)
  })

  it('múltiplas transações calculadas corretamente', () => {
    const balance = calculateBalance(
      0,
      [
        { type: 'INCOME', amount: 500000, wallet_id: WALLET_A },
        { type: 'EXPENSE', amount: 35000, wallet_id: WALLET_A },
        { type: 'EXPENSE', amount: 18000, wallet_id: WALLET_A },
        { type: 'TRANSFER', amount: 50000, wallet_from_id: WALLET_A, wallet_to_id: WALLET_B },
      ],
      WALLET_A
    )
    expect(balance).toBe(397000)
  })

  it('transação de outro bolso não afeta este bolso', () => {
    const balance = calculateBalance(
      100000,
      [
        { type: 'INCOME', amount: 500000, wallet_id: WALLET_B },
        { type: 'EXPENSE', amount: 100000, wallet_id: WALLET_B },
      ],
      WALLET_A
    )
    expect(balance).toBe(100000)
  })
})

describe('Validação de valores monetários', () => {
  function toCents(value: number): number {
    return Math.round(value * 100)
  }

  function fromCents(cents: number): number {
    return cents / 100
  }

  it('converte reais para centavos corretamente', () => {
    expect(toCents(10.5)).toBe(1050)
    expect(toCents(1234.56)).toBe(123456)
    expect(toCents(0.01)).toBe(1)
    expect(toCents(1000)).toBe(100000)
  })

  it('converte centavos para reais corretamente', () => {
    expect(fromCents(1050)).toBe(10.5)
    expect(fromCents(123456)).toBe(1234.56)
    expect(fromCents(1)).toBe(0.01)
  })

  it('valor zero é inválido para movimentação', () => {
    const isValid = (amount: number) => amount > 0
    expect(isValid(0)).toBe(false)
    expect(isValid(-100)).toBe(false)
    expect(isValid(1)).toBe(true)
    expect(isValid(100000)).toBe(true)
  })
})

describe('Validação de transferências', () => {
  it('transferência para o mesmo bolso é inválida', () => {
    const isValidTransfer = (fromId: string, toId: string) => fromId !== toId
    expect(isValidTransfer(WALLET_A, WALLET_A)).toBe(false)
    expect(isValidTransfer(WALLET_A, WALLET_B)).toBe(true)
  })

  it('campos obrigatórios de transferência devem estar presentes', () => {
    const hasRequiredFields = (data: { wallet_from_id?: string; wallet_to_id?: string }) =>
      !!data.wallet_from_id && !!data.wallet_to_id
    expect(hasRequiredFields({})).toBe(false)
    expect(hasRequiredFields({ wallet_from_id: WALLET_A })).toBe(false)
    expect(hasRequiredFields({ wallet_from_id: WALLET_A, wallet_to_id: WALLET_B })).toBe(true)
  })
})
