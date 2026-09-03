import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { TransactionItem } from '@/components/transactions/transaction-item'
import { cn } from '@/lib/utils'
import type { TransactionWithDetails, WalletWithBalance, Category } from '@/types'

interface RecentTransactionsProps {
  transactions: TransactionWithDetails[]
  wallets: WalletWithBalance[]
  categories: Category[]
}

export function RecentTransactions({ transactions, wallets, categories }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-8 text-center text-sm">
            Nenhuma movimentação registrada ainda.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Últimas movimentações</CardTitle>
        <Link href="/movimentacoes" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          Ver todas
        </Link>
      </CardHeader>
      <CardContent className="space-y-1 p-2">
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            wallets={wallets}
            categories={categories}
          />
        ))}
      </CardContent>
    </Card>
  )
}
