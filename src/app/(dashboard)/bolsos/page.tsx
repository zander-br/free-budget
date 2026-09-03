import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import { getAllWallets } from '@/actions/wallets'
import { WalletCard } from '@/components/wallets/wallet-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { WalletForm } from '@/components/wallets/wallet-form'
import { formatCurrency } from '@/lib/utils/format'
import type { WalletWithBalance } from '@/types'

async function WalletsContent() {
  const result = await getAllWallets()
  const wallets = result.success ? (result.data as WalletWithBalance[]) : []
  const activeWallets = wallets.filter((w) => w.is_active)
  const inactiveWallets = wallets.filter((w) => !w.is_active)
  const totalBalance = activeWallets.reduce((sum, w) => sum + w.balance, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bolsos</h1>
          {activeWallets.length > 0 && (
            <p className="text-muted-foreground text-sm">
              Total: {formatCurrency(totalBalance)} em {activeWallets.length} bolso{activeWallets.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Dialog>
          <DialogTrigger
            render={
              <Button className="gap-2">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Novo bolso
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar novo bolso</DialogTitle>
            </DialogHeader>
            <WalletForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Active wallets */}
      {activeWallets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 text-5xl">👛</div>
          <h2 className="mb-2 text-xl font-semibold">Você ainda não possui bolsos.</h2>
          <p className="text-muted-foreground mb-6">
            Crie seu primeiro bolso para começar a controlar suas finanças.
          </p>
          <Dialog>
            <DialogTrigger
              render={
                <Button className="gap-2">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Criar bolso
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar novo bolso</DialogTitle>
              </DialogHeader>
              <WalletForm />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeWallets.map((wallet) => (
            <WalletCard key={wallet.id} wallet={wallet} />
          ))}
        </div>
      )}

      {/* Inactive wallets */}
      {inactiveWallets.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            Inativos
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inactiveWallets.map((wallet) => (
              <WalletCard key={wallet.id} wallet={wallet} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function WalletsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function WalletsPage() {
  return (
    <Suspense fallback={<WalletsSkeleton />}>
      <WalletsContent />
    </Suspense>
  )
}
