'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { WalletWithBalance, Category, CreditCard } from '@/types'

interface TransactionFiltersProps {
  wallets: WalletWithBalance[]
  categories: Category[]
  creditCards?: CreditCard[]
}

export function TransactionFilters({ wallets, categories, creditCards = [] }: TransactionFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'ALL') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  function clearFilters() {
    // Preserve month navigation dates, clear only content filters
    const params = new URLSearchParams()
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    router.push(`?${params.toString()}`)
  }

  const hasActiveFilters =
    searchParams.has('type') ||
    searchParams.has('walletId') ||
    searchParams.has('categoryId') ||
    searchParams.has('creditCardId') ||
    searchParams.has('search')

  const typeValue = searchParams.get('type') ?? 'ALL'
  const typeMap: Record<string, string> = {
    ALL: 'Todos',
    INCOME: 'Entradas',
    EXPENSE: 'Saídas',
    TRANSFER: 'Transferências',
  }
  const typeName = typeMap[typeValue] || typeValue

  const walletValue = searchParams.get('walletId') ?? 'ALL'
  const walletName = walletValue === 'ALL' ? 'Todos' : wallets.find(w => w.id === walletValue)?.name || walletValue

  const cardValue = searchParams.get('creditCardId') ?? 'ALL'
  const cardName = cardValue === 'ALL' ? 'Todos' : creditCards.find(c => c.id === cardValue)?.name || cardValue

  const categoryValue = searchParams.get('categoryId') ?? 'ALL'
  const categoryName = categoryValue === 'ALL' ? 'Todas' : categories.find(c => c.id === categoryValue)?.name || categoryValue

  return (
    <div className="space-y-3">
      {/* Search + filter toggle row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            placeholder="Buscar por descrição..."
            defaultValue={searchParams.get('search') ?? ''}
            onChange={(e) => {
              const value = e.target.value
              const params = new URLSearchParams(searchParams.toString())
              if (value) {
                params.set('search', value)
              } else {
                params.delete('search')
              }
              params.delete('page')
              router.push(`?${params.toString()}`)
            }}
            className="pl-9"
            aria-label="Buscar movimentações"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters((v) => !v)}
          aria-label={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          aria-expanded={showFilters}
          className={cn('relative shrink-0', showFilters && 'bg-muted border-muted-foreground/30')}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {hasActiveFilters && (
            <span
              className="bg-primary absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-background"
              aria-label="Filtros ativos"
            />
          )}
        </Button>
      </div>

      {/* Collapsible filter fields */}
      {showFilters && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {/* Type */}
          <Select
            value={searchParams.get('type') ?? 'ALL'}
            onValueChange={(v) => updateParam('type', v)}
          >
            <SelectTrigger className="w-full sm:flex-1" aria-label="Filtrar por tipo">
              <div className="flex items-center gap-1 truncate">
                <span className="text-muted-foreground">Tipo:</span>
                <SelectValue placeholder="Todos">{typeName}</SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="INCOME">Entradas</SelectItem>
              <SelectItem value="EXPENSE">Saídas</SelectItem>
              <SelectItem value="TRANSFER">Transferências</SelectItem>
            </SelectContent>
          </Select>

          {/* Wallet */}
          <Select
            value={searchParams.get('walletId') ?? 'ALL'}
            onValueChange={(v) => updateParam('walletId', v)}
          >
            <SelectTrigger className="w-full sm:flex-1" aria-label="Filtrar por bolso">
              <div className="flex items-center gap-1 truncate">
                <span className="text-muted-foreground">Bolso:</span>
                <SelectValue placeholder="Todos">{walletName}</SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              {wallets.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Credit Card */}
          {creditCards.length > 0 && (
            <Select
              value={searchParams.get('creditCardId') ?? 'ALL'}
              onValueChange={(v) => updateParam('creditCardId', v)}
            >
              <SelectTrigger className="w-full sm:flex-1" aria-label="Filtrar por cartão">
                <div className="flex items-center gap-1 truncate">
                  <span className="text-muted-foreground">Cartão:</span>
                  <SelectValue placeholder="Todos">{cardName}</SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {creditCards.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Category */}
          <Select
            value={searchParams.get('categoryId') ?? 'ALL'}
            onValueChange={(v) => updateParam('categoryId', v)}
          >
            <SelectTrigger className="w-full sm:flex-1" aria-label="Filtrar por categoria">
              <div className="flex items-center gap-1 truncate">
                <span className="text-muted-foreground">Categoria:</span>
                <SelectValue placeholder="Todas">{categoryName}</SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear content filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="w-full gap-1.5 sm:w-auto sm:flex-none"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Limpar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
