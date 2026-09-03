'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, ArrowLeftRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { createTransaction, updateTransaction, createRecurringTransactions } from '@/actions/transactions'
import type { RepeatPeriod } from '@/actions/transactions'
import { getTodayString } from '@/lib/utils/format'
import type { WalletWithBalance, Category, TransactionType, TransactionWithDetails } from '@/types'

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.string().min(1, 'Valor é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  date: z.string().min(1, 'Data é obrigatória'),
  is_paid: z.boolean(),
  notes: z.string().optional(),
  wallet_id: z.string().optional(),
  category_id: z.string().optional(),
  wallet_from_id: z.string().optional(),
  wallet_to_id: z.string().optional(),
})

type FormValues = z.infer<typeof transactionSchema>

function formatCurrencyMask(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function parseMoney(value: string): number {
  const clean = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '')
  return parseFloat(clean) || 0
}

function isDatePast(dateStr: string): boolean {
  return dateStr <= getTodayString()
}

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallets: WalletWithBalance[]
  categories: Category[]
  transaction?: TransactionWithDetails
}

export function TransactionDialog({
  open,
  onOpenChange,
  wallets,
  categories,
  transaction,
}: TransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [repeatEnabled, setRepeatEnabled] = useState(false)
  const [repeatCount, setRepeatCount] = useState(3)
  const [repeatPeriod, setRepeatPeriod] = useState<RepeatPeriod>('meses')
  const isEditing = !!transaction

  const form = useForm<FormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: transaction?.type ?? 'EXPENSE',
      amount: transaction
        ? (transaction.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '',
      description: transaction?.description ?? '',
      date: transaction?.date ?? getTodayString(),
      is_paid: transaction?.is_paid ?? isDatePast(getTodayString()),
      notes: transaction?.notes ?? '',
      wallet_id: transaction?.wallet_id ?? '',
      category_id: transaction?.category_id ?? '',
      wallet_from_id: transaction?.wallet_from_id ?? '',
      wallet_to_id: transaction?.wallet_to_id ?? '',
    },
  })

  const type = form.watch('type')
  const dateValue = form.watch('date')
  const incomeCategories = categories.filter((c) => c.type === 'INCOME')
  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE')

  // In create mode, auto-set is_paid based on the selected date
  useEffect(() => {
    if (!isEditing && dateValue) {
      form.setValue('is_paid', isDatePast(dateValue))
    }
  }, [dateValue, isEditing, form])

  // Reset recurrence state when dialog closes
  useEffect(() => {
    if (!open) {
      setRepeatEnabled(false)
      setRepeatCount(3)
      setRepeatPeriod('meses')
    }
  }, [open])

  const paidLabel: Record<string, string> = {
    INCOME: 'Recebido',
    EXPENSE: 'Pago',
    TRANSFER: 'Transferido',
  }

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    try {
      const amount = parseMoney(values.amount)
      if (amount <= 0) {
        form.setError('amount', { message: 'Valor deve ser maior que zero' })
        return
      }

      if (values.type === 'TRANSFER' && values.wallet_from_id === values.wallet_to_id) {
        form.setError('wallet_to_id', { message: 'Bolso de origem e destino devem ser diferentes' })
        return
      }

      const payload = {
        type: values.type as TransactionType,
        amount,
        date: values.date,
        description: values.description,
        is_paid: values.is_paid,
        notes: values.notes?.trim() || undefined,
        ...(values.type !== 'TRANSFER'
          ? { wallet_id: values.wallet_id, category_id: values.category_id }
          : { wallet_from_id: values.wallet_from_id, wallet_to_id: values.wallet_to_id }),
      }

      const isRecurring = !isEditing && repeatEnabled && repeatCount >= 1
      const result = isEditing
        ? await updateTransaction(transaction.id, payload)
        : isRecurring
          ? await createRecurringTransactions(payload, repeatCount, repeatPeriod)
          : await createTransaction(payload)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      const successMsg = isEditing
        ? 'Movimentação atualizada com sucesso.'
        : isRecurring
          ? `${repeatCount + 1} lançamentos criados com sucesso.`
          : 'Movimentação adicionada com sucesso.'
      toast.success(successMsg)
      onOpenChange(false)
      form.reset()
    } finally {
      setIsLoading(false)
    }
  }

  const typeLabel = { INCOME: 'Entrada', EXPENSE: 'Saída', TRANSFER: 'Transferência' }[type]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Editar ${typeLabel}` : 'Nova Movimentação'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Type tabs */}
            {!isEditing && (
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <Tabs value={field.value} onValueChange={field.onChange}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="EXPENSE" className="gap-1.5">
                          <ArrowDown className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
                          Saída
                        </TabsTrigger>
                        <TabsTrigger value="INCOME" className="gap-1.5">
                          <ArrowUp className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                          Entrada
                        </TabsTrigger>
                        <TabsTrigger value="TRANSFER" className="gap-1.5">
                          <ArrowLeftRight className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
                          Transfer.
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm">
                        R$
                      </span>
                      <Input
                        value={field.value}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        type="text"
                        inputMode="numeric"
                        placeholder="0,00"
                        className="pl-9"
                        autoComplete="off"
                        onChange={(e) => field.onChange(formatCurrencyMask(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description — required */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Aluguel, Supermercado, Salário..."
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* is_paid toggle */}
            <FormField
              control={form.control}
              name="is_paid"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div className="space-y-0.5">
                      <FormLabel className="cursor-pointer text-sm font-medium">
                        {paidLabel[type] ?? 'Pago'}
                      </FormLabel>
                      <p className="text-muted-foreground text-xs">
                        {field.value
                          ? 'Esta movimentação foi efetivada'
                          : 'Pendente — ainda não efetivada'}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            {/* INCOME / EXPENSE fields */}
            {(type === 'INCOME' || type === 'EXPENSE') && (
              <>
                <FormField
                  control={form.control}
                  name="wallet_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bolso</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o bolso">
                              {wallets.find((w) => w.id === field.value)?.name}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione a categoria">
                              {categories.find((c) => c.id === field.value)?.name}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(type === 'INCOME' ? incomeCategories : expenseCategories).map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* TRANSFER fields */}
            {type === 'TRANSFER' && (
              <>
                <FormField
                  control={form.control}
                  name="wallet_from_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>De (origem)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Bolso de origem">
                              {wallets.find((w) => w.id === field.value)?.name}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wallet_to_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Para (destino)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Bolso de destino">
                              {wallets.find((w) => w.id === field.value)?.name}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Notes — optional */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Adicione uma observação..."
                      rows={2}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurrence — create mode only */}
            {!isEditing && (
              <div className="space-y-3 rounded-lg border px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Repetir movimentação</p>
                    <p className="text-muted-foreground text-xs">
                      {repeatEnabled
                        ? `Cria ${repeatCount + 1} lançamentos no total`
                        : 'Lançamento único'}
                    </p>
                  </div>
                  <Switch
                    checked={repeatEnabled}
                    onCheckedChange={setRepeatEnabled}
                    aria-label="Repetir movimentação"
                  />
                </div>

                {repeatEnabled && (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={480}
                      value={repeatCount}
                      onChange={(e) => {
                        const v = Math.max(1, Math.min(480, parseInt(e.target.value) || 1))
                        setRepeatCount(v)
                      }}
                      className="w-24"
                      aria-label="Quantidade de repetições"
                    />
                    <Select value={repeatPeriod} onValueChange={(v) => setRepeatPeriod(v as RepeatPeriod)}>
                      <SelectTrigger className="flex-1" aria-label="Período de repetição">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dias">Dia(s)</SelectItem>
                        <SelectItem value="semanas">Semana(s)</SelectItem>
                        <SelectItem value="quinzenas">Quinzena(s)</SelectItem>
                        <SelectItem value="meses">Mês/Meses</SelectItem>
                        <SelectItem value="bimestres">Bimestre(s)</SelectItem>
                        <SelectItem value="trimestres">Trimestre(s)</SelectItem>
                        <SelectItem value="semestres">Semestre(s)</SelectItem>
                        <SelectItem value="anos">Ano(s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
