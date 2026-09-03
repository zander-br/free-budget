'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TransactionDialog } from '@/components/transactions/transaction-dialog'
import type { WalletWithBalance, Category } from '@/types'

interface NewTransactionButtonProps {
  wallets: WalletWithBalance[]
  categories: Category[]
  variant?: 'default' | 'fab'
}

export function NewTransactionButton({ wallets, categories, variant = 'default' }: NewTransactionButtonProps) {
  const [open, setOpen] = useState(false)

  if (variant === 'fab') {
    return (
      <>
        <Button
          onClick={() => setOpen(true)}
          size="icon"
          className="fixed right-4 bottom-20 z-40 h-14 w-14 rounded-full shadow-lg md:hidden"
          aria-label="Nova movimentação"
        >
          <Plus className="h-6 w-6" />
        </Button>
        <TransactionDialog open={open} onOpenChange={setOpen} wallets={wallets} categories={categories} />
      </>
    )
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" aria-hidden="true" />
        Nova movimentação
      </Button>
      <TransactionDialog open={open} onOpenChange={setOpen} wallets={wallets} categories={categories} />
    </>
  )
}
