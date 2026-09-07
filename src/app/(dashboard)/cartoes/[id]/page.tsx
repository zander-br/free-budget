import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { getCreditCardById, getCreditCardsSummary } from '@/actions/credit-cards'
import { getTransactions, getCategories } from '@/actions/transactions'
import { getAllWallets } from '@/actions/wallets'
import { getCreditCards } from '@/actions/credit-cards'
import { formatCurrency } from '@/lib/utils/format'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { MonthNavigator } from '@/components/transactions/month-navigator'
import { InfiniteTransactionList } from '@/components/transactions/infinite-transaction-list'
import type { CreditCard, WalletWithBalance, Category, TransactionWithDetails, TransactionFilters as Filters } from '@/types'

interface CreditCardDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    startDate?: string
    endDate?: string
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

async function CreditCardDetailContent({ 
  id, 
  searchParams 
}: { 
  id: string
  searchParams: Awaited<CreditCardDetailPageProps['searchParams']>
}) {
  const { startDate: defaultStart, endDate: defaultEnd } = getCurrentMonthBounds()
  const startDate = searchParams.startDate ?? defaultStart
  const endDate = searchParams.endDate ?? defaultEnd

  const filters: Filters = {
    type: 'ALL',
    creditCardId: id,
    startDate,
    endDate,
    page: 1,
    pageSize: 10,
  }

  const [
    cardResult, 
    categoriesResult, 
    walletsResult, 
    allCardsResult, 
    transactionsResult,
    summaryResult
  ] = await Promise.all([
    getCreditCardById(id),
    getCategories(),
    getAllWallets(),
    getCreditCards(),
    getTransactions(filters),
    getCreditCardsSummary(startDate, endDate)
  ])

  if (!cardResult.success) notFound()

  const card = cardResult.data as CreditCard
  const categories = categoriesResult.success ? (categoriesResult.data as Category[]) : []
  const wallets = walletsResult.success ? (walletsResult.data as WalletWithBalance[]) : []
  const creditCards = allCardsResult.success ? (allCardsResult.data as CreditCard[]) : []

  const transactionsData = transactionsResult.success
    ? transactionsResult.data
    : { data: [], count: 0, totalPages: 0, page: 1, pageSize: 10 }
  const { data: transactions, totalPages } = transactionsData

  const creditCardsWithUsage = summaryResult.success ? summaryResult.data : []
  const cardUsage = creditCardsWithUsage.find((cc) => cc.id === id)
  
  // Para mostrar os totais da fatura neste período, somamos todas as despesas filtradas
  const walletTransactions = transactions as TransactionWithDetails[]
  const currentMonthExpenses = walletTransactions
    .filter((t) => t.type === 'EXPENSE' && !t.description?.startsWith('Fatura -'))
    .reduce((sum, t) => sum + t.amount, 0)
    
  // Fatura paga no período
  const paidInvoiceAmount = walletTransactions
    .filter((t) => t.type === 'EXPENSE' && t.description?.startsWith('Fatura -') && t.is_paid)
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/cartoes" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}>
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        Voltar
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30"
          aria-hidden="true"
        >
          <div className="h-8 w-8 text-violet-600 dark:text-violet-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold md:text-2xl">{card.name}</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <span>{card.is_active ? 'Ativo' : 'Inativo'}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Fecha dia {card.closing_day}
            </span>
          </p>
        </div>
      </div>
      
      {/* Resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="from-violet-600 to-indigo-600 text-white bg-gradient-to-br">
          <CardContent className="pt-6">
            <p className="text-sm font-medium opacity-90">Total Gasto no Período</p>
            <p className="text-xl font-bold md:text-3xl mt-1">{formatCurrency(currentMonthExpenses)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Fatura Pendente (Geral)</p>
                <p className="mt-1 text-base font-bold text-red-600 dark:text-red-400 md:text-xl">
                  {formatCurrency(cardUsage?.current_invoice_amount ?? 0)}
                </p>
              </div>
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            {paidInvoiceAmount > 0 && (
              <p className="text-xs text-green-600 dark:text-green-500 mt-2 font-medium">
                Faturas pagas no período: {formatCurrency(paidInvoiceAmount)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Month navigator */}
      <MonthNavigator />

      {/* Transactions */}
      <Card>
        <div className="flex items-center justify-between p-4 pb-0">
          <h2 className="font-semibold">Fatura do Mês</h2>
        </div>
        <div className="p-0">
          {transactions.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Nenhuma movimentação para este cartão no período selecionado.
            </p>
          ) : (
            <InfiniteTransactionList 
              initialTransactions={transactions as TransactionWithDetails[]}
              initialTotalPages={totalPages}
              filters={filters}
              wallets={wallets}
              categories={categories}
              creditCards={creditCards}
            />
          )}
        </div>
      </Card>
    </div>
  )
}

export default async function CreditCardDetailPage({ params, searchParams }: CreditCardDetailPageProps) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <CreditCardDetailContent id={id} searchParams={resolvedSearchParams} />
    </Suspense>
  )
}
