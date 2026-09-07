import { z } from 'zod'

export const createCreditCardSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  credit_limit: z.number().positive('Limite deve ser maior que zero'),
  closing_day: z
    .number()
    .int('Dia de fechamento deve ser inteiro')
    .min(1, 'Dia de fechamento deve ser entre 1 e 31')
    .max(31, 'Dia de fechamento deve ser entre 1 e 31'),
  due_day: z
    .number()
    .int('Dia de vencimento deve ser inteiro')
    .min(1, 'Dia de vencimento deve ser entre 1 e 31')
    .max(31, 'Dia de vencimento deve ser entre 1 e 31'),
})

export const updateCreditCardSchema = createCreditCardSchema.partial().extend({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
})

export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>
export type UpdateCreditCardInput = z.infer<typeof updateCreditCardSchema>
