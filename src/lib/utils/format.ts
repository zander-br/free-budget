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
  const nowStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  const [year, month] = nowStr.split('-').map(Number)
  
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return {
    startDate,
    endDate,
  }
}

export function getTodayString(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}
