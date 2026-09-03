'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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
import { createWallet, updateWallet } from '@/actions/wallets'
import { WALLET_ICONS, WALLET_COLORS } from '@/lib/constants'
import { WalletIcon } from '@/components/shared/wallet-icon'
import { cn } from '@/lib/utils'
import type { Wallet } from '@/types'

const walletFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  icon: z.string().optional(),
  color: z.string().optional(),
  initial_balance: z.number().min(0, 'Saldo inicial não pode ser negativo').default(0),
})

type WalletFormValues = z.infer<typeof walletFormSchema>

interface WalletFormProps {
  wallet?: Wallet
  onSuccess?: () => void
  onCancel?: () => void
}

export function WalletForm({ wallet, onSuccess, onCancel }: WalletFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!wallet

  const form = useForm<WalletFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(walletFormSchema) as any,
    defaultValues: {
      name: wallet?.name ?? '',
      icon: wallet?.icon ?? 'wallet',
      color: wallet?.color ?? '#7C3AED',
      initial_balance: wallet ? wallet.initial_balance / 100 : 0,
    },
  })

  const selectedIcon = form.watch('icon')
  const selectedColor = form.watch('color')

  async function onSubmit(values: WalletFormValues) {
    setIsLoading(true)
    try {
      const result = isEditing
        ? await updateWallet(wallet.id, values)
        : await createWallet(values)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(isEditing ? 'Bolso atualizado com sucesso.' : 'Bolso criado com sucesso.')
      onSuccess?.()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Preview */}
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${selectedColor ?? '#7C3AED'}20` }}
            aria-hidden="true"
          >
            <WalletIcon
              icon={selectedIcon}
              className="h-6 w-6"
              style={{ color: selectedColor ?? '#7C3AED' }}
            />
          </div>
          <div>
            <p className="font-medium">{form.watch('name') || 'Nome do bolso'}</p>
            <p className="text-muted-foreground text-sm">Pré-visualização</p>
          </div>
        </div>

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Nubank, Carteira, Poupança..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Initial balance (only for new wallets) */}
        {!isEditing && (
          <FormField
            control={form.control}
            name="initial_balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saldo inicial (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0,00"
                    value={field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Icon picker */}
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ícone</FormLabel>
              <div className="flex flex-wrap gap-2">
                {WALLET_ICONS.map((icon) => (
                  <button
                    key={icon.value}
                    type="button"
                    onClick={() => field.onChange(icon.value)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-colors',
                      field.value === icon.value
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent bg-muted hover:border-muted-foreground/30'
                    )}
                    aria-label={icon.label}
                    aria-pressed={field.value === icon.value}
                  >
                    <WalletIcon icon={icon.value} className="h-5 w-5" />
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Color picker */}
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <div className="flex flex-wrap gap-2">
                {WALLET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => field.onChange(color.value)}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-transform',
                      field.value === color.value ? 'scale-110 border-foreground' : 'border-transparent'
                    )}
                    style={{ backgroundColor: color.value }}
                    aria-label={color.label}
                    aria-pressed={field.value === color.value}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar bolso'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
