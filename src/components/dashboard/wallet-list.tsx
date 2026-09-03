import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format'
import { WalletIcon } from '@/components/shared/wallet-icon'
import { cn } from '@/lib/utils'
import type { WalletWithBalance } from '@/types'

interface WalletListProps {
  wallets: WalletWithBalance[]
}

export function WalletList({ wallets }: WalletListProps) {
  if (wallets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meus bolsos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4 text-sm">Você ainda não possui bolsos.</p>
            <Link href="/bolsos" className={buttonVariants({ size: 'sm' })}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Criar bolso
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Meus bolsos</CardTitle>
        <Link href="/bolsos" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          Ver todos
        </Link>
      </CardHeader>
      <CardContent className="space-y-1 p-2">
        {wallets.map((wallet) => (
          <Link
            key={wallet.id}
            href={`/bolsos/${wallet.id}`}
            className="hover:bg-muted/50 flex items-center gap-3 rounded-lg p-3 transition-colors"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${wallet.color ?? '#7C3AED'}20` }}
              aria-hidden="true"
            >
              <WalletIcon
                icon={wallet.icon}
                className="h-5 w-5"
                style={{ color: wallet.color ?? '#7C3AED' }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{wallet.name}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">{formatCurrency(wallet.balance)}</span>
              <ChevronRight className="text-muted-foreground h-4 w-4" aria-hidden="true" />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
