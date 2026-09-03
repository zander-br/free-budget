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
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="px-4 py-3 sm:py-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 sm:h-11 sm:w-11 sm:rounded-xl dark:bg-emerald-950/40">
              <ArrowUp className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Entradas</p>
              <p className="text-base font-bold text-emerald-600 tabular-nums dark:text-emerald-400 md:text-xl">
                {formatCurrency(income)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="px-4 py-3 sm:py-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 sm:h-11 sm:w-11 sm:rounded-xl dark:bg-red-950/40">
              <ArrowDown className="h-4 w-4 text-red-500 sm:h-5 sm:w-5 dark:text-red-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Saídas</p>
              <p className="text-base font-bold text-red-500 tabular-nums dark:text-red-400 md:text-xl">
                {formatCurrency(expense)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="px-4 py-3 sm:py-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl ${
                balance >= 0
                  ? 'bg-primary/10 dark:bg-primary/20'
                  : 'bg-red-50 dark:bg-red-950/40'
              }`}
            >
              <TrendingUp
                className={`h-4 w-4 sm:h-5 sm:w-5 ${balance >= 0 ? 'text-primary' : 'text-red-500 dark:text-red-400'}`}
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Saldo do período</p>
              <p
                className={`text-base font-bold tabular-nums md:text-xl ${
                  balance >= 0 ? 'text-primary' : 'text-red-500 dark:text-red-400'
                }`}
              >
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
