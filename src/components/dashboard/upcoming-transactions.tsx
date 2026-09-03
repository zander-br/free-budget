'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { TransactionItem } from '@/components/transactions/transaction-item'
import { cn } from '@/lib/utils'
import type { TransactionWithDetails, WalletWithBalance, Category } from '@/types'

const PREVIEW_COUNT = 3

interface UpcomingCardProps {
  title: string
  icon: React.ReactNode
  transactions: TransactionWithDetails[]
  wallets: WalletWithBalance[]
  categories: Category[]
  emptyMessage: string
  linkHref: string
  titleClass: string
}

function UpcomingCard({
  title,
  icon,
  transactions,
  wallets,
  categories,
  emptyMessage,
  linkHref,
  titleClass,
}: UpcomingCardProps) {
  const [showAll, setShowAll] = useState(false)
  const hasMore = transactions.length > PREVIEW_COUNT
  const visible = showAll ? transactions : transactions.slice(0, PREVIEW_COUNT)
  const hiddenCount = transactions.length - PREVIEW_COUNT

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={cn('flex items-center gap-1.5 text-sm font-semibold', titleClass)}>
          {icon}
          {title}
        </CardTitle>
        {transactions.length > 0 && (
          <span className="text-muted-foreground text-xs tabular-nums">
            {transactions.length} {transactions.length === 1 ? 'item' : 'itens'}
          </span>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-2">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <CheckCircle2 className="text-muted-foreground/30 h-8 w-8" />
            <p className="text-muted-foreground text-xs">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {visible.map((t) => (
                <TransactionItem
                  key={t.id}
                  transaction={t}
                  wallets={wallets}
                  categories={categories}
                />
              ))}
            </div>

            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 w-full gap-1 text-xs"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    Ver mais ({hiddenCount})
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>

      {transactions.length > 0 && (
        <div className="border-t px-2 py-1.5">
          <Link
            href={linkHref}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'w-full text-xs')}
          >
            Ver na lista de movimentações
          </Link>
        </div>
      )}
    </Card>
  )
}

interface UpcomingTransactionsProps {
  expenses: TransactionWithDetails[]
  income: TransactionWithDetails[]
  wallets: WalletWithBalance[]
  categories: Category[]
}

export function UpcomingTransactions({
  expenses,
  income,
  wallets,
  categories,
}: UpcomingTransactionsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <UpcomingCard
        title="Contas a pagar"
        icon={<TrendingDown className="h-4 w-4" aria-hidden="true" />}
        transactions={expenses}
        wallets={wallets}
        categories={categories}
        emptyMessage="Nenhuma conta a pagar nos próximos 7 dias"
        linkHref="/movimentacoes?type=EXPENSE"
        titleClass="text-red-600 dark:text-red-400"
      />
      <UpcomingCard
        title="Contas a receber"
        icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
        transactions={income}
        wallets={wallets}
        categories={categories}
        emptyMessage="Nenhuma conta a receber nos próximos 7 dias"
        linkHref="/movimentacoes?type=INCOME"
        titleClass="text-green-600 dark:text-green-400"
      />
    </div>
  )
}
