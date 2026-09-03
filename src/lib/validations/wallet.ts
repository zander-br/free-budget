import { z } from 'zod'

export const createWalletSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  icon: z.string().optional(),
  color: z.string().optional(),
  initial_balance: z.number().min(0, 'Saldo inicial não pode ser negativo').optional(),
})

export const updateWalletSchema = createWalletSchema.partial().extend({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
})

export type CreateWalletInput = z.infer<typeof createWalletSchema>
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>
