'use client'

import { useState } from 'react'
import { CreditCard as CreditCardIcon, Pencil, Trash2, Calendar, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { CreditCardForm } from './credit-card-form'
import { deactivateCreditCard } from '@/actions/credit-cards'
import type { CreditCard } from '@/types'

interface CreditCardCardProps {
  creditCard: CreditCard
  invoiceAmount?: number
  availableLimit?: number
}

export function CreditCardCard({ creditCard, invoiceAmount = 0, availableLimit }: CreditCardCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const limit = creditCard.credit_limit
  const available = availableLimit ?? limit - invoiceAmount
  const usedPercent = limit > 0 ? Math.min(100, ((limit - available) / limit) * 100) : 0

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deactivateCreditCard(creditCard.id)
    setIsDeleting(false)
    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success('Cartão desativado com sucesso.')
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <Card className="group relative overflow-hidden">
        {/* Gradient accent bar */}
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{
            background: 'linear-gradient(90deg, #8B5CF6, #6366F1, #3B82F6)',
          }}
        />

        <CardContent className="p-4 pt-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                <CreditCardIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">{creditCard.name}</p>
                <p className="text-muted-foreground text-xs flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Fecha dia {creditCard.closing_day}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span>Vence dia {creditCard.due_day}</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setEditOpen(true)}
                aria-label="Editar cartão"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive h-7 w-7"
                onClick={() => setDeleteOpen(true)}
                aria-label="Desativar cartão"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Usage bar */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Limite utilizado</span>
              <span className="font-medium">{usedPercent.toFixed(0)}%</span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  usedPercent > 80
                    ? 'bg-red-500'
                    : usedPercent > 50
                      ? 'bg-amber-500'
                      : 'bg-violet-500'
                )}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-green-50 p-2.5 dark:bg-green-950/20">
              <p className="text-muted-foreground text-xs">Limite disponível</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(available)}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-2.5 dark:bg-red-950/20">
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <TrendingDown className="h-3 w-3" />
                Fatura atual
              </p>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(invoiceAmount)}
              </p>
            </div>
          </div>

          {/* Limit total */}
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <span className="text-muted-foreground text-xs">Limite total</span>
            <span className="text-sm font-semibold">{formatCurrency(limit)}</span>
          </div>
        </CardContent>
      </Card>

      <CreditCardForm
        open={editOpen}
        onOpenChange={setEditOpen}
        creditCard={creditCard}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar cartão?</AlertDialogTitle>
            <AlertDialogDescription>
              O cartão &quot;{creditCard.name}&quot; será desativado. As movimentações existentes serão mantidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Desativando...' : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
