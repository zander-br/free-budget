'use client'

import { useState } from 'react'
import { Plus, CreditCard as CreditCardIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreditCardCard } from './credit-card-card'
import { CreditCardForm } from './credit-card-form'
import type { CreditCard, CreditCardWithUsage } from '@/types'

interface CreditCardListProps {
  creditCards: CreditCard[]
  creditCardsWithUsage?: CreditCardWithUsage[]
}

export function CreditCardList({ creditCards, creditCardsWithUsage }: CreditCardListProps) {
  const [createOpen, setCreateOpen] = useState(false)

  if (creditCards.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
            <CreditCardIcon className="h-8 w-8 text-violet-500" />
          </div>
          <h2 className="mb-2 text-lg font-semibold">Nenhum cartão cadastrado</h2>
          <p className="text-muted-foreground mb-6 max-w-sm text-sm">
            Cadastre seu primeiro cartão de crédito para acompanhar faturas e limites.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo cartão
          </Button>
        </div>
        <CreditCardForm open={createOpen} onOpenChange={setCreateOpen} />
      </>
    )
  }

  // Build a map of usage data if available
  const usageMap: Record<string, CreditCardWithUsage> = {}
  if (creditCardsWithUsage) {
    for (const cc of creditCardsWithUsage) {
      usageMap[cc.id] = cc
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {creditCards.map((cc) => {
          const usage = usageMap[cc.id]
          return (
            <CreditCardCard
              key={cc.id}
              creditCard={cc}
              invoiceAmount={usage?.current_invoice_amount}
              availableLimit={usage?.available_limit}
            />
          )
        })}
      </div>
      <CreditCardForm open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
