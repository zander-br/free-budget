'use client'

import { useState } from 'react'
import { Calendar, Wallet, Tag, StickyNote, Check, Clock, Pencil, ArrowLeftRight } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { TransactionDialog } from './transaction-dialog'
import { CategoryIcon } from '@/components/shared/category-icon'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { settleTransaction } from '@/actions/transactions'
import type { TransactionWithDetails, WalletWithBalance, Category } from '@/types'

interface TransactionDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: TransactionWithDetails
  wallets: WalletWithBalance[]
  categories: Category[]
}

const TYPE_CONFIG = {
  INCOME: {
    label: 'Entrada',
    paidLabel: 'Recebido',
    settleLabel: 'Receber',
    amountPrefix: '+',
    iconColor: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
  },
  EXPENSE: {
    label: 'Saída',
    paidLabel: 'Pago',
    settleLabel: 'Pagar',
    amountPrefix: '-',
    iconColor: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
  },
  TRANSFER: {
    label: 'Transferência',
    paidLabel: 'Transferido',
    settleLabel: 'Transferir',
    amountPrefix: '',
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
  },
}

export function TransactionDetail({
  open,
  onOpenChange,
  transaction,
  wallets,
  categories,
}: TransactionDetailProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [isSettling, setIsSettling] = useState(false)

  const isTransfer = transaction.type === 'TRANSFER'
  const config = TYPE_CONFIG[transaction.type]

  const walletName = isTransfer
    ? `${transaction.wallet_from?.name ?? '?'} → ${transaction.wallet_to?.name ?? '?'}`
    : transaction.wallet?.name

  function handleEdit() {
    onOpenChange(false)
    setTimeout(() => setEditOpen(true), 150)
  }

  async function handleSettle() {
    setIsSettling(true)
    const result = await settleTransaction(transaction.id)
    setIsSettling(false)
    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success('Movimentação efetivada com sucesso.')
      onOpenChange(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="sr-only">Detalhes da movimentação</DialogTitle>
          </DialogHeader>

          {/* Type + Amount */}
          <div className="flex flex-col items-center gap-2 pt-2 pb-4">
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', config.iconBg)}>
              {isTransfer ? (
                <ArrowLeftRight className={cn('h-5 w-5', config.iconColor)} aria-hidden="true" />
              ) : (
                <CategoryIcon
                  icon={transaction.category?.icon}
                  className={cn('h-5 w-5', config.iconColor)}
                />
              )}
            </div>

            <span className="text-muted-foreground text-xs font-medium uppercase tracking-widest">
              {config.label}
            </span>

            <span className={cn('text-3xl font-bold tracking-tight', config.iconColor)}>
              {config.amountPrefix}{formatCurrency(transaction.amount)}
            </span>

            <p className="text-center text-sm font-medium leading-snug text-balance">
              {transaction.description || transaction.category?.name || 'Transferência'}
            </p>
          </div>

          <Separator />

          {/* Details */}
          <dl className="space-y-3 py-2">
            {/* Status */}
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-muted-foreground flex shrink-0 items-center gap-2">
                {transaction.is_paid
                  ? <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  : <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                }
                Status
              </dt>
              <dd>
                <Badge
                  className={cn(
                    'text-xs',
                    transaction.is_paid
                      ? 'bg-green-100 text-green-700 border-transparent dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700'
                  )}
                  variant="outline"
                >
                  {transaction.is_paid ? config.paidLabel : 'Pendente'}
                </Badge>
              </dd>
            </div>

            {/* Date */}
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-muted-foreground flex shrink-0 items-center gap-2">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                Data
              </dt>
              <dd>{formatDate(transaction.date)}</dd>
            </div>

            {/* Category */}
            {transaction.category && (
              <div className="flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground flex shrink-0 items-center gap-2">
                  <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                  Categoria
                </dt>
                <dd>{transaction.category.name}</dd>
              </div>
            )}

            {/* Wallet(s) */}
            {walletName && (
              <div className="flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground flex shrink-0 items-center gap-2">
                  <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                  {isTransfer ? 'Bolsos' : 'Bolso'}
                </dt>
                <dd className="text-right">{walletName}</dd>
              </div>
            )}

            {/* Notes */}
            {transaction.notes && (
              <div className="flex flex-col gap-1.5 text-sm">
                <dt className="text-muted-foreground flex items-center gap-2">
                  <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
                  Observação
                </dt>
                <dd className="bg-muted/50 rounded-md px-3 py-2 text-sm leading-relaxed">
                  {transaction.notes}
                </dd>
              </div>
            )}
          </dl>

          {/* Settle button — only for pending transactions */}
          {!transaction.is_paid && (
            <Button
              className="w-full gap-1.5"
              onClick={handleSettle}
              disabled={isSettling}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {isSettling ? 'Efetivando...' : config.settleLabel}
            </Button>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button variant="outline" className="flex-1 gap-1.5" onClick={handleEdit}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Editar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TransactionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        wallets={wallets}
        categories={categories}
        transaction={transaction}
      />
    </>
  )
}
