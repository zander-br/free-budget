'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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
import { createCreditCard, updateCreditCard } from '@/actions/credit-cards'
import type { CreditCard } from '@/types'

const creditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome deve ter no máximo 50 caracteres'),
  credit_limit: z.string().min(1, 'Limite é obrigatório'),
  closing_day: z.string().min(1, 'Dia de fechamento é obrigatório'),
  due_day: z.string().min(1, 'Dia de vencimento é obrigatório'),
})

type FormValues = z.infer<typeof creditCardSchema>

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

interface CreditCardFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creditCard?: CreditCard
}

export function CreditCardForm({ open, onOpenChange, creditCard }: CreditCardFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!creditCard

  const form = useForm<FormValues>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      name: creditCard?.name ?? '',
      credit_limit: creditCard
        ? (creditCard.credit_limit / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '',
      closing_day: creditCard?.closing_day?.toString() ?? '',
      due_day: creditCard?.due_day?.toString() ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    try {
      const limitValue = parseMoney(values.credit_limit)
      if (limitValue <= 0) {
        form.setError('credit_limit', { message: 'Limite deve ser maior que zero' })
        return
      }

      const closingDay = parseInt(values.closing_day, 10)
      if (isNaN(closingDay) || closingDay < 1 || closingDay > 31) {
        form.setError('closing_day', { message: 'Dia deve ser entre 1 e 31' })
        return
      }

      const dueDay = parseInt(values.due_day, 10)
      if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
        form.setError('due_day', { message: 'Dia deve ser entre 1 e 31' })
        return
      }

      const payload = {
        name: values.name,
        credit_limit: limitValue,
        closing_day: closingDay,
        due_day: dueDay,
      }

      const result = isEditing
        ? await updateCreditCard(creditCard.id, payload)
        : await createCreditCard(payload)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(isEditing ? 'Cartão atualizado com sucesso.' : 'Cartão criado com sucesso.')
      onOpenChange(false)
      form.reset()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cartão' : 'Novo Cartão de Crédito'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do cartão</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Nubank, Inter, C6..."
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Credit Limit */}
            <FormField
              control={form.control}
              name="credit_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite do cartão</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              {/* Closing Day */}
              <FormField
                control={form.control}
                name="closing_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de fechamento</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={31}
                        placeholder="Ex: 25"
                        autoComplete="off"
                        onChange={(e) => {
                          const v = e.target.value
                          if (v === '' || (parseInt(v) >= 0 && parseInt(v) <= 31)) {
                            field.onChange(v)
                          }
                        }}
                      />
                    </FormControl>
                    <p className="text-muted-foreground text-xs">
                      Melhor dia (1 a 31)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Day */}
              <FormField
                control={form.control}
                name="due_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de vencimento</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={31}
                        placeholder="Ex: 10"
                        autoComplete="off"
                        onChange={(e) => {
                          const v = e.target.value
                          if (v === '' || (parseInt(v) >= 0 && parseInt(v) <= 31)) {
                            field.onChange(v)
                          }
                        }}
                      />
                    </FormControl>
                    <p className="text-muted-foreground text-xs">
                      Data da fatura (1 a 31)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar cartão'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
