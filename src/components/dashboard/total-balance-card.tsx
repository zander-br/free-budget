import { Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

interface TotalBalanceCardProps {
  totalBalance: number
}

export function TotalBalanceCard({ totalBalance }: TotalBalanceCardProps) {
  return (
    <div className="from-primary to-primary/75 relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg">
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/8" />
      <div className="absolute -bottom-10 -right-4 h-48 w-48 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/75">Saldo total</p>
          <p className="mt-2 text-2xl font-bold tracking-tight md:text-4xl">{formatCurrency(totalBalance)}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
          <Wallet className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
