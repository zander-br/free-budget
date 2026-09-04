import { Suspense } from 'react'
import { getTransactions, getCategories, getTransactionsSummary } from '@/actions/transactions'
import { getAllWallets } from '@/actions/wallets'
import { TransactionItem } from '@/components/transactions/transaction-item'
import { TransactionFilters } from '@/components/transactions/transaction-filters'
import { MonthNavigator } from '@/components/transactions/month-navigator'
import { Pagination } from '@/components/transactions/pagination'
import { TransactionsSummaryFooter } from '@/components/transactions/transactions-summary-footer'
import { NewTransactionButton } from '@/components/shared/new-transaction-button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { WalletWithBalance, Category, TransactionWithDetails, TransactionFilters as Filters } from '@/types'

interface MovimentacoesPageProps {
  searchParams: Promise<{
    type?: string
    walletId?: string
    categoryId?: string
    search?: string
    startDate?: string
    endDate?: string
    page?: string
  }>
}

function getCurrentMonthBounds() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const pad = (n: number) => String(n).padStart(2, '0')
  const lastDay = new Date(year, month + 1, 0).getDate()
  return {
    startDate: `${year}-${pad(month + 1)}-01`,
    endDate: `${year}-${pad(month + 1)}-${pad(lastDay)}`,
  }
}

async function TransactionsContent({ searchParams }: { searchParams: Awaited<MovimentacoesPageProps['searchParams']> }) {
  const page = parseInt(searchParams.page ?? '1') || 1

  const { startDate: defaultStart, endDate: defaultEnd } = getCurrentMonthBounds()

  const filters: Filters = {
    type: (searchParams.type as Filters['type']) ?? 'ALL',
    walletId: searchParams.walletId,
    categoryId: searchParams.categoryId,
    search: searchParams.search,
    startDate: searchParams.startDate ?? defaultStart,
    endDate: searchParams.endDate ?? defaultEnd,
    page,
    pageSize: 10,
  }

  const [transactionsResult, walletsResult, categoriesResult] = await Promise.all([
    getTransactions(filters),
    getAllWallets(),
    getCategories(),
  ])

  const transactionsData = transactionsResult.success
    ? transactionsResult.data
    : { data: [], count: 0, totalPages: 0, page: 1, pageSize: 10 }
  const { data: transactions, count, totalPages } = transactionsData

  const wallets = walletsResult.success ? (walletsResult.data as WalletWithBalance[]) : []
  const categories = categoriesResult.success ? (categoriesResult.data as Category[]) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold md:text-2xl">Movimentações</h1>
        <div className="hidden md:flex">
          <NewTransactionButton wallets={wallets} categories={categories} />
        </div>
      </div>

      {/* Month navigator */}
      <MonthNavigator />

      {/* Filters */}
      <TransactionFilters wallets={wallets} categories={categories} />

      {/* Results */}
      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-2 text-lg font-medium">
              Nenhuma movimentação encontrada.
            </p>
            <p className="text-muted-foreground text-sm">
              Tente ajustar os filtros ou adicione uma nova movimentação.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="divide-y p-2">
            {transactions.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t as TransactionWithDetails}
                wallets={wallets}
                categories={categories}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={10} />

      {/* Mobile FAB — positioned above the summary footer (bottom-16=64px nav + ~52px footer + 8px gap = 124px ≈ bottom-32) */}
      <NewTransactionButton wallets={wallets} categories={categories} variant="fab" fabBottom="bottom-32" />
    </div>
  )
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="hidden h-10 w-36 md:block" />
      </div>
      <Skeleton className="mx-auto h-8 w-48 rounded-full" />
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10 shrink-0" />
      </div>
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default async function MovimentacoesPage({ searchParams }: MovimentacoesPageProps) {
  const params = await searchParams
  const { startDate: defaultStart, endDate: defaultEnd } = getCurrentMonthBounds()

  const summaryFilters: Filters = {
    type: (params.type as Filters['type']) ?? 'ALL',
    walletId: params.walletId,
    categoryId: params.categoryId,
    search: params.search,
    startDate: params.startDate ?? defaultStart,
    endDate: params.endDate ?? defaultEnd,
  }

  const summaryResult = await getTransactionsSummary(summaryFilters)
  const summary = summaryResult.success ? summaryResult.data : null

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 pb-14 md:pb-0">
        <Suspense fallback={<TransactionsSkeleton />}>
          <TransactionsContent searchParams={params} />
        </Suspense>
      </div>

      <TransactionsSummaryFooter summary={summary} />
    </div>
  )
}
