import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getWallets } from '@/actions/wallets'
import { getUpcomingTransactions, getDashboardSummary, getCategories } from '@/actions/transactions'
import { getCurrentMonthRange } from '@/lib/utils/format'
import { TotalBalanceCard } from '@/components/dashboard/total-balance-card'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { WalletList } from '@/components/dashboard/wallet-list'
import { UpcomingTransactions } from '@/components/dashboard/upcoming-transactions'
import { ExpensesChart } from '@/components/dashboard/expenses-chart'
import { NewTransactionButton } from '@/components/shared/new-transaction-button'
import { NewWalletButton } from '@/components/shared/new-wallet-button'
import { Skeleton } from '@/components/ui/skeleton'
import type { WalletWithBalance, Category } from '@/types'

async function DashboardContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { startDate, endDate } = getCurrentMonthRange()
  const firstName = (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'você'

  const [walletsResult, upcomingResult, summaryResult, categoriesResult] = await Promise.all([
    getWallets(),
    getUpcomingTransactions(),
    getDashboardSummary(startDate, endDate),
    getCategories(),
  ])

  const wallets = walletsResult.success ? (walletsResult.data as WalletWithBalance[]) : []
  const upcoming = upcomingResult.success ? upcomingResult.data : { expenses: [], income: [] }
  const summary = summaryResult.success ? summaryResult.data : { income: 0, expense: 0, categoryExpenses: [] }
  const categories = categoriesResult.success ? (categoriesResult.data as Category[]) : []
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0)

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 text-6xl">💰</div>
        <h2 className="mb-2 text-xl font-bold md:text-2xl">Bem-vindo ao Free Budget, {firstName}!</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Comece criando seu primeiro bolso para controlar suas finanças.
        </p>
        <NewWalletButton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Olá, {firstName}! Aqui está seu resumo financeiro.
          </p>
        </div>
        <div className="hidden md:flex">
          <NewTransactionButton wallets={wallets} categories={categories} />
        </div>
      </div>

      {/* Total balance */}
      <TotalBalanceCard totalBalance={totalBalance} />

      {/* Period summary */}
      <SummaryCards income={summary.income} expense={summary.expense} />

      {/* Upcoming — bills due in the next 7 days */}
      <UpcomingTransactions
        expenses={upcoming.expenses}
        income={upcoming.income}
        wallets={wallets}
        categories={categories}
      />

      {/* Two column layout on desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WalletList wallets={wallets} />
        <ExpensesChart data={summary.categoryExpenses} />
      </div>

      {/* Mobile FAB */}
      <NewTransactionButton wallets={wallets} categories={categories} variant="fab" />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="hidden h-10 w-36 md:block" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
