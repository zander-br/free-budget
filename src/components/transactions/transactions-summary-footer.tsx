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
    <div className="sticky bottom-16 md:bottom-0 z-20 -mx-4 -mb-6 border-t bg-card/95 shadow-[0_-1px_6px_rgba(0,0,0,0.06)] backdrop-blur-sm">
      {/* Collapsed row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-2.5"
        aria-expanded={expanded}
        aria-label={expanded ? 'Recolher resumo' : 'Expandir resumo'}
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}

        <div className="flex flex-1 items-center justify-around gap-4">
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Saldo
            </p>
            <p
              className={cn(
                'text-sm font-semibold tabular-nums',
                saldo >= 0 ? 'text-primary' : 'text-destructive'
              )}
            >
              {formatCurrency(saldo)}
            </p>
          </div>

          <div className="h-7 w-px shrink-0 bg-border" aria-hidden="true" />

          <div className="min-w-0 text-left">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Previsto
            </p>
            <p
              className={cn(
                'text-sm tabular-nums',
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
        <div className="border-t px-4 pb-3 pt-2">
          {/* Saldo anterior */}
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Saldo anterior</span>
            <span
              className={cn(
                'tabular-nums font-medium',
                saldoAnterior >= 0 ? 'text-foreground' : 'text-destructive'
              )}
            >
              {formatCurrency(saldoAnterior)}
            </span>
          </div>

          {/* 2×2 grid: realized vs. expected income/expense */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-muted-foreground">Rec. realizada</span>
              <span className="tabular-nums text-green-600 dark:text-green-400">
                {formatCurrency(receitaRealizada)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-muted-foreground">Rec. prevista</span>
              <span className="tabular-nums text-green-600/70 dark:text-green-400/70">
                {formatCurrency(receitaPrevista)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-muted-foreground">Desp. realizada</span>
              <span className="tabular-nums text-destructive">
                {formatCurrency(-despesaRealizada)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-muted-foreground">Desp. prevista</span>
              <span className="tabular-nums text-destructive/70">
                {formatCurrency(-despesaPrevista)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
