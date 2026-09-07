'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreditCardForm } from '@/components/credit-cards/credit-card-form'

export function NewCreditCardButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" aria-hidden="true" />
        Novo cartão
      </Button>
      <CreditCardForm open={open} onOpenChange={setOpen} />
    </>
  )
}
