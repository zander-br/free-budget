import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amountInCents / 100)
}

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateLong(dateString: string): string {
  return format(parseISO(dateString), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function parseCurrencyInput(value: string): number {
  const clean = value.replace(/[^0-9,]/g, '').replace(',', '.')
  const parsed = parseFloat(clean)
  if (isNaN(parsed)) return 0
  return Math.round(parsed * 100)
}

export function toCents(value: number): number {
  return Math.round(value * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

export function getCurrentMonthRange(): { startDate: string; endDate: string } {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
  }
}

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
