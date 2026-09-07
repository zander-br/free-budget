import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCreditCards, getCreditCardsSummary } from '@/actions/credit-cards'
import { getCurrentMonthRange } from '@/lib/utils/format'
import { CreditCardList } from '@/components/credit-cards/credit-card-list'
import { NewCreditCardButton } from '@/components/shared/new-credit-card-button'
import { Skeleton } from '@/components/ui/skeleton'
import type { CreditCard, CreditCardWithUsage } from '@/types'

async function CreditCardsContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { startDate, endDate } = getCurrentMonthRange()

  const [cardsResult, summaryResult] = await Promise.all([
    getCreditCards(),
    getCreditCardsSummary(startDate, endDate),
  ])

  const creditCards = cardsResult.success ? (cardsResult.data as CreditCard[]) : []
  const creditCardsWithUsage = summaryResult.success ? (summaryResult.data as CreditCardWithUsage[]) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Cartões de Crédito</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie seus cartões e acompanhe suas faturas.
          </p>
        </div>
        {creditCards.length > 0 && (
          <div className="hidden md:flex">
            <NewCreditCardButton />
          </div>
        )}
      </div>

      {/* Cards list */}
      <CreditCardList creditCards={creditCards} creditCardsWithUsage={creditCardsWithUsage} />

      {/* Mobile FAB */}
      {creditCards.length > 0 && (
        <div className="fixed right-4 bottom-20 z-40 md:hidden">
          <NewCreditCardButton />
        </div>
      )}
    </div>
  )
}

function CreditCardsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="hidden h-10 w-32 md:block" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function CartoesPage() {
  return (
    <Suspense fallback={<CreditCardsSkeleton />}>
      <CreditCardsContent />
    </Suspense>
  )
}
