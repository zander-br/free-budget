'use client'

import { useState } from 'react'
import { Pencil, Trash2, ArrowLeftRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TransactionDialog } from './transaction-dialog'
import { TransactionDetail } from './transaction-detail'
import { deleteTransaction } from '@/actions/transactions'
import { CategoryIcon } from '@/components/shared/category-icon'
import type { TransactionWithDetails, WalletWithBalance, Category } from '@/types'

interface TransactionItemProps {
  transaction: TransactionWithDetails
  wallets: WalletWithBalance[]
  categories: Category[]
}

const PAID_LABEL: Record<string, string> = {
  INCOME: 'Recebido',
  EXPENSE: 'Pago',
  TRANSFER: 'Transferido',
}

export function TransactionItem({ transaction, wallets, categories }: TransactionItemProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteTransaction(transaction.id)
    setIsDeleting(false)
    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success('Movimentação excluída com sucesso.')
      setDeleteOpen(false)
    }
  }

  const isIncome = transaction.type === 'INCOME'
  const isTransfer = transaction.type === 'TRANSFER'

  const walletName = isTransfer
    ? `${transaction.wallet_from?.name ?? '?'} → ${transaction.wallet_to?.name ?? '?'}`
    : transaction.wallet?.name

  return (
    <>
      {/* Row — clickable area opens detail */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Ver detalhes: ${transaction.description || transaction.category?.name || 'Transferência'}`}
        className="hover:bg-muted/50 group flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        onClick={() => setDetailOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDetailOpen(true) }}
      >
        {/* Icon */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            isIncome
              ? 'bg-green-100 dark:bg-green-900/30'
              : isTransfer
                ? 'bg-blue-100 dark:bg-blue-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
          )}
          aria-hidden="true"
        >
          {isTransfer ? (
            <ArrowLeftRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <CategoryIcon
              icon={transaction.category?.icon}
              className={cn(
                'h-4 w-4',
                isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}
            />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium break-words">
            {transaction.description || transaction.category?.name || 'Transferência'}
          </p>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            {!isTransfer && transaction.category && (
              <span>{transaction.category.name}</span>
            )}
            {walletName && <span>{walletName}</span>}
            <span>•</span>
            <span>{formatDate(transaction.date)}</span>
          </div>
        </div>

        {/* Amount + status + actions */}
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              'text-sm font-semibold',
              isIncome
                ? 'text-green-600 dark:text-green-400'
                : isTransfer
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-red-600 dark:text-red-400'
            )}
            aria-label={`${isIncome ? 'Entrada' : isTransfer ? 'Transferência' : 'Saída'}: ${formatCurrency(transaction.amount)}`}
          >
            {isIncome ? '+' : isTransfer ? '' : '-'}
            {formatCurrency(transaction.amount)}
          </span>

          {/* Payment status badge */}
          <span
            className={cn(
              'text-xs',
              transaction.is_paid
                ? 'text-muted-foreground/60'
                : 'text-amber-500 dark:text-amber-400 font-medium'
            )}
          >
            {transaction.is_paid ? PAID_LABEL[transaction.type] : 'Pendente'}
          </span>

          {/* Action buttons */}
          <div
            className="flex gap-1 md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setEditOpen(true)}
              aria-label="Editar movimentação"
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive h-6 w-6"
              onClick={() => setDeleteOpen(true)}
              aria-label="Excluir movimentação"
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      <TransactionDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        transaction={transaction}
        wallets={wallets}
        categories={categories}
      />

      <TransactionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        wallets={wallets}
        categories={categories}
        transaction={transaction}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir movimentação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não poderá ser desfeita. A movimentação será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
