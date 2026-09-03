import { Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'

interface TotalBalanceCardProps {
  totalBalance: number
}

export function TotalBalanceCard({ totalBalance }: TotalBalanceCardProps) {
  return (
    <Card className="from-primary to-primary/80 text-primary-foreground bg-gradient-to-br">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Wallet className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium opacity-90">Saldo total</p>
            <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
