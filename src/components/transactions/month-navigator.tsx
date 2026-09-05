'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

function getMonthBounds(year: number, month: number) {
  const lastDay = new Date(year, month + 1, 0).getDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    startDate: `${year}-${pad(month + 1)}-01`,
    endDate: `${year}-${pad(month + 1)}-${pad(lastDay)}`,
  }
}

export function MonthNavigator() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const startDateParam = searchParams.get('startDate')

  const today = new Date()
  const { year, month } = startDateParam
    ? (() => {
        const [y, m] = startDateParam.split('-').map(Number)
        return { year: y, month: m - 1 }
      })()
    : { year: today.getFullYear(), month: today.getMonth() }

  // Sync URL with current month on first load (no dates in URL)
  useEffect(() => {
    if (!searchParams.get('startDate')) {
      const now = new Date()
      const bounds = getMonthBounds(now.getFullYear(), now.getMonth())
      const params = new URLSearchParams(searchParams.toString())
      params.set('startDate', bounds.startDate)
      params.set('endDate', bounds.endDate)
      router.replace(`?${params.toString()}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function navigate(direction: -1 | 1) {
    const d = new Date(year, month + direction, 1)
    const bounds = getMonthBounds(d.getFullYear(), d.getMonth())
    const params = new URLSearchParams(searchParams.toString())
    params.set('startDate', bounds.startDate)
    params.set('endDate', bounds.endDate)
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  const raw = new Date(year, month, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
  const label = raw.charAt(0).toUpperCase() + raw.slice(1)

  return (
    <div className="flex items-center justify-center gap-1 -mt-5 md:mt-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(-1)}
        aria-label="Mês anterior"
        className="h-8 w-8 rounded-full"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="min-w-[11rem] text-center text-sm font-medium tabular-nums">
        {label}
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(1)}
        aria-label="Próximo mês"
        className="h-8 w-8 rounded-full"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
