import { z } from 'zod'

const baseTransactionSchema = z.object({
  amount: z.number().positive('Valor deve ser maior que zero'),
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().max(200, 'Descrição deve ter no máximo 200 caracteres').optional(),
})

export const createIncomeSchema = baseTransactionSchema.extend({
  type: z.literal('INCOME'),
  wallet_id: z.string().min(1, 'Bolso é obrigatório'),
  category_id: z.string().min(1, 'Categoria é obrigatória'),
})

export const createExpenseSchema = baseTransactionSchema.extend({
  type: z.literal('EXPENSE'),
  wallet_id: z.string().min(1, 'Bolso é obrigatório'),
  category_id: z.string().min(1, 'Categoria é obrigatória'),
})

export const createTransferSchema = baseTransactionSchema
  .extend({
    type: z.literal('TRANSFER'),
    wallet_from_id: z.string().min(1, 'Bolso de origem é obrigatório'),
    wallet_to_id: z.string().min(1, 'Bolso de destino é obrigatório'),
  })
  .refine((data) => data.wallet_from_id !== data.wallet_to_id, {
    message: 'Bolso de origem e destino devem ser diferentes',
    path: ['wallet_to_id'],
  })

export const createTransactionSchema = z.discriminatedUnion('type', [
  createIncomeSchema,
  createExpenseSchema,
  createTransferSchema,
])

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type CreateTransferInput = z.infer<typeof createTransferSchema>
