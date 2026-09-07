import Link from 'next/link'
import { CreditCard as CreditCardIcon, Calendar, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { CreditCardWithUsage } from '@/types'

interface CreditCardsSummaryProps {
  creditCards: CreditCardWithUsage[]
}

export function CreditCardsSummary({ creditCards }: CreditCardsSummaryProps) {
  if (creditCards.length === 0) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Cartões de Crédito</CardTitle>
        <Link href="/cartoes" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          Ver todos
        </Link>
      </CardHeader>
      <CardContent className="space-y-1 p-2">
        {creditCards.map((cc) => {
          const usedPercent = cc.credit_limit > 0
            ? Math.min(100, ((cc.credit_limit - cc.available_limit) / cc.credit_limit) * 100)
            : 0

          return (
            <Link
              key={cc.id}
              href="/cartoes"
              className="hover:bg-muted/50 flex items-center gap-3 rounded-lg p-3 transition-colors"
            >
              {/* Icon */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30"
                aria-hidden="true"
              >
                <CreditCardIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{cc.name}</p>
                <div className="mt-1 space-y-1">
                  {/* Usage bar */}
                  <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        usedPercent > 80
                          ? 'bg-red-500'
                          : usedPercent > 50
                            ? 'bg-amber-500'
                            : 'bg-violet-500'
                      )}
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>Vence {formatDate(cc.invoice_due_date)}</span>
                  </div>
                </div>
              </div>

              {/* Values */}
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
                  {formatCurrency(cc.current_invoice_amount)}
                </span>
                <span className="text-muted-foreground text-xs">
                  Disp. {formatCurrency(cc.available_limit)}
                </span>
                <ChevronRight className="text-muted-foreground h-4 w-4 mt-0.5" aria-hidden="true" />
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
