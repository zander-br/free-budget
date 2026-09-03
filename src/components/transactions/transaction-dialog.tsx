'use client'

import { useState } from 'react'
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
import { createTransaction, updateTransaction } from '@/actions/transactions'
import { getTodayString } from '@/lib/utils/format'
import type { WalletWithBalance, Category, TransactionType, TransactionWithDetails } from '@/types'

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.string().min(1, 'Valor é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  wallet_id: z.string().optional(),
  category_id: z.string().optional(),
  wallet_from_id: z.string().optional(),
  wallet_to_id: z.string().optional(),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof transactionSchema>

function parseMoney(value: string): number {
  const clean = value.replace(/[^0-9,]/g, '').replace(',', '.')
  return parseFloat(clean) || 0
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
  const isEditing = !!transaction

  const form = useForm<FormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: transaction?.type ?? 'EXPENSE',
      amount: transaction ? String((transaction.amount / 100).toFixed(2)).replace('.', ',') : '',
      date: transaction?.date ?? getTodayString(),
      wallet_id: transaction?.wallet_id ?? '',
      category_id: transaction?.category_id ?? '',
      wallet_from_id: transaction?.wallet_from_id ?? '',
      wallet_to_id: transaction?.wallet_to_id ?? '',
      description: transaction?.description ?? '',
    },
  })

  const type = form.watch('type')
  const incomeCategories = categories.filter((c) => c.type === 'INCOME')
  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE')

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    try {
      const amount = parseMoney(values.amount)
      if (amount <= 0) {
        form.setError('amount', { message: 'Valor deve ser maior que zero' })
        return
      }

      const payload = {
        type: values.type as TransactionType,
        amount,
        date: values.date,
        description: values.description || undefined,
        ...(values.type !== 'TRANSFER'
          ? {
              wallet_id: values.wallet_id,
              category_id: values.category_id,
            }
          : {
              wallet_from_id: values.wallet_from_id,
              wallet_to_id: values.wallet_to_id,
            }),
      }

      if (values.type === 'TRANSFER' && values.wallet_from_id === values.wallet_to_id) {
        form.setError('wallet_to_id', { message: 'Bolso de origem e destino devem ser diferentes' })
        return
      }

      const result = isEditing
        ? await updateTransaction(transaction.id, payload)
        : await createTransaction(payload)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(isEditing ? 'Movimentação atualizada com sucesso.' : 'Movimentação adicionada com sucesso.')
      onOpenChange(false)
      form.reset()
    } finally {
      setIsLoading(false)
    }
  }

  const typeLabel = {
    INCOME: 'Entrada',
    EXPENSE: 'Saída',
    TRANSFER: 'Transferência',
  }[type]

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
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
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

            {/* INCOME / EXPENSE fields */}
            {(type === 'INCOME' || type === 'EXPENSE') && (
              <>
                <FormField
                  control={form.control}
                  name="wallet_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bolso</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o bolso" />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Bolso de origem" />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Bolso de destino" />
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

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Adicione uma descrição..."
                      rows={2}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
