import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'

interface SummaryCardsProps {
  income: number
  expense: number
}

export function SummaryCards({ income, expense }: SummaryCardsProps) {
  const balance = income - expense

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Entradas</p>
              <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(income)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Saídas</p>
              <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(expense)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Saldo do período</p>
              <p
                className={`mt-1 text-2xl font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {formatCurrency(balance)}
              </p>
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${balance >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
            >
              <TrendingUp
                className={`h-5 w-5 ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                aria-hidden="true"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
