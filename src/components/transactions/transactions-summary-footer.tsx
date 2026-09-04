'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { TransactionsSummary } from '@/types'

interface TransactionsSummaryFooterProps {
  summary: TransactionsSummary | null
}

export function TransactionsSummaryFooter({ summary }: TransactionsSummaryFooterProps) {
  const [expanded, setExpanded] = useState(false)

  if (!summary) return null

  const {
    saldoAnterior,
    receitaRealizada,
    receitaPrevista,
    despesaRealizada,
    despesaPrevista,
    saldo,
    previsto,
  } = summary

  return (
    <div className="fixed bottom-16 left-0 right-0 z-20 border-t bg-card/95 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur-sm md:sticky md:bottom-0 md:left-auto md:right-auto md:-mx-4 md:-mb-6">
      {/* Collapsed row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3"
        aria-expanded={expanded}
        aria-label={expanded ? 'Recolher resumo' : 'Expandir resumo'}
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}

        <div className="flex flex-1 items-center justify-around">
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Saldo
            </p>
            <p
              className={cn(
                'text-base font-bold tabular-nums leading-tight',
                saldo >= 0 ? 'text-primary' : 'text-destructive'
              )}
            >
              {formatCurrency(saldo)}
            </p>
          </div>

          <div className="h-8 w-px shrink-0 bg-border" aria-hidden="true" />

          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Previsto
            </p>
            <p
              className={cn(
                'text-sm font-semibold tabular-nums leading-tight',
                previsto >= 0 ? 'text-foreground' : 'text-destructive'
              )}
            >
              {formatCurrency(previsto)}
            </p>
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t bg-muted/30 px-4 pb-4 pt-3">
          {/* Saldo anterior */}
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Saldo anterior</span>
            <span
              className={cn(
                'font-semibold tabular-nums',
                saldoAnterior >= 0 ? 'text-foreground' : 'text-destructive'
              )}
            >
              {formatCurrency(saldoAnterior)}
            </span>
          </div>

          {/* Realizado / Previsto columns */}
          <div className="grid grid-cols-2 gap-x-4">
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Realizado
              </p>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">Receita</span>
                <span className="font-medium tabular-nums text-green-600 dark:text-green-400">
                  {formatCurrency(receitaRealizada)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">Despesa</span>
                <span className="font-medium tabular-nums text-destructive">
                  {formatCurrency(-despesaRealizada)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Previsto
              </p>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">Receita</span>
                <span className="font-medium tabular-nums text-green-600/70 dark:text-green-400/70">
                  {formatCurrency(receitaPrevista)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">Despesa</span>
                <span className="font-medium tabular-nums text-destructive/70">
                  {formatCurrency(-despesaPrevista)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
