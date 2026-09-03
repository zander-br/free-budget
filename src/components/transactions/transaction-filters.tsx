'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { WalletWithBalance, Category } from '@/types'

interface TransactionFiltersProps {
  wallets: WalletWithBalance[]
  categories: Category[]
}

export function TransactionFilters({ wallets, categories }: TransactionFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

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
    router.push('/movimentacoes')
  }

  const hasFilters =
    searchParams.has('type') ||
    searchParams.has('walletId') ||
    searchParams.has('categoryId') ||
    searchParams.has('search') ||
    searchParams.has('startDate') ||
    searchParams.has('endDate')

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
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

      {/* Filters row */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {/* Type */}
        <Select
          value={searchParams.get('type') ?? 'ALL'}
          onValueChange={(v) => updateParam('type', v)}
        >
          <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar por tipo">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os tipos</SelectItem>
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
          <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar por bolso">
            <SelectValue placeholder="Bolso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os bolsos</SelectItem>
            {wallets.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category */}
        <Select
          value={searchParams.get('categoryId') ?? 'ALL'}
          onValueChange={(v) => updateParam('categoryId', v)}
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por categoria">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <Input
          type="date"
          defaultValue={searchParams.get('startDate') ?? ''}
          onChange={(e) => updateParam('startDate', e.target.value || null)}
          className="w-full sm:w-44"
          aria-label="Data inicial"
        />
        <Input
          type="date"
          defaultValue={searchParams.get('endDate') ?? ''}
          onChange={(e) => updateParam('endDate', e.target.value || null)}
          className="w-full sm:w-44"
          aria-label="Data final"
        />

        {/* Clear filters */}
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="col-span-2 gap-1.5 sm:col-span-1">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  )
}
