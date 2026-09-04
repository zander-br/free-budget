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

describe('Resumo de movimentações (saldo acumulado e período)', () => {
  type PrevTxEntry = {
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
    amount: number
    wallet_id?: string | null
    wallet_from_id?: string | null
    wallet_to_id?: string | null
  }

  function computeSaldoAnterior(
    initialBalance: number,
    transactions: PrevTxEntry[],
    walletId?: string
  ): number {
    let balance = initialBalance
    for (const tx of transactions) {
      if (tx.type === 'INCOME') {
        if (!walletId || tx.wallet_id === walletId) balance += tx.amount
      } else if (tx.type === 'EXPENSE') {
        if (!walletId || tx.wallet_id === walletId) balance -= tx.amount
      } else if (tx.type === 'TRANSFER' && walletId) {
        if (tx.wallet_to_id === walletId) balance += tx.amount
        if (tx.wallet_from_id === walletId) balance -= tx.amount
      }
    }
    return balance
  }

  function computePeriodTotals(transactions: { type: string; amount: number }[]) {
    let income = 0
    let expense = 0
    for (const tx of transactions) {
      if (tx.type === 'INCOME') income += tx.amount
      else if (tx.type === 'EXPENSE') expense += tx.amount
    }
    return { income, expense }
  }

  it('saldo anterior com saldo inicial e entradas passadas', () => {
    const prev: PrevTxEntry[] = [
      { type: 'INCOME', amount: 500000, wallet_id: WALLET_A },
      { type: 'EXPENSE', amount: 100000, wallet_id: WALLET_A },
    ]
    const saldoAnterior = computeSaldoAnterior(200000, prev)
    expect(saldoAnterior).toBe(200000 + 500000 - 100000) // 600000
  })

  it('saldo anterior filtrado por bolso específico ignora outros bolsos', () => {
    const prev: PrevTxEntry[] = [
      { type: 'INCOME', amount: 300000, wallet_id: WALLET_A },
      { type: 'INCOME', amount: 100000, wallet_id: WALLET_B }, // outro bolso
      { type: 'EXPENSE', amount: 50000, wallet_id: WALLET_A },
    ]
    const saldoAnterior = computeSaldoAnterior(100000, prev, WALLET_A)
    expect(saldoAnterior).toBe(100000 + 300000 - 50000) // 350000
  })

  it('saldo anterior inclui transferências recebidas pelo bolso', () => {
    const prev: PrevTxEntry[] = [
      { type: 'TRANSFER', amount: 200000, wallet_from_id: WALLET_A, wallet_to_id: WALLET_B },
    ]
    // WALLET_B recebe a transferência → saldo aumenta
    const saldoB = computeSaldoAnterior(0, prev, WALLET_B)
    expect(saldoB).toBe(200000)

    // WALLET_A perde a transferência → saldo diminui
    const saldoA = computeSaldoAnterior(500000, prev, WALLET_A)
    expect(saldoA).toBe(300000)
  })

  it('sem filtro de bolso, transferências são neutras no total', () => {
    // Quando não há filtro por bolso, transferências são excluídas da query
    // e o total de todos os bolsos é calculado apenas com INCOME/EXPENSE
    const prev: PrevTxEntry[] = [
      { type: 'INCOME', amount: 500000, wallet_id: WALLET_A },
      { type: 'EXPENSE', amount: 200000, wallet_id: WALLET_B },
    ]
    const total = computeSaldoAnterior(0, prev) // sem walletId
    expect(total).toBe(500000 - 200000) // 300000
  })

  it('saldo = saldoAnterior + receitaRealizada - despesaRealizada', () => {
    const saldoAnterior = 6252351 // 62.523,51 em centavos
    const { income, expense } = computePeriodTotals([
      { type: 'INCOME', amount: 0 },
      { type: 'EXPENSE', amount: 194938 },
    ])
    const saldo = saldoAnterior + income - expense
    expect(saldo).toBe(6057413) // 60.574,13 em centavos
  })

  it('previsto = saldoAnterior + receitaPrevista - despesaPrevista', () => {
    const saldoAnterior = 6252351
    const { income, expense } = computePeriodTotals([
      { type: 'INCOME', amount: 3220400 },
      { type: 'EXPENSE', amount: 6466722 },
    ])
    const previsto = saldoAnterior + income - expense
    expect(previsto).toBe(3006029) // 30.060,29 em centavos
  })

  it('saldo negativo quando despesas superam o saldo anterior', () => {
    const saldoAnterior = 100000
    const { income, expense } = computePeriodTotals([
      { type: 'EXPENSE', amount: 200000 },
    ])
    const saldo = saldoAnterior + income - expense
    expect(saldo).toBe(-100000)
  })

  it('resumo com transações de múltiplos tipos no período', () => {
    const paidTx = [
      { type: 'INCOME', amount: 500000 },
      { type: 'EXPENSE', amount: 120000 },
      { type: 'EXPENSE', amount: 35000 },
    ]
    const pendingTx = [
      { type: 'INCOME', amount: 300000 },
      { type: 'EXPENSE', amount: 80000 },
    ]

    const paidTotals = computePeriodTotals(paidTx)
    const pendingTotals = computePeriodTotals(pendingTx)

    expect(paidTotals.income).toBe(500000)
    expect(paidTotals.expense).toBe(155000)
    expect(pendingTotals.income).toBe(300000)
    expect(pendingTotals.expense).toBe(80000)

    const saldoAnterior = 1000000
    const saldo = saldoAnterior + paidTotals.income - paidTotals.expense
    const previsto = saldoAnterior + pendingTotals.income - pendingTotals.expense

    expect(saldo).toBe(1345000) // 1.000.000 + 500.000 - 155.000
    expect(previsto).toBe(1220000) // 1.000.000 + 300.000 - 80.000
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
