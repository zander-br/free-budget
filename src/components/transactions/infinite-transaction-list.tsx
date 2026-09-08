'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TransactionItem } from './transaction-item'
import { getTransactions } from '@/actions/transactions'
import type { TransactionWithDetails, WalletWithBalance, Category, CreditCard, TransactionFilters } from '@/types'
import { Loader2 } from 'lucide-react'

interface InfiniteTransactionListProps {
  initialTransactions: TransactionWithDetails[]
  initialTotalPages: number
  filters: TransactionFilters
  wallets: WalletWithBalance[]
  categories: Category[]
  creditCards: CreditCard[]
}

export function InfiniteTransactionList({
  initialTransactions,
  initialTotalPages,
  filters,
  wallets,
  categories,
  creditCards,
}: InfiniteTransactionListProps) {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>(initialTransactions)
  const [page, setPage] = useState(filters.page ?? 1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialTotalPages > (filters.page ?? 1))
  
  const observerTarget = useRef<HTMLDivElement>(null)
  
  // Track filter changes to reset list
  const filterKey = `${filters.walletId}-${filters.categoryId}-${filters.creditCardId}-${filters.type}-${filters.startDate}-${filters.endDate}-${filters.search}`
  const [currentFilterKey, setCurrentFilterKey] = useState(filterKey)

  useEffect(() => {
    if (filterKey !== currentFilterKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTransactions(initialTransactions)
      setPage(filters.page ?? 1)
      setHasMore(initialTotalPages > (filters.page ?? 1))
      setCurrentFilterKey(filterKey)
    } else {
      // Revalidation / Edit / Delete handling
      // We will reset to initialTransactions to ensure data consistency
      setTransactions(initialTransactions)
      setPage(filters.page ?? 1)
      setHasMore(initialTotalPages > (filters.page ?? 1))
    }
  }, [initialTransactions, initialTotalPages, filterKey, currentFilterKey, filters.page])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    
    try {
      const nextPage = page + 1
      const result = await getTransactions({
        ...filters,
        page: nextPage,
      })
      
      if (result.success) {
        setTransactions((prev) => {
          // Avoid duplicates
          const newTxs = result.data.data as TransactionWithDetails[]
          const prevIds = new Set(prev.map(t => t.id))
          const filteredNew = newTxs.filter(t => !prevIds.has(t.id))
          return [...prev, ...filteredNew]
        })
        setPage(nextPage)
        setHasMore(result.data.totalPages > nextPage)
      }
    } catch (error) {
      console.error("Error loading more transactions:", error)
    } finally {
      setLoading(false)
    }
  }, [page, hasMore, loading, filters])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  return (
    <>
      <div className="divide-y p-2">
        {transactions.map((t) => (
          <TransactionItem
            key={t.id}
            transaction={t}
            wallets={wallets}
            categories={categories}
            creditCards={creditCards}
          />
        ))}
      </div>
      
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </>
  )
}
