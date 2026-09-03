'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Pencil, PowerOff, Power } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { WalletForm } from './wallet-form'
import { deactivateWallet, reactivateWallet } from '@/actions/wallets'
import { formatCurrency } from '@/lib/utils/format'
import { WalletIcon } from '@/components/shared/wallet-icon'
import type { WalletWithBalance } from '@/types'

interface WalletCardProps {
  wallet: WalletWithBalance
}

export function WalletCard({ wallet }: WalletCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  async function handleDeactivate() {
    setIsToggling(true)
    const result = await deactivateWallet(wallet.id)
    setIsToggling(false)
    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success('Bolso desativado com sucesso.')
      setDeactivateOpen(false)
    }
  }

  async function handleReactivate() {
    setIsToggling(true)
    const result = await reactivateWallet(wallet.id)
    setIsToggling(false)
    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success('Bolso reativado com sucesso.')
    }
  }

  return (
    <>
      <Card className={!wallet.is_active ? 'opacity-60' : ''}>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <Link href={`/bolsos/${wallet.id}`} className="shrink-0">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:scale-105"
                style={{ backgroundColor: `${wallet.color ?? '#7C3AED'}20` }}
                aria-hidden="true"
              >
                <WalletIcon
                  icon={wallet.icon}
                  className="h-6 w-6"
                  style={{ color: wallet.color ?? '#7C3AED' }}
                />
              </div>
            </Link>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/bolsos/${wallet.id}`} className="truncate text-sm font-medium hover:underline">
                  {wallet.name}
                </Link>
                {!wallet.is_active && (
                  <Badge variant="secondary" className="text-xs">
                    Inativo
                  </Badge>
                )}
              </div>
              <p className="text-base font-bold md:text-xl">{formatCurrency(wallet.balance)}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditOpen(true)}
                aria-label="Editar bolso"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              {wallet.is_active ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive h-8 w-8"
                  onClick={() => setDeactivateOpen(true)}
                  aria-label="Desativar bolso"
                >
                  <PowerOff className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-600"
                  onClick={handleReactivate}
                  disabled={isToggling}
                  aria-label="Reativar bolso"
                >
                  <Power className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
              <Link href={`/bolsos/${wallet.id}`} aria-label="Ver detalhes do bolso">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar bolso</DialogTitle>
          </DialogHeader>
          <WalletForm
            wallet={wallet}
            onSuccess={() => setEditOpen(false)}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar bolso?</AlertDialogTitle>
            <AlertDialogDescription>
              O bolso <strong>{wallet.name}</strong> será desativado. Seu histórico de movimentações
              será preservado. Você pode reativá-lo a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={isToggling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isToggling ? 'Desativando...' : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
