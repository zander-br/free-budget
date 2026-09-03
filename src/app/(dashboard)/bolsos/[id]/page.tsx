import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'
import { getWalletById, getAllWallets } from '@/actions/wallets'
import { getTransactions, getCategories } from '@/actions/transactions'
import { formatCurrency } from '@/lib/utils/format'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WalletIcon } from '@/components/shared/wallet-icon'
import { TransactionItem } from '@/components/transactions/transaction-item'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { WalletWithBalance, Category, TransactionWithDetails } from '@/types'

interface WalletDetailPageProps {
  params: Promise<{ id: string }>
}

async function WalletDetailContent({ id }: { id: string }) {
  const [walletResult, categoriesResult, walletsResult] = await Promise.all([
    getWalletById(id),
    getCategories(),
    getAllWallets(),
  ])

  if (!walletResult.success) notFound()

  const wallet = walletResult.data as WalletWithBalance
  const categories = categoriesResult.success ? (categoriesResult.data as Category[]) : []
  const wallets = walletsResult.success ? (walletsResult.data as WalletWithBalance[]) : []

  const transactionsResult = await getTransactions({ walletId: id, pageSize: 20 })

  const transactions = transactionsResult.success ? transactionsResult.data.data : []

  const walletTransactions = transactions as TransactionWithDetails[]
  const walletIncome = walletTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0)
  const walletExpense = walletTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/bolsos" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}>
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        Voltar
      </Link>

      {/* Wallet header */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${wallet.color ?? '#7C3AED'}20` }}
          aria-hidden="true"
        >
          <WalletIcon
            icon={wallet.icon}
            className="h-8 w-8"
            style={{ color: wallet.color ?? '#7C3AED' }}
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{wallet.name}</h1>
          <p className="text-muted-foreground text-sm">
            {wallet.is_active ? 'Ativo' : 'Inativo'} • Criado em{' '}
            {new Date(wallet.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="from-primary to-primary/80 text-primary-foreground bg-gradient-to-br sm:col-span-1">
          <CardContent className="pt-6">
            <p className="text-sm font-medium opacity-90">Saldo atual</p>
            <p className="text-3xl font-bold">{formatCurrency(wallet.balance)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Entradas</p>
                <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(walletIncome)}
                </p>
              </div>
              <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Saídas</p>
                <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(walletExpense)}
                </p>
              </div>
              <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <div className="flex items-center justify-between p-4 pb-0">
          <h2 className="font-semibold">Movimentações</h2>
        </div>
        <div className="p-2">
          {transactions.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Nenhuma movimentação neste bolso ainda.
            </p>
          ) : (
            transactions.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t as TransactionWithDetails}
                wallets={wallets}
                categories={categories}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

export default async function WalletDetailPage({ params }: WalletDetailPageProps) {
  const { id } = await params
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <WalletDetailContent id={id} />
    </Suspense>
  )
}
